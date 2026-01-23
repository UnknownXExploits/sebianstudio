-- Create published_projects table for storing published Sebian apps
CREATE TABLE public.published_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  source_code TEXT NOT NULL,
  html_bundle TEXT,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.published_projects ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read published projects (they're public)
CREATE POLICY "Published projects are publicly readable"
  ON public.published_projects
  FOR SELECT
  USING (true);

-- Allow anyone to insert (for now, since we don't have auth)
CREATE POLICY "Anyone can publish projects"
  ON public.published_projects
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update their projects by slug
CREATE POLICY "Anyone can update projects"
  ON public.published_projects
  FOR UPDATE
  USING (true);

-- Allow anyone to delete projects
CREATE POLICY "Anyone can delete projects"
  ON public.published_projects
  FOR DELETE
  USING (true);

-- Create index for faster slug lookups
CREATE INDEX idx_published_projects_slug ON public.published_projects(slug);