const express = require('express');
const cors = require('cors');
require('dotenv').config();
const supabase = require('./config/supabase');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/api/health', async (req, res) => {
  try {
    // Intenta leer la tabla users
    const { data, error } = await supabase
      .from('users')
      .select('count');

    if (error) throw error;

    res.json({
      mensaje: '✅ Servidor y base de datos funcionando',
      baseDeDatos: '✅ Conectado a Supabase',
      fecha: new Date().toLocaleString()
    });
  } catch (error) {
    res.json({
      mensaje: '✅ Servidor funcionando',
      baseDeDatos: '❌ Error: ' + error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});