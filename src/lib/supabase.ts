import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions for database tables
export interface DbSection {
    id: string
    title: string
    label: string
    order_num: number
}

export interface DbPost {
    id: string
    section_id: string
    title: string
    subtitle: string | null
    content: string
    image: string | null
    layout: string
    created_at: string
    updated_at: string
}
