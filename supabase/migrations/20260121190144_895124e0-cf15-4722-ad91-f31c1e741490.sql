-- Create projects table for cloud sync
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  modified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create files table for storing code files
CREATE TABLE public.files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  path TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  modified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, path)
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects" 
ON public.projects FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create projects" 
ON public.projects FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own projects" 
ON public.projects FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own projects" 
ON public.projects FOR DELETE 
USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policies for files
CREATE POLICY "Users can view files in their projects" 
ON public.files FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = files.project_id 
  AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
));

CREATE POLICY "Users can create files in their projects" 
ON public.files FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = files.project_id 
  AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
));

CREATE POLICY "Users can update files in their projects" 
ON public.files FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = files.project_id 
  AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
));

CREATE POLICY "Users can delete files in their projects" 
ON public.files FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = files.project_id 
  AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
));

-- Trigger for updating modified_at
CREATE OR REPLACE FUNCTION public.update_modified_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.modified_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_projects_modified_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.update_modified_at();

CREATE TRIGGER update_files_modified_at
BEFORE UPDATE ON public.files
FOR EACH ROW EXECUTE FUNCTION public.update_modified_at();