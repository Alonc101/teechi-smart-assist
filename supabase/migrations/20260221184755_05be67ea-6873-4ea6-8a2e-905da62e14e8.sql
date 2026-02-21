
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- Create schools table
CREATE TABLE public.schools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create students table (profiles)
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  student_name TEXT NOT NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  grade TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create subjects table
CREATE TABLE public.subjects (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Create topics table
CREATE TABLE public.topics (
  id BIGSERIAL PRIMARY KEY,
  subject_id BIGINT REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  UNIQUE (subject_id, name)
);

-- Create prompts table
CREATE TABLE public.prompts (
  id BIGSERIAL PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  grade TEXT,
  subject_id BIGINT REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  topic_id BIGINT REFERENCES public.topics(id) ON DELETE CASCADE NOT NULL,
  language TEXT NOT NULL DEFAULT 'he',
  system_prompt TEXT NOT NULL,
  assistant_instructions TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chat_sessions table
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'צ׳אט חדש',
  subject_id BIGINT REFERENCES public.subjects(id) ON DELETE SET NULL,
  topic_id BIGINT REFERENCES public.topics(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Schools: everyone can read, admin can manage
CREATE POLICY "Anyone can read schools" ON public.schools FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert schools" ON public.schools FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update schools" ON public.schools FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete schools" ON public.schools FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Students: user can read/update own, admin can read all
CREATE POLICY "Users read own student" ON public.students FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own student" ON public.students FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own student" ON public.students FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- User roles: admin can manage, users can read own
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Subjects: everyone can read, admin can manage
CREATE POLICY "Anyone can read subjects" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert subjects" ON public.subjects FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update subjects" ON public.subjects FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete subjects" ON public.subjects FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Topics: everyone can read, admin can manage
CREATE POLICY "Anyone can read topics" ON public.topics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert topics" ON public.topics FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update topics" ON public.topics FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete topics" ON public.topics FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Prompts: everyone can read active, admin can manage
CREATE POLICY "Anyone can read active prompts" ON public.prompts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert prompts" ON public.prompts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update prompts" ON public.prompts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete prompts" ON public.prompts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Chat sessions: user can manage own
CREATE POLICY "Users read own sessions" ON public.chat_sessions FOR SELECT TO authenticated USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));
CREATE POLICY "Users insert own sessions" ON public.chat_sessions FOR INSERT TO authenticated WITH CHECK (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));
CREATE POLICY "Users update own sessions" ON public.chat_sessions FOR UPDATE TO authenticated USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));
CREATE POLICY "Users delete own sessions" ON public.chat_sessions FOR DELETE TO authenticated USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

-- Chat messages: user can manage own (through session)
CREATE POLICY "Users read own messages" ON public.chat_messages FOR SELECT TO authenticated USING (session_id IN (SELECT cs.id FROM public.chat_sessions cs JOIN public.students s ON cs.student_id = s.id WHERE s.user_id = auth.uid()));
CREATE POLICY "Users insert own messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (session_id IN (SELECT cs.id FROM public.chat_sessions cs JOIN public.students s ON cs.student_id = s.id WHERE s.user_id = auth.uid()));

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Trigger to auto-create student profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.students (user_id, student_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'student_name', 'תלמיד'));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
