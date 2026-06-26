
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
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

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Roteiro logs
CREATE TABLE public.roteiro_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  tema text NOT NULL DEFAULT '',
  quantidade integer NOT NULL DEFAULT 0,
  tem_pdf boolean NOT NULL DEFAULT false,
  pdf_nome text,
  eixos text[] NOT NULL DEFAULT '{}',
  refinamentos integer NOT NULL DEFAULT 0,
  exportado_pdf boolean NOT NULL DEFAULT false,
  historico jsonb NOT NULL DEFAULT '[]'::jsonb
);

GRANT SELECT ON public.roteiro_logs TO authenticated;
GRANT ALL ON public.roteiro_logs TO service_role;

ALTER TABLE public.roteiro_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all logs"
ON public.roteiro_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
