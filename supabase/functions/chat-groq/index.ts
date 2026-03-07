import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, subjectId, topicId, imageBase64 } = await req.json();
    if (!message || !subjectId || !topicId) {
      return new Response(JSON.stringify({ error: "message, subjectId, and topicId are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      return new Response(JSON.stringify({ answer: "שירות AI לא מוגדר. חסר מפתח OpenAI." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate subject/topic exist
    const { data: topic } = await supabase
      .from("topics")
      .select("id, name")
      .eq("id", topicId)
      .eq("subject_id", subjectId)
      .single();

    if (!topic) {
      return new Response(JSON.stringify({ error: "Invalid subject/topic combination" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch prompt
    let systemPrompt = "אתה מורה פרטי למתמטיקה לתלמידים בישראל. כשתלמיד שולח תרגיל מתמטיקה: הסבר בבהירות בעברית, פתור שלב אחרי שלב, אל תדלג על שלבים, עודד הבנה במקום רק לתת תשובה.";
    let assistantInstructions = "";

    const { data: prompt } = await supabase
      .from("prompts")
      .select("system_prompt, assistant_instructions")
      .eq("subject_id", subjectId)
      .eq("topic_id", topicId)
      .eq("active", true)
      .eq("language", "he")
      .limit(1)
      .maybeSingle();

    if (prompt) {
      systemPrompt = prompt.system_prompt;
      assistantInstructions = prompt.assistant_instructions || "";
    }

    const fullSystem = systemPrompt + (assistantInstructions ? "\n\n" + assistantInstructions : "");

    // Build input content for OpenAI Responses API
    let userContent: any[];
    if (imageBase64) {
      userContent = [
        { type: "input_text", text: fullSystem + "\n\n" + message },
        { type: "input_image", image_url: imageBase64 },
      ];
    } else {
      userContent = [
        { type: "input_text", text: fullSystem + "\n\n" + message },
      ];
    }

    // Call OpenAI Responses API with gpt-4o-mini
    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [
          {
            role: "user",
            content: userContent,
          },
        ],
        temperature: 0.3,
        max_output_tokens: 600,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ answer: "יותר מדי בקשות, נסה שוב בעוד דקה." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402 || status === 401) {
        return new Response(JSON.stringify({ answer: "בעיה עם מפתח OpenAI. פנה למנהל המערכת." }), {
          status: status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("OpenAI API error:", status, errorText);

      // If image couldn't be read
      if (imageBase64 && (status === 400 || errorText.includes("image"))) {
        return new Response(JSON.stringify({ answer: "לא הצלחתי לזהות את התרגיל בתמונה. אפשר לנסות לצלם שוב או לכתוב את התרגיל בצ'אט." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ answer: "שגיאה בשירות AI. נסה שוב." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    // Responses API returns output array with message items
    let answer = "שגיאה בקבלת תשובה";
    if (aiData.output) {
      for (const item of aiData.output) {
        if (item.type === "message" && item.content) {
          for (const block of item.content) {
            if (block.type === "output_text") {
              answer = block.text;
              break;
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
