// supabase/functions/assign-default-role/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // GÜVENLİK: Authorization Bearer token kontrolü (HTTP standartı)
        const authHeader = req.headers.get('authorization')
        const secret = Deno.env.get('WEBHOOK_SECRET')

        if (!secret) {
            console.error('ERROR: WEBHOOK_SECRET not configured')
            return new Response(
                JSON.stringify({ error: 'Server error: WEBHOOK_SECRET not configured' }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Authorization: Bearer TOKEN formatını kontrol et
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('ERROR: Missing or invalid Authorization header')
            return new Response(
                JSON.stringify({ error: 'Unauthorized: Missing or invalid Authorization header' }),
                {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        const token = authHeader.replace('Bearer ', '').trim()

        if (token !== secret) {
            console.error('ERROR: Invalid token')
            return new Response(
                JSON.stringify({ error: 'Unauthorized: Invalid token' }),
                {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // API key doğru, payload'ı parse et
        const body = await req.text()
        let payload
        try {
            payload = JSON.parse(body)
        } catch (parseError) {
            console.error('ERROR: Failed to parse JSON:', parseError)
            throw parseError
        }

        // GÜVENLİK: Webhook payload formatını kontrol et
        // Supabase webhook'ları özel formatta gelir: { type, table, record }
        if (!payload?.type || !payload?.table || !payload?.record) {
            console.error('ERROR: Invalid payload format')
            return new Response(
                JSON.stringify({ error: 'Invalid webhook payload format' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Sadece auth.users tablosundan INSERT event'lerini kabul et
        if (payload.table !== 'users' || payload.type !== 'INSERT') {
            return new Response(
                JSON.stringify({ error: 'Invalid webhook event: Only INSERT on users table is allowed' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Payload'dan user_id al (Supabase webhook formatı)
        const user_id = payload.record.id

        if (!user_id) {
            console.error('ERROR: user_id not found in payload')
            return new Response(
                JSON.stringify({ error: 'Invalid webhook payload: user_id not found' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Service role key SADECE createClient'ta kullanılır (webhook'tan gelmez!)
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!supabaseUrl || !serviceRoleKey) {
            console.error('ERROR: Missing Supabase configuration')
            return new Response(
                JSON.stringify({ error: 'Server error: Missing Supabase configuration' }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        const supabaseAdmin = createClient(
            supabaseUrl,
            serviceRoleKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Mevcut metadata'yı kontrol et
        const { data: existingUser, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(user_id)

        if (fetchError) {
            console.error('ERROR: Failed to fetch user:', fetchError.message)
            return new Response(
                JSON.stringify({ error: fetchError.message }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Eğer zaten role varsa, güncelleme
        const currentMetadata = existingUser.user?.app_metadata || {}

        // Sadece role yoksa veya boşsa ekle
        if (!currentMetadata.role) {
            const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
                app_metadata: {
                    ...currentMetadata,
                    role: 'user',
                    permissions: []
                }
            })

            if (error) {
                console.error('ERROR: Failed to update user:', error.message)
                return new Response(
                    JSON.stringify({ error: error.message }),
                    {
                        status: 500,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    }
                )
            }

            return new Response(
                JSON.stringify({ success: true, user: data.user }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Zaten role varsa, başarılı dön
        return new Response(
            JSON.stringify({ success: true, message: 'Role already assigned' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        const errorStack = error instanceof Error ? error.stack : undefined

        console.error('ERROR:', errorMessage)
        if (errorStack) {
            console.error('Stack:', errorStack)
        }

        return new Response(
            JSON.stringify({
                error: errorMessage,
                details: errorStack
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})
