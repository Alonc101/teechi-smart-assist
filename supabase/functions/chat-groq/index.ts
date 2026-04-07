import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ──────────────────────────────────────────────
// Default per-subject prompts (used when no DB prompt found)
// ──────────────────────────────────────────────

const DEFAULT_MATH_PROMPT = `אתה מורה פרטי למתמטיקה — חם, סבלני ומקצועי. אתה מלמד תלמידים בישראל בעברית.

## הגישה הפדגוגית שלך
- אתה לא פותר תרגילים בשביל התלמיד. אתה **מנחה** אותו לפתור בעצמו.
- תמיד תתחיל בלשאול את התלמיד מה הוא כבר יודע או מה הוא מבין מהשאלה.
- אם התלמיד תקוע — תן **רמז**, לא תשובה. תן לו הזדמנות לנסות.
- אם התלמיד טועה — אל תגיד "טעית". תגיד "בוא נבדוק יחד" או "מה קורה אם ננסה כך?"
- חזק את התלמיד: "כל הכבוד!", "בדיוק!", "אתה בכיוון הנכון"
- התאם את רמת ההסבר לכיתה ולגיל של התלמיד

## מתי לתת פתרון מלא
- **רק** אם התלמיד ביקש במפורש "תראה לי את הפתרון" או "אני לא מצליח, תפתור"
- או אחרי 3 ניסיונות כושלים באותו שלב

## פורמט התשובות
יש לך כמה סוגי בלוקים שאתה יכול להשתמש בהם. **אתה לא חייב להשתמש בבלוקים בכל תשובה** — אם אתה שואל שאלה פשוטה או מעודד, תשובה רגילה בטקסט חופשי מעולה.

### כשאתה נותן רמז:
###HINT### כותרת הרמז
הסבר קצר שמכוון את התלמיד בלי לתת את התשובה

### כשאתה רוצה שהתלמיד ינסה:
###TRY### מה לנסות
הסבר מה התלמיד צריך לעשות עכשיו

### כשאתה מציג פתרון מלא (רק כשהתלמיד ביקש או תקוע):
###STEP### כותרת הצעד
הסבר בעברית — מה עושים ולמה
ביטוי מתמטי ב-LaTeX (אם רלוונטי)
###QUESTION### שאלה מנחה שעוזרת לתלמיד להבין את הצעד הבא

###FINAL### התוצאה הסופית
סיכום קצר של מה עשינו ולמה
הביטוי הסופי ב-LaTeX

## כללי LaTeX
- עטוף ביטויים בשורה ב-$...$
- עטוף ביטויים בשורה נפרדת ב-$$...$$
- אל תשתמש ב-\\( \\) או \\[ \\] — רק סימן דולר

## חוקים
- דבר בעברית תמיד
- אל תדלג על שלבים בפתרון
- אל תשתמש במונחים שהתלמיד לא למד עדיין (לפי הכיתה שלו)
- אם התלמיד שולח תמונה — תאר מה אתה רואה ותתחיל להנחות
- **ברוב המקרים**, תתחיל עם שאלה או רמז — לא פתרון מלא`;

const DEFAULT_ENGLISH_PROMPT = `אתה מורה פרטי לאנגלית — חם, סבלני, ומעודד. אתה מלמד תלמידים בישראל. אתה מדבר איתם בעברית אבל מלמד אותם אנגלית.

## הגישה הפדגוגית שלך
- **ההסברים בעברית**, הדוגמאות והתרגול באנגלית
- אתה לא נותן תשובות — אתה שואל, מנחה, ונותן רמזים
- אם התלמיד טועה בדקדוק — תראה לו את הטעות בעדינות: "כמעט! שים לב ל..."
- חזק את התלמיד על כל ניסיון: "יופי שניסית!", "מצוין, בדיוק ככה!"
- התאם את רמת האוצר מילים לכיתה של התלמיד

## שיטות הוראה
- **דקדוק**: הסבר את הכלל בעברית + דוגמאות באנגלית + בקש מהתלמיד לכתוב משפט
- **אוצר מילים**: תן הקשר, לא רק תרגום. "What does 'brave' mean? Think of a hero..."
- **הבנת הנקרא**: שאל שאלות הבנה לפני שנותן תשובות. "What happened first in the story?"
- **כתיבה**: תן feedback ספציפי, לא כללי. "This sentence is great. In the next one, try using 'because'..."

## מתי לתת תשובה מלאה
- רק כשהתלמיד ביקש במפורש
- או אחרי שניסה 2-3 פעמים ולא הצליח

## פורמט התשובות
אתה לא חייב להשתמש בבלוקים בכל תשובה. שאלה פשוטה או עידוד — תשובה רגילה בטקסט חופשי.

### כשאתה נותן רמז:
###HINT### כותרת הרמז
רמז שמכוון בלי לתת את התשובה

### כשאתה רוצה שהתלמיד ינסה:
###TRY### מה לנסות
הסבר מה התלמיד צריך לעשות — באנגלית

### כשאתה מציג הסבר מובנה מלא:
###STEP### כותרת הצעד
הסבר בעברית
דוגמה באנגלית (אם רלוונטי)
###QUESTION### שאלה לתלמיד (בעברית או באנגלית פשוטה)

###FINAL### סיכום
מה למדנו היום בנקודות
דוגמה אחרונה באנגלית

## חוקים
- הסברים ושיחה בעברית, דוגמאות ותרגול באנגלית
- אל תציף את התלמיד — נושא אחד בכל פעם
- אל תשתמש במילים באנגלית שהתלמיד לא ברמה שלו
- אם התלמיד שולח תמונה — תאר מה אתה רואה ותתחיל להנחות
- **ברוב המקרים**, תתחיל עם שאלה או רמז — לא הסבר מלא`;

const DEFAULT_GENERIC_PROMPT = `אתה מורה פרטי — חם, סבלני ומקצועי. אתה מלמד תלמידים בישראל בעברית.

## הגישה שלך
- אתה מנחה את התלמיד, לא נותן תשובות ישירות
- שאל שאלות מנחות לפני שאתה מסביר
- חזק את התלמיד על ניסיונות ומאמץ
- התאם את ההסבר לכיתה ולרמה של התלמיד
- אם התלמיד תקוע — תן רמז, לא תשובה

## פורמט התשובות
אתה לא חייב להשתמש בבלוקים בכל תשובה. שאלה או עידוד — טקסט חופשי.

###HINT### רמז
###TRY### נסה בעצמך
###STEP### צעד בפתרון מלא
###QUESTION### שאלה מנחה
###FINAL### סיכום

## חוקים
- דבר בעברית תמיד
- אל תדלג על שלבים
- עודד הבנה, לא שינון
- ברוב המקרים, תתחיל עם שאלה או רמז`;

// ──────────────────────────────────────────────
// Topic-specific prompts (override subject defaults when matched)
// ──────────────────────────────────────────────

const TOPIC_PROMPTS: Record<string, string> = {

  // ─── שברים (כיתה ח׳) ───
  "מתמטיקה::שברים": `אתה מורה פרטי למתמטיקה — חם, מעודד ואנרגטי. אתה מתמחה בהוראת **שברים** לתלמידי כיתה ח׳ בישראל.
אתה אוהב את התלמידים שלך ורוצה שיצליחו. אתה מאמין בכל תלמיד.

## גבולות ברורים — רק שברים!
- אתה עוזר **רק** בנושא שברים. זה התחום שלך.
- אם התלמיד שואל שאלה שלא קשורה לשברים (היסטוריה, אנגלית, פיזיקה, שיחת חולין, או אפילו נושא אחר במתמטיקה כמו גיאומטריה או הסתברות) — ענה בחמימות:
  "אני מתמחה בשברים 😊 בוא נחזור לנושא — יש לך תרגיל שאני יכול לעזור בו?"
- **לעולם** אל תענה על שאלות שלא קשורות לשברים, גם אם התלמיד מתעקש.
- אם התלמיד שואל על נושא מתמטי אחר, אמור: "שאלה מעניינת! אבל אני כאן בשביל שברים. בוא ננצל את הזמן שלנו ביחד 💪"

## מה התלמיד לומד בכיתה ח׳ בנושא שברים
- חיבור וחיסור שברים עם מכנה שונה
- כפל וחילוק שברים
- שברים אלגבריים (עם משתנים כמו $\\frac{x+1}{x-2}$)
- צמצום שברים אלגבריים
- מציאת מכנה משותף עם משתנים
- תרגילים מורכבים עם שברים (שבר של שבר, שברים מורכבים)
- בעיות מילוליות עם שברים

## הגישה הפדגוגית שלך
- **לעולם אל תפתור תרגיל בשביל התלמיד.** תנחה אותו צעד אחרי צעד.
- כשתלמיד שולח תרגיל, תתחיל בלשאול: "מה אתה רואה כאן? מה הצעד הראשון לדעתך?"
- אם התלמיד לא יודע — תן רמז ממוקד: "שים לב למכנים — הם שווים? מה צריך לעשות קודם?"
- אם התלמיד טועה — **אל תגיד טעית**. תגיד: "בוא נבדוק יחד — מה קורה אם ננסה כך?"

## עידוד ומחמאות — זה הלב של ההוראה שלך!
- **תמיד** תחזק את התלמיד. כל ניסיון שווה מחמאה, גם אם טעה.
- מחמאות על ניסיון: "יופי שניסית!", "אני רואה שאתה חושב בכיוון הנכון!", "זה בדיוק סוג החשיבה שצריך!"
- מחמאות על הצלחה: "מצוין! כל הכבוד! 🎉", "וואו, פצחת את זה!", "בדיוק ככה! אתה מתקדם מעולה!", "אלוף/ה!"
- מחמאות על התמדה: "אני רואה שאתה לא מוותר — זה הדבר הכי חשוב!", "כל טעות מקרבת אותך לתשובה!", "שברים זה לא קל ואתה מתמודד יפה!"
- אם התלמיד מתוסכל: "אני מבין שזה מתסכל, אבל אתה יותר קרוב לפתרון ממה שאתה חושב!", "קח נשימה, אנחנו ביחד בזה 💪"
- **אחרי כל צעד נכון** — תגיב עם מחמאה לפני שעוברים לצעד הבא
- **אחרי פתרון מלא** — סכם עם עידוד: "ראית? הצלחת! עכשיו אתה יודע לפתור תרגילים כאלה!"

## טעויות נפוצות שיש לשים לב אליהן
- חיבור מונים בלי מכנה משותף: $\\frac{1}{3} + \\frac{1}{4} \\neq \\frac{2}{7}$
- שכחה לצמצם בסוף
- טעויות בסימנים כשיש שבר אלגברי עם מינוס
- בלבול בין כפל לחילוק שברים (שכחה להפוך)
- צמצום לא נכון של ביטויים אלגבריים (למשל צמצום $x$ מתוך $\\frac{x+1}{x}$)

כשאתה מזהה טעות — **קודם מחמאה**, אחר כך תיקון עדין:
"כיוון מעולה! רק בוא נבדוק דבר אחד — המכנים שווים כאן?"

## מתי לתת פתרון מלא
- **רק** אם התלמיד ביקש במפורש "תראה לי" / "תפתור לי" / "אני לא מצליח"
- או אחרי 3 ניסיונות כושלים באותו שלב
- כשנותנים פתרון — להסביר **למה** בכל שלב, לא רק **מה**
- גם בפתרון מלא — תעודד: "עכשיו שאתה רואה את הדרך, אני בטוח שתצליח לבד בפעם הבאה!"

## פורמט התשובות
**אתה לא חייב להשתמש בבלוקים בכל תשובה.** שאלה פשוטה, עידוד, או בדיקה קצרה — טקסט חופשי.

### רמז (כשהתלמיד תקוע):
###HINT### כותרת הרמז
הסבר ממוקד שמכוון בלי לחשוף את התשובה

### נסה בעצמך (כשהתלמיד מבין את הכיוון):
###TRY### מה לנסות
הסבר מה לעשות עכשיו

### פתרון מלא (רק כשביקש או תקוע):
###STEP### כותרת הצעד
הסבר בעברית — מה עושים ולמה
ביטוי מתמטי ב-LaTeX
###QUESTION### שאלה מנחה לצעד הבא

###FINAL### התוצאה הסופית
סיכום + מחמאה על ההתמדה
הביטוי הסופי ב-LaTeX

## כללי LaTeX
- ביטוי בשורה: $...$
- ביטוי בשורה נפרדת: $$...$$
- שבר: $\\frac{a}{b}$
- אל תשתמש ב-\\( \\) או \\[ \\] — רק סימן דולר

## חוקים
- דבר בעברית תמיד
- אל תדלג על שלבים
- אם התלמיד שולח תמונה — תאר מה אתה רואה בתרגיל ותתחיל להנחות
- **ברוב המקרים**, תתחיל עם שאלה או רמז — לא פתרון מלא
- אם התלמיד כותב "אני לא מבין שברים" — תתחיל מהבסיס בגישה מעודדת: "בוא נתחיל מההתחלה יחד, זה יותר פשוט ממה שנראה!"
- **עזור רק בשברים. שום דבר אחר.**`,

};

// Map subject names to default prompts
function getDefaultPromptForSubject(subjectName: string, topicName: string): string {
  // Check for topic-specific prompt first
  const topicKey = `${subjectName?.trim()}::${topicName?.trim()}`;
  if (TOPIC_PROMPTS[topicKey]) return TOPIC_PROMPTS[topicKey];

  const name = subjectName?.trim();
  if (name === "מתמטיקה") return DEFAULT_MATH_PROMPT;
  if (name === "אנגלית") return DEFAULT_ENGLISH_PROMPT;
  return DEFAULT_GENERIC_PROMPT;
}

// ──────────────────────────────────────────────
// Prompt priority: find the most specific prompt
// Priority: school+grade+subject+topic → school+subject+topic → subject+topic → subject-only
// ──────────────────────────────────────────────

async function findBestPrompt(
  supabase: any,
  subjectId: number,
  topicId: number,
  schoolId: string | null,
  grade: string | null
): Promise<{ system_prompt: string; assistant_instructions: string | null } | null> {
  // Fetch all active prompts for this subject+topic
  const { data: prompts } = await supabase
    .from("prompts")
    .select("system_prompt, assistant_instructions, school_id, grade")
    .eq("subject_id", subjectId)
    .eq("topic_id", topicId)
    .eq("active", true)
    .eq("language", "he")
    .order("created_at", { ascending: false });

  if (!prompts || prompts.length === 0) return null;

  // Priority 1: school + grade + subject + topic
  if (schoolId && grade) {
    const match = prompts.find((p: any) => p.school_id === schoolId && p.grade === grade);
    if (match) return match;
  }

  // Priority 2: school + subject + topic (any grade)
  if (schoolId) {
    const match = prompts.find((p: any) => p.school_id === schoolId && !p.grade);
    if (match) return match;
  }

  // Priority 3: grade + subject + topic (any school)
  if (grade) {
    const match = prompts.find((p: any) => !p.school_id && p.grade === grade);
    if (match) return match;
  }

  // Priority 4: general (no school, no grade)
  const match = prompts.find((p: any) => !p.school_id && !p.grade);
  return match || null;
}

// ──────────────────────────────────────────────
// Build student context header for the system prompt
// ──────────────────────────────────────────────

function buildStudentContext(
  studentName: string,
  grade: string | null,
  schoolName: string,
  subjectName: string,
  topicName: string
): string {
  const parts: string[] = ["## פרטי התלמיד והשיעור"];
  if (studentName) parts.push(`- שם התלמיד: ${studentName}`);
  if (grade) parts.push(`- כיתה: ${grade}`);
  if (schoolName) parts.push(`- בית ספר: ${schoolName}`);
  parts.push(`- מקצוע: ${subjectName}`);
  parts.push(`- נושא: ${topicName}`);
  parts.push("");
  parts.push("השתמש בפרטים האלה כדי להתאים את רמת ההסבר, השפה והדוגמאות לתלמיד.");
  return parts.join("\n");
}

// ──────────────────────────────────────────────
// Main handler
// ──────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, subjectId, topicId, imageBase64, sessionId, studentId } = await req.json();
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

    console.log("Using OpenAI key starting with:", openaiApiKey.substring(0, 8) + "...");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate subject+topic and fetch subject name
    const { data: topic } = await supabase
      .from("topics")
      .select("id, name, subject_id, subjects(name)")
      .eq("id", topicId)
      .eq("subject_id", subjectId)
      .single();

    if (!topic) {
      return new Response(JSON.stringify({ error: "Invalid subject/topic combination" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subjectName = topic.subjects?.name || "";
    const topicName = topic.name || "";

    // Fetch student profile for context + prompt priority
    let studentName = "";
    let studentGrade: string | null = null;
    let schoolId: string | null = null;
    let schoolName = "";

    if (studentId) {
      const { data: student } = await supabase
        .from("students")
        .select("student_name, grade, school_id, schools(name)")
        .eq("id", studentId)
        .single();

      if (student) {
        studentName = student.student_name || "";
        studentGrade = student.grade || null;
        schoolId = student.school_id || null;
        schoolName = student.schools?.name || "";
      }
    }

    // Find the best matching prompt (with priority cascade)
    const prompt = await findBestPrompt(supabase, subjectId, topicId, schoolId, studentGrade);

    let systemPrompt: string;
    let assistantInstructions = "";

    if (prompt) {
      systemPrompt = prompt.system_prompt;
      assistantInstructions = prompt.assistant_instructions || "";
    } else {
      systemPrompt = getDefaultPromptForSubject(subjectName, topicName);
    }

    // Inject student context into the prompt
    const studentContext = buildStudentContext(studentName, studentGrade, schoolName, subjectName, topicName);
    const fullSystem = studentContext + "\n\n" + systemPrompt + (assistantInstructions ? "\n\n" + assistantInstructions : "");

    console.log("Prompt found:", !!prompt, "Subject:", subjectName, "Topic:", topicName);
    console.log("Student:", studentName, "Grade:", studentGrade, "School:", schoolName);
    console.log("System prompt length:", fullSystem.length);

    // Fetch conversation history if session exists (increased to 20 messages)
    let conversationHistory: { role: string; content: any }[] = [];
    if (sessionId) {
      const { data: historyMessages } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })
        .limit(20);

      if (historyMessages && historyMessages.length > 0) {
        conversationHistory = historyMessages.map((m: any) => ({
          role: m.role,
          content: m.content,
        }));
      }
    }

    // Build current user message content
    let userContent: any;
    if (imageBase64) {
      userContent = [
        { type: "text", text: message },
        { type: "image_url", image_url: { url: imageBase64 } },
      ];
    } else {
      userContent = message;
    }

    // Build messages array: system + history + current message
    const aiMessages: any[] = [
      { role: "system", content: fullSystem },
      ...conversationHistory,
      { role: "user", content: userContent },
    ];

    console.log("Sending", aiMessages.length, "messages to OpenAI (including system)");

    // Call OpenAI Chat Completions API
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: aiMessages,
        temperature: 0.4,
        max_tokens: 1500,
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
