# Next.js + Supabase RBAC Boilerplate

Next.js 16 ve Supabase ile Role-Based Access Control (RBAC) sistemi içeren hem server-side hem client-side çalışabilen tam kapsamlı bir boilerplate.

<img width="280" height="380" alt="image" src="https://github.com/user-attachments/assets/ce2c0e71-3167-411d-be14-21b880a025c6" />
<img width="430" height="600" alt="image" src="https://github.com/user-attachments/assets/bd5a1b28-1143-4d14-b0b0-3f17fef39bb9" />

## Özellikler

- ✅ **3 Temel Rol**: `user`, `admin`, `superadmin`
- ✅ **Permission Sistemi**: User'lar için permission bazlı erişim kontrolü (array)
- ✅ **Config-Based**: Route ve rol tanımları config dosyasında
- ✅ **Server & Client Components**: Her iki tarafta da çalışan RBAC
- ✅ **Otomatik Rol Atama**: Yeni kullanıcılara otomatik 'user' rolü (PostgreSQL Trigger)
- ✅ **Database-Based**: Roller ve permissions `user_details` tablosunda tutulur
- ✅ **Genişletilebilir**: `user_details` tablosuna kolayca yeni kolonlar eklenebilir
- ✅ **UI Route Protection**: Layout seviyesinde otomatik route koruması (UX için)
- ✅ **Type-Safe**: Full TypeScript desteği

**⚠️ Güvenlik Notu**: Bu boilerplate'teki route koruması **UI tabanlı**dır ve sadece kullanıcı deneyimi için kullanılmalıdır. **ANA KORUMA KESİNLİKLE RLS (Row Level Security) İLE YAPILMALIDIR!** Detaylar için [Güvenlik Notları](#güvenlik-notları) bölümüne bakın.

## Kurulum

### 1. Environment Variables

`.env.local` dosyası oluşturun:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

**Not**: Bu değerleri Supabase Dashboard > Settings > API'den alabilirsiniz.

### 2. Database Migration

Yeni kullanıcılara otomatik 'user' rolü atamak için database migration'ı çalıştırın:

**Supabase Dashboard ile:**

1. **Supabase Dashboard** > **SQL Editor**
2. **New Query** butonuna tıklayın
3. `lib/supabase/migrations/001_create_user_details.sql` dosyasının içeriğini kopyalayın
4. SQL Editor'e yapıştırın
5. **Run** butonuna tıklayın

**Migration Ne Yapar?**

- `user_details` tablosunu oluşturur
- `role` ve `permissions` kolonlarını array olarak tanımlar
- RLS (Row Level Security) politikalarını ayarlar
- Yeni kullanıcı oluşturulduğunda otomatik `user_details` kaydı ekleyen trigger oluşturur

**Not**: Migration çalıştırıldıktan sonra yeni kullanıcılar otomatik olarak `user_details` tablosuna kaydedilecek ve default olarak `role: ['user']` ve `permissions: []` alacaktır.

### 3. Demo Kullanıcılar (Opsiyonel)

Test için demo kullanıcılar oluşturmak isterseniz:

1. **Supabase Dashboard** > **SQL Editor**
2. `lib/supabase/migrations/002_create_demo_users.sql` dosyasının içeriğini kopyalayın
3. SQL Editor'e yapıştırın ve **Run** butonuna tıklayın
4. Aşağıdaki demo kullanıcılar otomatik olarak oluşturulacak:
   - `ik@demo.com` (şifre: `demo123`) - İK permission
   - `user@demo.com` (şifre: `demo123`) - Düz user
   - `muhasebe@demo.com` (şifre: `demo123`) - Muhasebe permission
   - `admin@demo.com` (şifre: `demo123`) - Admin role
   - `superadmin@demo.com` (şifre: `demo123`) - Superadmin role

**Not**: Detaylı bilgi için `lib/supabase/migrations/README_DEMO_USERS.md` dosyasına bakın.

### 4. Test

1. Yeni bir kullanıcı kaydedin (signup) veya demo kullanıcılardan biriyle giriş yapın
2. **Supabase Dashboard** > **Table Editor** > **user_details** tablosunu kontrol edin
3. Yeni kullanıcının `role: 'user'` ve `permissions: []` olmalı

## Kullanım

### RBAC Yapısı

**Roller** (Array desteği ile çoklu rol):
- `user`: Permission bazlı erişim (default rol)
- `admin`: Tüm permission'lara erişim + admin sayfaları
- `superadmin`: Her yere erişim

**Permissions**: User'lar için özel izinler (örn: `muhasebe`, `ik`, `finance`, `payroll`)

**user_details Tablosu Yapısı**:
```typescript
interface UserDetails {
  id: string;
  role: Roles;            // Tek değer: 'user' | 'admin' | 'superadmin'
  permissions: string[];  // Array: ['muhasebe', 'ik'] gibi
  created_at: string;
  updated_at: string;
  // İleride eklenebilecek diğer kolonlar...
}
```

**Örnek Kullanıcı Verileri**:
```typescript
// User with multiple permissions
{ role: 'user', permissions: ['muhasebe', 'ik'] }

// User with ik permission only
{ role: 'user', permissions: ['ik'] }

// Admin
{ role: 'admin', permissions: [] }

// Superadmin
{ role: 'superadmin', permissions: [] }
```

### Config Dosyası

Roller ve route'lar `lib/rbac/config.ts` dosyasında tanımlı:

```typescript
export const RBAC_CONFIG = {
  routes: {
    // Server-side routes
    '/server-finans': { permission: 'muhasebe' },
    '/server-bordro': { permission: 'ik' },
    '/server-admin': { role: 'admin' },
    '/server-superadmin': { role: 'superadmin' },

    // Client-side routes
    '/client-finans': { permission: 'muhasebe' },
    '/client-bordro': { permission: 'ik' },
    '/buraya-sadece-a-permi-girer': { permission: 'a' },
    '/client-admin': { role: 'admin' },
    '/client-superadmin': { role: 'superadmin' },
    '/ornek-yeni-route': { role: 'superadmin' },
  } as const,
} as const;
```

**Route Erişim Kuralları** (UI Tabanlı - Sadece UX İçin):
- `permission` tanımlı route: Admin/Superadmin her zaman erişebilir, User sadece permission'ı varsa
- `role` tanımlı route: Sadece belirtilen role veya üstü erişebilir
- Tanımlı olmayan route: Auth olan herkes erişebilir (protected layout içindeyse)

**⚠️ UYARI**: Bu kurallar sadece UI seviyesinde çalışır. Asıl güvenlik için RLS policies kullanılmalıdır!

### Server Component'te

```typescript
import { getServerAuth } from '@/lib/helpers/server-side-auth';

export default async function Page() {
  const user = await getServerAuth(); // UserWithRBAC | null
  
  if (user) {
    // user_details kolonları direkt user objesinde - user.role, user.permissions gibi
    console.log(user.role);        // 'user' | 'admin' | 'superadmin'
    console.log(user.permissions); // ['muhasebe', 'ik']
    console.log(user.created_at);  // '2024-01-01T00:00:00.000Z'
    console.log(user.email);       // Kullanıcı email'i
    console.log(user.id);          // Kullanıcı ID'si
  }
}
```

**Not**: `getServerAuth()` zaten `UserWithRBAC` tipinde user döndürür, yani `getUserDetails` çağırmaya gerek yoktur. Tüm `user_details` bilgileri (`role`, `permissions`, `created_at`, vb.) direkt `user` objesinde mevcuttur.

### Client Component'te

```typescript
'use client';
import { useAuth } from '@/lib/context/auth-context';

export default function Page() {
  const { user, isInitialized } = useAuth(); // UserWithRBAC | null
  
  // Loading state kontrolü
  if (!isInitialized) {
    return <div>Loading...</div>;
  }
  
  if (user) {
    // user_details kolonları direkt user objesinde - user.role, user.permissions gibi
    console.log(user.role);        // 'user' | 'admin' | 'superadmin'
    console.log(user.permissions); // ['muhasebe', 'ik']
    console.log(user.created_at);  // '2024-01-01T00:00:00.000Z'
    console.log(user.email);       // Kullanıcı email'i
    console.log(user.id);          // Kullanıcı ID'si
  }
  
  return <div>Content</div>;
}
```

**Not**: `useAuth()` hook'u zaten `UserWithRBAC` tipinde user döndürür, yani `getUserDetails` çağırmaya gerek yoktur. Tüm `user_details` bilgileri (`role`, `permissions`, `created_at`, vb.) direkt `user` objesinde mevcuttur.

**⚠️ UYARI**: Client Component'lerde `useAuth()` kullanımı **render flash** yaşanabilir. Kullanıcı kısa bir süre için yetkisiz içeriği görebilir. Hassas içerikler için Server Component kullanın veya `isInitialized` kontrolü ile loading state gösterin.

### Route Erişim Kontrolü

Route'lar otomatik olarak layout seviyesinde kontrol edilir:

- **Server Pages**: `app/(server-pages)/(protected)/layout.tsx` - `getServerAuth()` kullanır
- **Client Pages**: `app/(client-pages)/(protected)/layout.tsx` - `useAuth()` kullanır

Config'de tanımlı route'lar için permission/role kontrolü yapılır. Erişim yoksa `/unauthorized` sayfasına yönlendirilir.

**⚠️ ÖNEMLİ GÜVENLİK UYARISI:**

Bu boilerplate'teki route koruması **UI tabanlı** bir korumadır ve sadece **kullanıcı deneyimi** için kullanılmalıdır. 

- ⚠️ **Client-side koruma**: Client Pages layout'unda `useAuth()` ile yapılan kontrol, client-side'da çalıştığı için **render flash** yaşanabilir. Kullanıcı kısa bir süre için yetkisiz içeriği görebilir.
- ⚠️ **Server-side koruma**: Server Pages layout'unda `getServerAuth()` ile yapılan kontrol daha güvenlidir ancak yine de **tam güvenlik garantisi vermez**.

**🔒 ANA KORUMA KESİNLİKLE RLS (Row Level Security) İLE YAPILMALIDIR!**

- ✅ **Database seviyesinde koruma**: Tüm hassas veriler ve API endpoint'leri **Supabase RLS policies** ile korunmalıdır
- ✅ **API route koruması**: API route'larında server-side kontrol yapılmalı ve RLS ile desteklenmelidir
- ✅ **UI koruması ikincil**: Bu boilerplate'teki UI koruması sadece kullanıcı deneyimi için kullanılmalı, asıl güvenlik RLS ile sağlanmalıdır

### Helper Fonksiyonları

RBAC helper fonksiyonları `lib/rbac/shared.ts` dosyasında tanımlıdır ve hem server hem client'ta kullanılabilir:

**Server Component'te:**
```typescript
import { getServerAuth } from '@/lib/helpers/server-side-auth';
import { 
  isSuperAdmin, 
  isAdmin, 
  hasPermission, 
  hasRole,
  canAccessRoute
} from '@/lib/rbac/shared';

export default async function Page() {
  const user = await getServerAuth();
  
  if (!user) return null;
  
  // Role ve Permission kontrolleri
  if (isSuperAdmin(user)) { /* ... */ }
  if (isAdmin(user)) { /* ... */ }
  if (hasPermission(user, 'muhasebe')) { /* ... */ }
  if (hasRole(user, 'admin')) { /* ... */ }
  if (canAccessRoute(user, '/finans')) { /* ... */ }
}
```

**Client Component'te:**
```typescript
'use client';
import { useAuth } from '@/lib/context/auth-context';
import { 
  isSuperAdmin, 
  isAdmin, 
  hasPermission, 
  hasRole,
  canAccessRoute
} from '@/lib/rbac/shared';

export default function Page() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  // Role ve Permission kontrolleri
  if (isSuperAdmin(user)) { /* ... */ }
  if (isAdmin(user)) { /* ... */ }
  if (hasPermission(user, 'muhasebe')) { /* ... */ }
  if (hasRole(user, 'admin')) { /* ... */ }
  if (canAccessRoute(user, '/finans')) { /* ... */ }
}
```

**Direkt kontrol:**
```typescript
if (user.role === 'admin') { /* ... */ }
if (user.permissions.includes('muhasebe')) { /* ... */ }
```

**Not**: `getUserDetails` fonksiyonu sadece özel durumlarda kullanılır (örneğin başka bir kullanıcının detaylarını çekmek için). Normal kullanımda `getServerAuth()` veya `useAuth()` yeterlidir çünkü zaten `UserWithRBAC` tipinde user döndürürler.

## Test Senaryoları

1. **Yeni Kullanıcı Kaydı**: 
   - Signup yap → Otomatik `user_details` kaydı oluşturulmalı
   - Supabase Dashboard > Table Editor > `user_details` tablosunu kontrol et
   - `role: ['user']` ve `permissions: []` olmalı

2. **Permission Kontrolü**: 
   - User'ın permission'ı yoksa route'a erişememeli
   - `/finans` route'una erişmeye çalış → `/unauthorized` yönlendirmeli

3. **Role Kontrolü**: 
   - Admin/Superadmin tüm route'lara erişebilmeli
   - Admin olarak `/adminpanel` erişebilmeli

4. **Superadmin**: 
   - Her yere erişebilmeli
   - Tüm route'lar açık olmalı

5. **Role Kontrolü**: 
   - Kullanıcının role'ü doğru şekilde kontrol edilmeli
   - `user.role === 'admin'` kontrolü çalışmalı

## Troubleshooting

### Signup Çalışmıyor

**Hata**: `Database error saving new user`

**Çözüm**: 
1. Supabase Dashboard > Database > Logs bölümünden detaylı hata mesajını kontrol edin
2. Email confirmation ayarlarını kontrol edin (Authentication > Settings)
3. RLS policies'leri kontrol edin (Database > Tables > auth.users)

### user_details Kaydı Oluşturulmuyor

**Hata**: Yeni kullanıcı oluşturulduğunda `user_details` tablosuna kayıt eklenmiyor

**Çözüm**:
1. Supabase Dashboard > Database > Functions bölümünden `handle_new_user` fonksiyonunu kontrol edin
2. Trigger'ın aktif olduğundan emin olun (Database > Triggers > `on_auth_user_created`)
3. Migration'ın başarıyla çalıştırıldığını kontrol edin
4. SQL Editor'de manuel test edin:
   ```sql
   -- Test trigger
   INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'test@example.com');
   -- user_details tablosunu kontrol et
   SELECT * FROM user_details WHERE id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
   ```

### getUserDetails null döndürüyor

**Hata**: `getUserDetails` fonksiyonu `null` döndürüyor

**Çözüm**:
1. RLS policies'lerin doğru ayarlandığından emin olun
2. Kullanıcının `user_details` tablosunda kaydı olduğunu kontrol edin
3. Supabase Dashboard > Table Editor > `user_details` tablosunu kontrol edin
4. Eğer kayıt yoksa, trigger çalışmamış olabilir (yukarıdaki çözüme bakın)

## Proje Yapısı

```
lib/
├── rbac/
│   ├── config.ts           # Route ve rol tanımları
│   ├── shared.ts            # Ortak type'lar ve pure logic fonksiyonlar (isSuperAdmin, isAdmin, hasPermission, hasRole, canAccessRoute)
│   ├── helpers.server.ts    # Server-only helper (getUserDetails - server client ile)
│   └── helpers.client.ts    # Client-safe helper (getUserDetails - client client ile)
├── helpers/
│   └── server-side-auth.ts  # Server-side auth helpers (getServerAuth)
├── context/
│   └── auth-context.tsx     # Client-side auth context (useAuth hook)
├── supabase/
│   ├── client.ts            # Supabase client (browser)
│   ├── server.ts            # Supabase client (server) - server-only korumalı
│   ├── proxy.ts             # Proxy middleware (pathname injection)
│   └── migrations/
│       ├── 001_create_user_details.sql  # Database migration (user_details tablosu + trigger)
│       └── 002_create_demo_users.sql    # Demo kullanıcılar oluşturma script'i

app/
├── (server-pages)/
│   └── (protected)/
│       └── layout.tsx       # Server-side protected layout
├── (client-pages)/
│   ├── (protected)/
│   │   └── layout.tsx       # Client-side protected layout
│   └── unauthorized/
│       └── page.tsx         # Unauthorized sayfası
```

### RBAC Dosya Yapısı

RBAC helper'ları server ve client için ayrılmıştır:

- **`shared.ts`**: Ortak type'lar (`UserWithRBAC`, `UserDetails`) ve pure logic fonksiyonlar (`isSuperAdmin`, `isAdmin`, `hasPermission`, `hasRole`, `canAccessRoute`) - hem server hem client'ta kullanılabilir
- **`helpers.server.ts`**: Server-only `getUserDetails` fonksiyonu - `import "server-only"` ile korumalı
- **`helpers.client.ts`**: Client-safe `getUserDetails` fonksiyonu - `"use client"` ile işaretli

Bu yapı sayesinde:
- ✅ Server dosyaları client'tan import edilemez (erken hata yakalama)
- ✅ Type'lar ve pure logic fonksiyonlar ortak kullanılır
- ✅ Her iki tarafta da aynı API ile çalışır

## Güvenlik Notları

### 🔒 Kritik Güvenlik Uyarıları

**ANA KORUMA KESİNLİKLE RLS (Row Level Security) İLE YAPILMALIDIR!**

Bu boilerplate'teki UI tabanlı route koruması sadece **kullanıcı deneyimi** için kullanılmalıdır. Asıl güvenlik **database seviyesinde RLS policies** ile sağlanmalıdır.

#### UI Tabanlı Koruma (İkincil - Sadece UX İçin)

- ⚠️ **Client-Side Protection**: Client layout'ta `useAuth()` ile yapılan kontrol **render flash** yaşanabilir
  - Kullanıcı kısa bir süre için yetkisiz içeriği görebilir
  - JavaScript devre dışı bırakılırsa koruma çalışmaz
  - Browser console'dan bypass edilebilir (sadece UI seviyesinde)
  
- ⚠️ **Server-Side Protection**: Server layout'ta `getServerAuth()` ile yapılan kontrol daha güvenlidir ancak:
  - API endpoint'lerini korumaz
  - Database sorgularını korumaz
  - Sadece sayfa render'ını engeller

#### Database Seviyesinde Koruma (Birincil - Zorunlu)

- ✅ **RLS Policies**: Tüm hassas veriler **Supabase RLS policies** ile korunmalıdır
  - Kullanıcılar sadece kendi kayıtlarını görebilir
  - Role ve permission bazlı erişim kontrolü database seviyesinde yapılmalıdır
  - API endpoint'leri RLS ile korunmalıdır
  
- ✅ **API Route Protection**: API route'larında server-side kontrol yapılmalı ve RLS ile desteklenmelidir
  - `getServerAuth()` ile kullanıcı doğrulanmalı
  - RLS policies ile database erişimi kontrol edilmeli
  - Client'tan gelen istekler doğrulanmalı

### Diğer Güvenlik Özellikleri

- ✅ **Database-Based**: Roller ve permissions `user_details` tablosunda tutulur
- ✅ **Trigger Security**: `SECURITY DEFINER` ile güvenli trigger
- ✅ **Type-Safe**: Full TypeScript desteği ile tip güvenliği
- ✅ **Environment Variables**: Hassas bilgiler environment variable'larda tutulur

### RLS Policy Örnekleri

```sql
-- user_details tablosu için RLS policy örneği
CREATE POLICY "Users can only view their own details"
ON public.user_details
FOR SELECT
USING (auth.uid() = id);

-- Permission bazlı erişim için örnek (örnek tablo: finans_data)
CREATE POLICY "Users with muhasebe permission can access finans data"
ON public.finans_data
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_details
    WHERE id = auth.uid()
    AND (
      role = 'admin' 
      OR role = 'superadmin'
      OR 'muhasebe' = ANY(permissions)
    )
  )
);
```

## Genişletilebilirlik

`user_details` tablosuna yeni kolonlar eklemek çok kolay:

1. **Migration oluştur**:
```sql
ALTER TABLE public.user_details 
ADD COLUMN phone_number TEXT,
ADD COLUMN department TEXT;
```

2. **TypeScript type'ını güncelle** (opsiyonel):
```typescript
export interface UserDetails {
  id: string;
  role: Roles[];
  permissions: string[];
  created_at: string;
  updated_at: string;
  phone_number?: string;  // Yeni kolon
  department?: string;    // Yeni kolon
  [key: string]: unknown;
}
```

3. **Kullan**:
```typescript
const user = await getServerAuth();
console.log(user.phone_number);  // Otomatik olarak erişilebilir (user_details tablosundaki tüm kolonlar)
```

`getUserDetails` fonksiyonu `.select('*')` kullandığı için yeni kolonlar otomatik olarak döner!

## License

MIT

