const express = require('express');
const cors = require('cors');
require('dotenv').config();
const supabase = require('./config/supabase');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const projectRoutes = require('./routes/projectRoutes');
const notesRoutes      = require('./routes/notesRoutes');
const calculatorRoutes = require('./routes/calculatorRoutes');
const spreadsheetRoutes = require('./routes/spreadsheetRoutes');
const sharedItemsRoutes = require('./routes/sharedItemsRoutes');
const pollsRoutes = require('./routes/pollsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middlewares PRIMERO, antes que cualquier ruta
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/notes',      notesRoutes);
app.use('/api/calculator', calculatorRoutes);
app.use('/api/spreadsheets', spreadsheetRoutes);
app.use('/api/shared-items', sharedItemsRoutes);
app.use('/api/polls', pollsRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const { error } = await supabase.from('users').select('count');
    if (error) throw error;
    res.json({
      mensaje: '✅ Servidor y base de datos funcionando',
      baseDeDatos: '✅ Conectado a Supabase',
      fecha: new Date().toLocaleString()
    });
  } catch (error) {
    res.json({ mensaje: '✅ Servidor funcionando', baseDeDatos: '❌ Error: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});