// chipbook/js/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://dxnjeurgrhhubskdcidq.supabase.co'

const SUPABASE_KEY = 'sb_publishable_oMEgZ8_yufr9j3zyIB3wNQ_qXtywKA8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)