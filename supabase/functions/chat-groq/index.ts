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
    const { session_id, message } = await req.json();
    if (!session_id || !message) {
      return new Response(JSON.stringify({ error: "session_id and message required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const groqApiKey = Deno.env.get("GROQ_API_KEY")!;

    // User client for auth check
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: authHeader! } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service client for DB operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get student info
    const { data: student } = await supabase
      .from("students")
      .select("id, school_id, grade")
      .eq("user_id", user.id)
      .single();

    if (!student) {
      return new Response(JSON.stringify({ error: "Student not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get session info
    const { data: session } = await supabase
      .from("chat_sessions")
      .select("subject_id, topic_id")
      .eq("id", session_id)
      .eq("student_id", student.id)
      .single();

    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save user message
    await supabase.from("chat_messages").insert({
      session_id,
      role: "user",
      content: message,
    });

    // Find prompt with priority logic
    let systemPrompt = "אתה מורה חכם ומסביר. הסבר בשלבים, תן דוגמאות, ובדוק הבנה. אל תיתן תשובה ישירה בלי הסבר.";
    let assistantInstructions = "";

    if (session.subject_id && session.topic_id) {
      // Priority 1: school + grade + subject + topic
      let { data: prompt } = await supabase
        .from("prompts")
        .select("system_prompt, assistant_instructions")
        .eq("subject_id", session.subject_id)
        .eq("topic_id", session.topic_id)
        .eq("school_id", student.school_id)
        .eq("grade", student.grade)
        .eq("active", true)
        .limit(1)
        .maybeSingle();

      // Priority 2: school only
      if (!prompt && student.school_id) {
        const { data: p2 } = await supabase
          .from("prompts")
          .select("system_prompt, assistant_instructions")
          .eq("subject_id", session.subject_id)
          .eq("topic_id", session.topic_id)
          .eq("school_id", student.school_id)
          .is("grade", null)
          .eq("active", true)
          .limit(1)
          .maybeSingle();
        prompt = p2;
      }

      // Priority 3: general (school_id is null)
      if (!prompt) {
        const { data: p3 } = await supabase
          .from("prompts")
          .select("system_prompt, assistant_instructions")
          .eq("subject_id", session.subject_id)
          .eq("topic_id", session.topic_id)
          .is("school_id", null)
          .eq("active", true)
          .limit(1)
          .maybeSingle();
        prompt = p3;
      }

      if (prompt) {
        systemPrompt = prompt.system_prompt;
        assistantInstructions = prompt.assistant_instructions || "";
      }
    }

    // Get last 10 messages
    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", session_id)
      .order("created_at", { ascending: true })
      .limit(10);

    const messages: { role: string; content: string }[] = [
      { role: "system", content: systemPrompt + (assistantInstructions ? "\n\n" + assistantInstructions : "") },
    ];

    if (history) {
      for (const m of history) {
        messages.push({ role: m.role, content: m.content });
      }
    }

    // Call Groq
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages,
        temperature: 0.3,
        max_tokens: 700,
      }),
    });

    const groqData = await groqResponse.json();
    const assistantContent = groqData.choices?.[0]?.message?.content || "שגיאה בקבלת תשובה";

    // Save assistant message
    await supabase.from("chat_messages").insert({
      session_id,
      role: "assistant",
      content: assistantContent,
    });

    // Update session timestamp
    await supabase
      .from("chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", session_id);

    return new Response(JSON.stringify({ content: assistantContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
