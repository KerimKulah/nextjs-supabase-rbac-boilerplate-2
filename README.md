# Next.js + Supabase RBAC Boilerplate

Next.js 16 ve Supabase ile Role-Based Access Control (RBAC) sistemi içeren production-ready boilerplate.

## Özellikler

- ✅ **3 Temel Rol**: `user`, `admin`, `superadmin`
- ✅ **Permission Sistemi**: User'lar için permission bazlı erişim kontrolü
- ✅ **Config-Based**: Route ve rol tanımları config dosyasında
- ✅ **Server & Client Components**: Her iki tarafta da çalışan RBAC
- ✅ **Otomatik Rol Atama**: Yeni kullanıcılara otomatik 'user' rolü (Edge Function + Webhook)
- ✅ **JWT-Based**: Roller ve permissions `app_metadata` içinde JWT'de taşınır (gereksiz DB çağrısı yok)
- ✅ **Route Protection**: Layout seviyesinde otomatik route koruması
- ✅ **Type-Safe**: Full TypeScript desteği

## Kurulum

### 1. Environment Variables

`.env.local` dosyası oluşturun:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

**Not**: Bu değerleri Supabase Dashboard > Settings > API'den alabilirsiniz.

### 2. Edge Function Deploy

Yeni kullanıcılara otomatik 'user' rolü atamak için:

**Seçenek A: Supabase CLI ile (Önerilen)**

```bash
# Supabase CLI'yi yükle (eğer yüklü değilse)
npm install -g supabase

# Login ol
supabase login

# Projeyi link et
supabase link --project-ref YOUR_PROJECT_REF

# Edge Function'ı deploy et
supabase functions deploy assign-default-role
```

**Seçenek B: Supabase Dashboard ile**

1. **Supabase Dashboard** > **Edge Functions**
2. **New Function** butonuna tıklayın
3. **Function Name**: `assign-default-role`
4. `lib/supabase/functions/assign-default-role/index.ts` dosyasının içeriğini kopyalayın
5. Kodu yapıştırın ve **Deploy** butonuna tıklayın

### 3. Webhook Secret Ayarlama

Edge Function güvenliği için webhook secret oluşturun:

1. **Supabase Dashboard** > **Settings** > **Edge Functions** > **Secrets**
2. **New Secret** butonuna tıklayın
3. Yeni secret ekleyin:
   - **Name**: `WEBHOOK_SECRET`
   - **Value**: Güçlü bir random string
4. **Save** butonuna tıklayın

**Secret Oluşturma** (Terminal'de):
```bash
# Linux/Mac
openssl rand -hex 32

# Windows (PowerShell)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
```

**ÖNEMLİ**: Bu secret'ı güvenli bir yerde saklayın. Webhook kurulumunda kullanılacak.

### 4. Webhook Kurulumu

Edge Function'ı otomatik tetiklemek için webhook ayarlayın:

1. **Supabase Dashboard** > **Database** > **Webhooks**
2. **New Webhook** butonuna tıklayın
3. Aşağıdaki ayarları yapın:
   - **Name**: `assign-default-role`
   - **Table**: `auth.users` (auth schema'sından seçin)
   - **Events**: `INSERT` seçin
   - **Type**: `HTTP Request` seçin (Edge Function seçeneği signature eklemiyor)
   - **URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/assign-default-role`
     - `YOUR_PROJECT_REF` yerine projenizin referansını yazın (Settings > API'den görebilirsiniz)
   - **HTTP Method**: `POST`
   - **HTTP Headers**: 
     - **Key**: `Authorization`
     - **Value**: `Bearer YOUR_WEBHOOK_SECRET` (yukarıda oluşturduğunuz secret'ı buraya yazın)
   - **HTTP Request Body**: Boş bırakın (Supabase otomatik payload gönderir)
4. **Save** butonuna tıklayın

**ÖNEMLİ**: 
- `YOUR_PROJECT_REF` değerini doğru yazdığınızdan emin olun
- `YOUR_WEBHOOK_SECRET` yerine gerçek secret değerini yazın (Bearer kelimesinden sonra boşluk bırakın)

**ÖNEMLİ - Güvenlik**: 
- ✅ Edge Function **Authorization Bearer Token** ile korunmaktadır (HTTP standartı)
- ✅ Webhook'ta HTTP Headers'e `Authorization: Bearer YOUR_WEBHOOK_SECRET` ekleyin
- ✅ Function `Authorization` header'ını `Bearer WEBHOOK_SECRET` formatında kontrol eder
- ✅ Service Role Key sadece function içinde kullanılır (Supabase işlemleri için, environment variable'dan)
- ✅ Dışarıdan direkt çağrılamaz, sadece doğru Bearer token ile gelebilir
- ✅ Webhook payload formatı: `{ "type": "INSERT", "table": "users", "record": { "id": "uuid" } }`

**Not**: Webhook kurulumu tamamlandıktan sonra yeni kullanıcılar otomatik olarak 'user' rolü alacaktır.

### 5. Test

1. Yeni bir kullanıcı kaydedin (signup)
2. **Supabase Dashboard** > **Authentication** > **Users** bölümünde kullanıcıyı kontrol edin
3. Kullanıcının `app_metadata` alanında `role: "user"` ve `permissions: []` olmalı
4. **Supabase Dashboard** > **Edge Functions** > **assign-default-role** > **Logs** bölümünden function loglarını kontrol edebilirsiniz

## Kullanım

### RBAC Yapısı

**Roller**:
- `user`: Permission bazlı erişim (default rol)
- `admin`: Tüm permission'lara erişim + admin sayfaları
- `superadmin`: Her yere erişim

**Permissions**: User'lar için özel izinler (örn: `muhasebe`, `ik`, `finance`, `payroll`)

**app_metadata Yapısı**:
```typescript
// User
{ "role": "user", "permissions": ["muhasebe", "ik"] }

// Admin
{ "role": "admin" }

// Superadmin
{ "role": "superadmin" }
```

### Config Dosyası

Roller ve route'lar `lib/rbac/config.ts` dosyasında tanımlı:

```typescript
export const RBAC_CONFIG = {
  routes: {
    '/finans': { permission: 'muhasebe' },
    '/vardiya': { permission: 'ik' },
    '/adminpanel': { role: 'admin' },
    '/superadminpanel': { role: 'superadmin' },
  } as const,
} as const;
```

**Route Erişim Kuralları**:
- `permission` tanımlı route: Admin/Superadmin her zaman erişebilir, User sadece permission'ı varsa
- `role` tanımlı route: Sadece belirtilen role veya üstü erişebilir
- Tanımlı olmayan route: Auth olan herkes erişebilir (protected layout içindeyse)

### Server Component'te

```typescript
import { getServerAuth } from '@/lib/helpers/server-side-auth';

export default async function Page() {
  const user = await getServerAuth(); // UserWithRBAC | null
  
  if (user) {
    console.log(user.metadata.role); // 'user' | 'admin' | 'superadmin'
    console.log(user.metadata.permissions); // string[]
  }
}
```

### Client Component'te

```typescript
'use client';
import { useAuth } from '@/lib/context/auth-context';

export default function Page() {
  const { user } = useAuth(); // UserWithRBAC | null
  
  if (user) {
    console.log(user.metadata.role);
    console.log(user.metadata.permissions);
  }
}
```

### Route Erişim Kontrolü

Route'lar otomatik olarak layout seviyesinde kontrol edilir:

- **Server Pages**: `app/(server-pages)/(protected)/layout.tsx` - `getServerAuth()` kullanır
- **Client Pages**: `app/(client-pages)/(protected)/layout.tsx` - `useAuth()` kullanır

Config'de tanımlı route'lar için permission/role kontrolü yapılır. Erişim yoksa `/unauthorized` sayfasına yönlendirilir.

### Helper Fonksiyonları

```typescript
import { 
  isSuperAdmin, 
  isAdmin, 
  hasPermission, 
  hasRole,
  canAccessRoute 
} from '@/lib/rbac/helpers';

// Kullanım
if (isSuperAdmin(user)) { /* ... */ }
if (isAdmin(user)) { /* ... */ }
if (hasPermission(user, 'muhasebe')) { /* ... */ }
if (hasRole(user, 'admin')) { /* ... */ }
if (canAccessRoute(user, '/finans')) { /* ... */ }
```

## Test Senaryoları

1. **Yeni Kullanıcı Kaydı**: 
   - Signup yap → Otomatik 'user' rolü atanmalı
   - Supabase Dashboard'da `app_metadata` kontrol et

2. **Permission Kontrolü**: 
   - User'ın permission'ı yoksa route'a erişememeli
   - `/finans` route'una erişmeye çalış → `/unauthorized` yönlendirmeli

3. **Role Kontrolü**: 
   - Admin/Superadmin tüm route'lara erişebilmeli
   - Admin olarak `/adminpanel` erişebilmeli

4. **Superadmin**: 
   - Her yere erişebilmeli
   - Tüm route'lar açık olmalı

## Troubleshooting

### Signup Çalışmıyor

**Hata**: `Database error saving new user`

**Çözüm**: 
1. Supabase Dashboard > Database > Logs bölümünden detaylı hata mesajını kontrol edin
2. Email confirmation ayarlarını kontrol edin (Authentication > Settings)
3. RLS policies'leri kontrol edin (Database > Tables > auth.users)

### Webhook Çalışmıyor

**Hata**: `Unauthorized: Invalid token`

**Çözüm**:
1. Supabase Dashboard > Settings > Edge Functions > Secrets
2. `WEBHOOK_SECRET` değerini kontrol edin
3. Webhook > HTTP Headers > `Authorization` header'ını kontrol edin
4. Format: `Bearer YOUR_WEBHOOK_SECRET` (Bearer'den sonra boşluk olmalı)

### Role Atanmıyor

**Kontrol**:
1. Supabase Dashboard > Edge Functions > assign-default-role > Logs
2. Hata var mı kontrol edin
3. Webhook tetikleniyor mu kontrol edin (Database > Webhooks > Test)

## Proje Yapısı

```
lib/
├── rbac/
│   ├── config.ts          # Route ve rol tanımları
│   └── helpers.ts          # RBAC helper fonksiyonları (enrichUserWithRBAC, canAccessRoute, vb.)
├── helpers/
│   └── server-side-auth.ts # Server-side auth helpers (getServerAuth, getServerUser, requireRouteAccess)
├── context/
│   └── auth-context.tsx    # Client-side auth context (useAuth hook)
├── supabase/
│   ├── client.ts           # Supabase client (browser)
│   ├── server.ts            # Supabase client (server)
│   ├── proxy.ts             # Proxy middleware (pathname injection)
│   └── functions/
│       └── assign-default-role/  # Edge function (otomatik rol atama)

app/
├── (server-pages)/
│   └── (protected)/
│       └── layout.tsx      # Server-side protected layout
├── (client-pages)/
│   ├── (protected)/
│   │   └── layout.tsx      # Client-side protected layout
│   └── unauthorized/
│       └── page.tsx        # Unauthorized sayfası
```

## Güvenlik Notları

- ✅ **JWT-Based**: Roller ve permissions JWT'de taşınır (gereksiz DB çağrısı yok)
- ✅ **Server-Side Protection**: Layout seviyesinde route koruması
- ✅ **Client-Side Protection**: Client layout'ta da kontrol
- ✅ **Edge Function Security**: Bearer token ile korunmuş
- ✅ **Service Role Key**: Sadece Edge Function içinde kullanılır, client'a expose edilmez

## License

MIT

## License

MIT

