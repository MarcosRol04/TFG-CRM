const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno de Supabase');
  console.error('📝 Crea un archivo .env en /backend con:');
  console.error('SUPABASE_URL=tu_url');
  console.error('SUPABASE_KEY=tu_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log('✅ Supabase configurado correctamente');

module.exports = supabase;