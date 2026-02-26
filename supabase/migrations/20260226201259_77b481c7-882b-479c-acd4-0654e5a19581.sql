
-- ============================================
-- Fix ALL RLS policies: convert RESTRICTIVE to PERMISSIVE
-- ============================================

-- subjects
DROP POLICY IF EXISTS "Anyone can read subjects" ON public.subjects;
CREATE POLICY "Anyone can read subjects" ON public.subjects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert subjects" ON public.subjects;
CREATE POLICY "Admins can insert subjects" ON public.subjects FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update subjects" ON public.subjects;
CREATE POLICY "Admins can update subjects" ON public.subjects FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete subjects" ON public.subjects;
CREATE POLICY "Admins can delete subjects" ON public.subjects FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- topics
DROP POLICY IF EXISTS "Anyone can read topics" ON public.topics;
CREATE POLICY "Anyone can read topics" ON public.topics FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert topics" ON public.topics;
CREATE POLICY "Admins can insert topics" ON public.topics FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update topics" ON public.topics;
CREATE POLICY "Admins can update topics" ON public.topics FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete topics" ON public.topics;
CREATE POLICY "Admins can delete topics" ON public.topics FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- prompts
DROP POLICY IF EXISTS "Anyone can read prompts" ON public.prompts;
CREATE POLICY "Anyone can read prompts" ON public.prompts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert prompts" ON public.prompts;
CREATE POLICY "Admins can insert prompts" ON public.prompts FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update prompts" ON public.prompts;
CREATE POLICY "Admins can update prompts" ON public.prompts FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete prompts" ON public.prompts;
CREATE POLICY "Admins can delete prompts" ON public.prompts FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- schools
DROP POLICY IF EXISTS "Anyone can read schools" ON public.schools;
CREATE POLICY "Anyone can read schools" ON public.schools FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert schools" ON public.schools;
CREATE POLICY "Admins can insert schools" ON public.schools FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update schools" ON public.schools;
CREATE POLICY "Admins can update schools" ON public.schools FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete schools" ON public.schools;
CREATE POLICY "Admins can delete schools" ON public.schools FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- students
DROP POLICY IF EXISTS "Users read own student" ON public.students;
CREATE POLICY "Users read own student" ON public.students FOR SELECT USING ((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users insert own student" ON public.students;
CREATE POLICY "Users insert own student" ON public.students FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own student" ON public.students;
CREATE POLICY "Users update own student" ON public.students FOR UPDATE USING (user_id = auth.uid());

-- user_roles
DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT USING ((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete roles" ON public.user_roles;
CREATE POLICY "Admins delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- chat_sessions
DROP POLICY IF EXISTS "Users read own sessions" ON public.chat_sessions;
CREATE POLICY "Users read own sessions" ON public.chat_sessions FOR SELECT USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users insert own sessions" ON public.chat_sessions;
CREATE POLICY "Users insert own sessions" ON public.chat_sessions FOR INSERT WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users update own sessions" ON public.chat_sessions;
CREATE POLICY "Users update own sessions" ON public.chat_sessions FOR UPDATE USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users delete own sessions" ON public.chat_sessions;
CREATE POLICY "Users delete own sessions" ON public.chat_sessions FOR DELETE USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- chat_messages
DROP POLICY IF EXISTS "Users read own messages" ON public.chat_messages;
CREATE POLICY "Users read own messages" ON public.chat_messages FOR SELECT USING (session_id IN (SELECT cs.id FROM chat_sessions cs JOIN students s ON cs.student_id = s.id WHERE s.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users insert own messages" ON public.chat_messages;
CREATE POLICY "Users insert own messages" ON public.chat_messages FOR INSERT WITH CHECK (session_id IN (SELECT cs.id FROM chat_sessions cs JOIN students s ON cs.student_id = s.id WHERE s.user_id = auth.uid()));

-- ============================================
-- Seed demo data
-- ============================================

-- Subjects
INSERT INTO public.subjects (name) VALUES ('מתמטיקה'), ('אנגלית')
ON CONFLICT DO NOTHING;

-- Topics for Math
INSERT INTO public.topics (subject_id, name)
SELECT s.id, t.name
FROM public.subjects s
CROSS JOIN (VALUES ('אלגברה'), ('שברים'), ('פונקציות')) AS t(name)
WHERE s.name = 'מתמטיקה'
ON CONFLICT DO NOTHING;

-- Topics for English
INSERT INTO public.topics (subject_id, name)
SELECT s.id, t.name
FROM public.subjects s
CROSS JOIN (VALUES ('Present Simple'), ('Past Simple'), ('Reading Comprehension')) AS t(name)
WHERE s.name = 'אנגלית'
ON CONFLICT DO NOTHING;

-- Prompts for Math topics
INSERT INTO public.prompts (subject_id, topic_id, system_prompt, assistant_instructions, language)
SELECT sub.id, t.id,
  'אתה מורה למתמטיקה מעולה. עזור לתלמיד להבין את הנושא צעד אחרי צעד. תן דוגמאות ובדוק הבנה. אל תיתן תשובה ישירה.',
  'הנושא הנוכחי: ' || t.name || '. אם התלמיד שואל משהו לא קשור, הפנה אותו בחזרה לנושא.',
  'he'
FROM public.subjects sub
JOIN public.topics t ON t.subject_id = sub.id
WHERE sub.name = 'מתמטיקה'
ON CONFLICT DO NOTHING;

-- Prompts for English topics
INSERT INTO public.prompts (subject_id, topic_id, system_prompt, assistant_instructions, language)
SELECT sub.id, t.id,
  'You are an excellent English teacher for Hebrew-speaking students. Explain concepts step by step in Hebrew, give examples in English, and check understanding. Never give direct answers without explanation.',
  'Current topic: ' || t.name || '. If the student asks something unrelated, redirect them back to this topic.',
  'he'
FROM public.subjects sub
JOIN public.topics t ON t.subject_id = sub.id
WHERE sub.name = 'אנגלית'
ON CONFLICT DO NOTHING;
