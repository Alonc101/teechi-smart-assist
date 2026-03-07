-- Allow admins to delete chat sessions
CREATE POLICY "Admins can delete chat sessions"
ON public.chat_sessions FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete chat messages
CREATE POLICY "Admins can delete chat messages"
ON public.chat_messages FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));