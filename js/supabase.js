/* =========================================
   Echo Path
   Supabase Client

   IMPORTANT
   - SUPABASE_URL / PUBLISHABLE KEY only.
   - Never put service_role / secret key here.
========================================= */

import {
    createClient
}
from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


/* =========================================
   1. Supabase project configuration

   Android local.properties에 이미 있는
   SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY 값을
   아래에 각각 붙여넣으세요.

   Publishable key는 RLS와 함께 사용하는
   브라우저용 공개 키입니다.
========================================= */

const SUPABASE_URL =
    "https://kwicefcdhcnpolfpdjvk.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_q973psFfdiCh-Yj531goSQ_lDsA2Shc";


/* =========================================
   2. Supabase client
========================================= */

export const supabase =
    createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    );


/* =========================================
   3. Configuration check
========================================= */

export function isSupabaseConfigured() {

    return (
        SUPABASE_URL.startsWith("https://")
        &&
        !SUPABASE_URL.includes(
            "PASTE_YOUR"
        )
        &&
        SUPABASE_PUBLISHABLE_KEY.length > 20
        &&
        !SUPABASE_PUBLISHABLE_KEY.includes(
            "PASTE_YOUR"
        )
    );

}