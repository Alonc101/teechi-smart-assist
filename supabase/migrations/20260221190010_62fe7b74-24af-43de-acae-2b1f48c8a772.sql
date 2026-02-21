
-- Fix all RESTRICTIVE policies to PERMISSIVE
-- Drop and recreate all policies

-- ====== chat_messages ======
DROP POLICY IF EXISTS "Users insert own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users read own messages" ON public.chat_messages;

CREATE POLICY "Users insert own messages" ON public.chat_messages
FOR INSERT TO authenticated
WITH CHECK (session_id IN (
  SELECT cs.id FROM chat_sessions cs JOIN students s ON cs.student_id = s.id WHERE s.user_id = auth.uid()
));

CREATE POLICY "Users read own messages" ON public.chat_messages
FOR SELECT TO authenticated
USING (session_id IN (
  SELECT cs.id FROM chat_sessions cs JOIN students s ON cs.student_id = s.id WHERE s.user_id = auth.uid()
));

-- ====== chat_sessions ======
DROP POLICY IF EXISTS "Users delete own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users insert own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users read own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users update own sessions" ON public.chat_sessions;

CREATE POLICY "Users delete own sessions" ON public.chat_sessions
FOR DELETE TO authenticated
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Users insert own sessions" ON public.chat_sessions
FOR INSERT TO authenticated
WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Users read own sessions" ON public.chat_sessions
FOR SELECT TO authenticated
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Users update own sessions" ON public.chat_sessions
FOR UPDATE TO authenticated
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- ====== prompts ======
DROP POLICY IF EXISTS "Admins can delete prompts" ON public.prompts;
DROP POLICY IF EXISTS "Admins can insert prompts" ON public.prompts;
DROP POLICY IF EXISTS "Admins can update prompts" ON public.prompts;
DROP POLICY IF EXISTS "Anyone can read active prompts" ON public.prompts;

CREATE POLICY "Admins can delete prompts" ON public.prompts
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert prompts" ON public.prompts
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update prompts" ON public.prompts
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read prompts" ON public.prompts
FOR SELECT TO authenticated
USING (true);

-- ====== schools ======
DROP POLICY IF EXISTS "Admins can delete schools" ON public.schools;
DROP POLICY IF EXISTS "Admins can insert schools" ON public.schools;
DROP POLICY IF EXISTS "Admins can update schools" ON public.schools;
DROP POLICY IF EXISTS "Anyone can read schools" ON public.schools;

CREATE POLICY "Admins can delete schools" ON public.schools
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert schools" ON public.schools
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update schools" ON public.schools
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read schools" ON public.schools
FOR SELECT TO authenticated
USING (true);

-- ====== students ======
DROP POLICY IF EXISTS "Users insert own student" ON public.students;
DROP POLICY IF EXISTS "Users read own student" ON public.students;
DROP POLICY IF EXISTS "Users update own student" ON public.students;

CREATE POLICY "Users insert own student" ON public.students
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users read own student" ON public.students
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users update own student" ON public.students
FOR UPDATE TO authenticated
USING (user_id = auth.uid());

-- ====== subjects ======
DROP POLICY IF EXISTS "Admins can delete subjects" ON public.subjects;
DROP POLICY IF EXISTS "Admins can insert subjects" ON public.subjects;
DROP POLICY IF EXISTS "Admins can update subjects" ON public.subjects;
DROP POLICY IF EXISTS "Anyone can read subjects" ON public.subjects;

CREATE POLICY "Admins can delete subjects" ON public.subjects
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert subjects" ON public.subjects
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update subjects" ON public.subjects
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read subjects" ON public.subjects
FOR SELECT TO authenticated
USING (true);

-- ====== topics ======
DROP POLICY IF EXISTS "Admins can delete topics" ON public.topics;
DROP POLICY IF EXISTS "Admins can insert topics" ON public.topics;
DROP POLICY IF EXISTS "Admins can update topics" ON public.topics;
DROP POLICY IF EXISTS "Anyone can read topics" ON public.topics;

CREATE POLICY "Admins can delete topics" ON public.topics
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert topics" ON public.topics
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update topics" ON public.topics
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read topics" ON public.topics
FOR SELECT TO authenticated
USING (true);

-- ====== user_roles ======
DROP POLICY IF EXISTS "Admins delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;

CREATE POLICY "Admins delete roles" ON public.user_roles
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own roles" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
