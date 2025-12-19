-- ============================================================================
-- DEMO KULLANICILAR OLUŞTURMA SCRIPT'İ
-- ============================================================================
-- 
-- Bu script demo kullanıcıları hem auth.users hem de user_details 
-- tablolarında otomatik olarak oluşturur.
--
-- KULLANIM:
-- 1. Bu script'i Supabase SQL Editor'de çalıştırın
-- 2. Tüm demo kullanıcılar otomatik olarak oluşturulacak
--
-- Şifreler: Tüm kullanıcılar için şifre "demo123"
-- ============================================================================

-- pgcrypto extension'ını etkinleştir (password hash için gerekli)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ============================================================================
-- Helper Function: Kullanıcı oluştur (varsa güncelle, yoksa oluştur)
-- ============================================================================

CREATE OR REPLACE FUNCTION create_demo_user(
    p_email TEXT,
    p_password TEXT DEFAULT 'demo123',
    p_role TEXT DEFAULT 'user',
    p_permissions TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_user_id UUID;
    v_encrypted_pw TEXT;
BEGIN
    -- Password hash oluştur (bcrypt) - gen_salt için extensions schema'sını kullan
    v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf', 10));
    
    -- Kullanıcı var mı kontrol et
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = p_email;
    
    IF v_user_id IS NULL THEN
        -- Yeni kullanıcı oluştur
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            p_email,
            v_encrypted_pw,
            NOW(),
            NULL,
            NULL,
            '{"provider":"email","providers":["email"]}',
            '{}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        )
        RETURNING id INTO v_user_id;
    ELSE
        -- Mevcut kullanıcının şifresini güncelle
        UPDATE auth.users
        SET encrypted_password = v_encrypted_pw,
            updated_at = NOW()
        WHERE id = v_user_id;
    END IF;
    
    -- user_details kaydını oluştur/güncelle
    INSERT INTO public.user_details (id, role, permissions, created_at, updated_at)
    VALUES (v_user_id, p_role, p_permissions, NOW(), NOW())
    ON CONFLICT (id) 
    DO UPDATE SET
        role = EXCLUDED.role,
        permissions = EXCLUDED.permissions,
        updated_at = EXCLUDED.updated_at;
    
    RETURN v_user_id;
END;
$$;

-- ============================================================================
-- Demo Kullanıcıları Oluştur
-- ============================================================================

-- 1. İK Permission'a sahip User
SELECT create_demo_user('ik@demo.com', 'demo123', 'user', ARRAY['ik']::TEXT[]);

-- 2. Düz User (permission yok)
SELECT create_demo_user('user@demo.com', 'demo123', 'user', ARRAY[]::TEXT[]);

-- 3. Muhasebe Permission'a sahip User
SELECT create_demo_user('muhasebe@demo.com', 'demo123', 'user', ARRAY['muhasebe']::TEXT[]);

-- 4. Admin Role
SELECT create_demo_user('admin@demo.com', 'demo123', 'admin', ARRAY[]::TEXT[]);

-- 5. Superadmin Role
SELECT create_demo_user('superadmin@demo.com', 'demo123', 'superadmin', ARRAY[]::TEXT[]);

-- ============================================================================
-- KONTROL: Oluşturulan kayıtları göster
-- ============================================================================

SELECT 
    u.email,
    ud.role,
    ud.permissions,
    ud.created_at
FROM auth.users u
INNER JOIN public.user_details ud ON u.id = ud.id
WHERE u.email IN (
    'ik@demo.com',
    'user@demo.com',
    'muhasebe@demo.com',
    'admin@demo.com',
    'superadmin@demo.com'
)
ORDER BY 
    CASE ud.role
        WHEN 'superadmin' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'user' THEN 3
    END,
    u.email;

