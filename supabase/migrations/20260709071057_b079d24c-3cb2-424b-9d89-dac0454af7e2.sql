
-- Enum for role and mode
CREATE TYPE public.app_role AS ENUM ('admin');
CREATE TYPE public.site_mode AS ENUM ('creator', 'developer', 'both');

-- user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users can view their roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- sections
CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode site_mode NOT NULL,
  key TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  order_index INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mode, key)
);
GRANT SELECT ON public.sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sections TO authenticated;
GRANT ALL ON public.sections TO service_role;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view visible sections" ON public.sections FOR SELECT TO anon USING (is_visible = true);
CREATE POLICY "Auth can view all sections" ON public.sections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage sections" ON public.sections FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- section_items
CREATE TABLE public.section_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  body TEXT,
  media_url TEXT,
  media_url_secondary TEXT,
  alt_text TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  order_index INT NOT NULL DEFAULT 0,
  link_url TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  meta JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.section_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.section_items TO authenticated;
GRANT ALL ON public.section_items TO service_role;
ALTER TABLE public.section_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public views visible items" ON public.section_items FOR SELECT TO anon USING (is_visible = true);
CREATE POLICY "Auth views all items" ON public.section_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage items" ON public.section_items FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- site_settings
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode site_mode NOT NULL UNIQUE,
  hero_title TEXT NOT NULL DEFAULT '',
  hero_subtitle TEXT,
  hero_media_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  theme_overrides JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public views settings" ON public.site_settings FOR SELECT TO anon USING (true);
CREATE POLICY "Auth views settings" ON public.site_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage settings" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- testimonials
CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_title TEXT,
  quote TEXT NOT NULL,
  avatar_url TEXT,
  order_index INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public views visible testimonials" ON public.testimonials FOR SELECT TO anon USING (is_visible = true);
CREATE POLICY "Auth views all testimonials" ON public.testimonials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage testimonials" ON public.testimonials FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- updated_at trigger fn
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER t_sections_upd BEFORE UPDATE ON public.sections FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_items_upd BEFORE UPDATE ON public.section_items FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_settings_upd BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
