
-- Allow admins to read all chat sessions
CREATE POLICY "Admins can read all chat sessions"
ON public.chat_sessions FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to read all chat messages
CREATE POLICY "Admins can read all chat messages"
ON public.chat_messages FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
