
-- Custom installers (each user can create their own package manager)
CREATE TABLE public.installers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name)
);

ALTER TABLE public.installers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view installers" ON public.installers FOR SELECT USING (true);
CREATE POLICY "Anyone can create installers" ON public.installers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update installers" ON public.installers FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete installers" ON public.installers FOR DELETE USING (true);

-- Packages belong to an installer
CREATE TABLE public.packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  installer_id UUID NOT NULL REFERENCES public.installers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  description TEXT DEFAULT '',
  source_code TEXT NOT NULL DEFAULT '',
  architecture TEXT DEFAULT 'x64',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(installer_id, name, version)
);

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view packages" ON public.packages FOR SELECT USING (true);
CREATE POLICY "Anyone can create packages" ON public.packages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update packages" ON public.packages FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete packages" ON public.packages FOR DELETE USING (true);
