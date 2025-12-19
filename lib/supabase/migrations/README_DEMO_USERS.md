# Demo Kullanıcılar Oluşturma Rehberi

Bu rehber, projede test için kullanılacak demo kullanıcıların nasıl oluşturulacağını açıklar.

## Demo Kullanıcılar

1. **ik@demo.com** - İK Permission'a sahip User
   - Role: `user`
   - Permissions: `['ik']`
   - Şifre: `demo123` (veya istediğiniz şifre)

2. **user@demo.com** - Düz User (permission yok)
   - Role: `user`
   - Permissions: `[]`
   - Şifre: `demo123` (veya istediğiniz şifre)

3. **muhasebe@demo.com** - Muhasebe Permission'a sahip User
   - Role: `user`
   - Permissions: `['muhasebe']`
   - Şifre: `demo123` (veya istediğiniz şifre)

4. **admin@demo.com** - Admin Role
   - Role: `admin`
   - Permissions: `[]`
   - Şifre: `demo123` (veya istediğiniz şifre)

5. **superadmin@demo.com** - Superadmin Role
   - Role: `superadmin`
   - Permissions: `[]`
   - Şifre: `demo123` (veya istediğiniz şifre)

## Kurulum Adımları

### Yöntem 1: Supabase Dashboard ile (Önerilen)

1. **Supabase Dashboard** > **Authentication** > **Users** bölümüne gidin
2. **Add User** butonuna tıklayın
3. Her bir demo kullanıcı için:
   - Email: `ik@demo.com` (veya diğer email'ler)
   - Password: `demo123` (veya istediğiniz şifre)
   - Auto Confirm User: ✅ (işaretleyin)
   - **Add User** butonuna tıklayın
4. Tüm kullanıcıları oluşturduktan sonra, **SQL Editor**'e gidin
5. `lib/supabase/migrations/002_create_demo_users.sql` dosyasının içeriğini kopyalayın
6. SQL Editor'e yapıştırın ve **Run** butonuna tıklayın
7. Script başarıyla çalıştıktan sonra, sonuçları kontrol edin

### Yöntem 2: Signup ile (Alternatif)

1. Uygulamada **Sign Up** sayfasına gidin
2. Her bir demo kullanıcı için signup yapın:
   - Email: `ik@demo.com` (veya diğer email'ler)
   - Password: `demo123` (veya istediğiniz şifre)
3. Signup yaptıktan sonra, kullanıcılar otomatik olarak `user_details` tablosuna `role: 'user'` ve `permissions: []` ile eklenir
4. **SQL Editor**'e gidin ve `002_create_demo_users.sql` script'ini çalıştırın
5. Script, mevcut kayıtları güncelleyecektir

## Kontrol

Script çalıştıktan sonra, aşağıdaki sorguyu çalıştırarak demo kullanıcıları kontrol edebilirsiniz:

```sql
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
```

## Test Senaryoları

### İK Permission Testi
- **ik@demo.com** ile giriş yapın
- `/client-bordro` ve `/server-bordro` sayfalarına erişebilmelisiniz
- `/client-finans` ve `/server-finans` sayfalarına erişememelisiniz (unauthorized)

### Muhasebe Permission Testi
- **muhasebe@demo.com** ile giriş yapın
- `/client-finans` ve `/server-finans` sayfalarına erişebilmelisiniz
- `/client-bordro` ve `/server-bordro` sayfalarına erişememelisiniz (unauthorized)

### Düz User Testi
- **user@demo.com** ile giriş yapın
- Hiçbir permission sayfasına erişememelisiniz (unauthorized)
- Sadece genel protected sayfalara erişebilmelisiniz

### Admin Testi
- **admin@demo.com** ile giriş yapın
- Tüm permission sayfalarına erişebilmelisiniz
- `/client-admin` ve `/server-admin` sayfalarına erişebilmelisiniz
- `/client-superadmin` ve `/server-superadmin` sayfalarına erişememelisiniz (unauthorized)

### Superadmin Testi
- **superadmin@demo.com** ile giriş yapın
- Tüm sayfalara erişebilmelisiniz
- Hiçbir kısıtlama olmamalı

## Notlar

- Demo kullanıcılar **sadece development/test ortamında** kullanılmalıdır
- Production ortamında bu kullanıcıları **kesinlikle kullanmayın**
- Şifreleri güvenli tutun ve gerektiğinde değiştirin
- Email confirmation ayarlarını kontrol edin (Authentication > Settings)

