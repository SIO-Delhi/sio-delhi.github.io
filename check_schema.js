
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.log('Missing env vars')
    // try reading from .env manually or just hardcode if we can find them in the codebase
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
    console.log('Checking posts table columns...')
    // Try to select display_order from one row
    const { data, error } = await supabase
        .from('posts')
        .select('display_order')
        .limit(1)

    if (error) {
        console.error('Error selecting display_order:', error.message)
        console.log('Likely cause: Column "display_order" does not exist.')
    } else {
        console.log('Success! Column "display_order" exists.')
        console.log('Data sample:', data)
    }
}

checkSchema()
