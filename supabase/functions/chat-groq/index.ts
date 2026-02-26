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
    const { message, subjectId, topicId } = await req.json();
    if (!message || !subjectId || !topicId) {
      return new Response(JSON.stringify({ error: "message, subjectId, and topicId are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const groqApiKey = Deno.env.get("GROQ_API_KEY")!;

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
    let systemPrompt = "אתה מורה חכם ומסביר. הסבר בשלבים, תן דוגמאות, ובדוק הבנה. אל תיתן תשובה ישירה בלי הסבר.";
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

    // Call Groq (no history in this version)
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: fullSystem },
          { role: "user", content: message },
        ],
        temperature: 0.3,
        max_tokens: 700,
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error("Groq API error:", groqResponse.status, errorText);
      return new Response(JSON.stringify({ answer: "שגיאה בשירות AI. נסה שוב מאוחר יותר." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const groqData = await groqResponse.json();
    console.log("Groq response:", JSON.stringify(groqData).substring(0, 200));
    const answer = groqData.choices?.[0]?.message?.content || "שגיאה בקבלת תשובה";

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
