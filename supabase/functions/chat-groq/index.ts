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
      console.error("OPENAI_API_KEY is not set");
      return new Response(JSON.stringify({ answer: "שירות AI לא מוגדר. חסר מפתח OpenAI." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log key prefix for debugging (safe - only first 8 chars)
    console.log("Using OpenAI key starting with:", openaiApiKey.substring(0, 8) + "...");

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
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (prompt) {
      systemPrompt = prompt.system_prompt;
      assistantInstructions = prompt.assistant_instructions || "";
    }

    const fullSystem = systemPrompt + (assistantInstructions ? "\n\n" + assistantInstructions : "");

    console.log("Prompt found:", !!prompt, "Subject:", subjectId, "Topic:", topicId);
    console.log("System prompt length:", fullSystem.length);
    console.log("System prompt preview:", fullSystem.substring(0, 200));

    // Build user content for Chat Completions API
    let userContent: any;
    if (imageBase64) {
      userContent = [
        { type: "text", text: message },
        { type: "image_url", image_url: { url: imageBase64 } },
      ];
    } else {
      userContent = message;
    }

    // Call OpenAI Chat Completions API with gpt-4o-mini
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: fullSystem },
          { role: "user", content: userContent },
        ],
        temperature: 0.3,
        max_tokens: 600,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errorText = await aiResponse.text();
      console.error("OpenAI API error:", status, errorText);

      if (status === 429) {
        return new Response(JSON.stringify({ answer: "יותר מדי בקשות, נסה שוב בעוד דקה." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 401) {
        return new Response(JSON.stringify({ answer: "בעיה עם מפתח OpenAI. פנה למנהל המערכת.", debug: errorText }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If image couldn't be read
      if (imageBase64 && status === 400) {
        return new Response(JSON.stringify({ answer: "לא הצלחתי לזהות את התרגיל בתמונה. אפשר לנסות לצלם שוב או לכתוב את התרגיל בצ'אט." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ answer: "שגיאה בשירות AI. נסה שוב.", debug: errorText }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const answer = aiData.choices?.[0]?.message?.content || "שגיאה בקבלת תשובה";

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
