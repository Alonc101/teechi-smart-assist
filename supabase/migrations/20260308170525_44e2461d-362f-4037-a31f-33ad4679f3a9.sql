
-- Add grade and school_id to topics table
ALTER TABLE public.topics ADD COLUMN grade text;
ALTER TABLE public.topics ADD COLUMN school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL;

-- Update handle_new_user to save grade and school_id from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.students (user_id, student_name, grade, school_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'student_name', 'תלמיד'),
    NEW.raw_user_meta_data->>'grade',
    CASE 
      WHEN NEW.raw_user_meta_data->>'school_id' IS NOT NULL 
        AND NEW.raw_user_meta_data->>'school_id' != ''
      THEN (NEW.raw_user_meta_data->>'school_id')::uuid 
      ELSE NULL 
    END
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$;
