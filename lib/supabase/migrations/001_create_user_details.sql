-- ============================================================================
-- 1. TABLE (Constraint Eklendi)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_details (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Rolün sadece belirli değerler almasını garanti altına alıyoruz
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
    permissions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 1.1. INDEXES (Performance)
-- ============================================================================

-- GIN index for array column (permissions) - array içinde arama için
CREATE INDEX IF NOT EXISTS idx_user_details_permissions_gin ON public.user_details USING gin (permissions);

-- B-tree index for role column - role bazlı sorgular için
CREATE INDEX IF NOT EXISTS idx_user_details_role ON public.user_details (role);

-- ============================================================================
-- 2. HELPER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public -- Güvenlik için kritik
AS $$
  -- Performans notu: auth.uid() null ise sorgu yapmadan çıkılabilir
  SELECT COALESCE(
    (SELECT role FROM public.user_details WHERE id = auth.uid()),
    'anon'
  );
$$;

-- ============================================================================
-- 3. RLS (Önce temizlik yapıyoruz ki hata vermesin)
-- ============================================================================

ALTER TABLE public.user_details ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle (Conflict oluşmaması için)
DROP POLICY IF EXISTS "select self" ON public.user_details;
DROP POLICY IF EXISTS "admin select users and admins" ON public.user_details;
DROP POLICY IF EXISTS "superadmin select all" ON public.user_details;
DROP POLICY IF EXISTS "user update self" ON public.user_details;
DROP POLICY IF EXISTS "admin update users" ON public.user_details;
DROP POLICY IF EXISTS "superadmin update all" ON public.user_details;
DROP POLICY IF EXISTS "admin delete users" ON public.user_details;
DROP POLICY IF EXISTS "superadmin delete all" ON public.user_details;
DROP POLICY IF EXISTS "service insert" ON public.user_details;
DROP POLICY IF EXISTS "admin insert user" ON public.user_details;

-- ============================================================================
-- 3.1 SELECT
-- ============================================================================

CREATE POLICY "select self"
ON public.user_details FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "admin select users and admins"
ON public.user_details FOR SELECT
USING (
  my_role() = 'admin'
  AND role IN ('user', 'admin') -- Admin diğer adminleri de görebilsin
);

CREATE POLICY "superadmin select all"
ON public.user_details FOR SELECT
USING (my_role() = 'superadmin');

-- ============================================================================
-- 3.2 UPDATE
-- ============================================================================

-- User sadece kendi created_at/updated_at dışındaki 'user-safe' alanları güncelleyebilmeli
-- Ancak burada tüm satıra izin verip, rol/yetki değişimini engelliyoruz.
CREATE POLICY "user update self"
ON public.user_details FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  -- Buradaki subquery güvenlidir ama her update'te çalışır.
  -- Alternatif olarak trigger ile OLD.role != NEW.role kontrolü yapılabilir.
  AND role = (SELECT role FROM public.user_details WHERE id = auth.uid())
  AND permissions = (SELECT permissions FROM public.user_details WHERE id = auth.uid())
);

CREATE POLICY "admin update users"
ON public.user_details FOR UPDATE
USING (
  -- KİMİ GÜNCELLEYEBİLİR?
  my_role() = 'admin'   -- Kendisi Admin olmalı
  AND role = 'user'     -- Hedef kişi şu an 'user' olmalı (Başka admini güncelleyemez)
)
WITH CHECK (
  -- GÜNCELLEME SONUCU NE OLABİLİR?
  role IN ('user', 'admin') -- Hedef kişi 'user' kalabilir veya 'admin' olabilir.
                            -- (Superadmin listede yok, dolayısıyla o rolü veremez)
);

CREATE POLICY "superadmin update all"
ON public.user_details FOR UPDATE
USING (my_role() = 'superadmin'); 
-- Superadmin her şeyi yapabilir, kısıtlama yok.

-- ============================================================================
-- 3.3 DELETE
-- ============================================================================

CREATE POLICY "admin delete users"
ON public.user_details FOR DELETE
USING (
  my_role() = 'admin'
  AND role = 'user'
);

CREATE POLICY "superadmin delete all"
ON public.user_details FOR DELETE
USING (my_role() = 'superadmin');

-- ============================================================================
-- 3.4 INSERT
-- ============================================================================

CREATE POLICY "service insert"
ON public.user_details FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Admin manuel insert yapacaksa
CREATE POLICY "admin insert user"
ON public.user_details FOR INSERT
WITH CHECK (
  my_role() IN ('admin','superadmin')
  AND role = 'user'
);

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_details_updated_at
BEFORE UPDATE ON public.user_details
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_details (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();