const supabase = require('../config/supabase');

// Guardar operación en historial
const saveOperation = async (req, res) => {
  const { expression, result } = req.body;

  console.log('💾 saveOperation - req.user:', req.user);
  console.log('💾 saveOperation - body:', { expression, result });

  if (!expression || result === undefined) {
    return res.status(400).json({ error: 'expression y result son obligatorios.' });
  }

  // Buscar el id del usuario — puede ser req.user.id, req.user.userId o req.user.sub
  const user_id = req.user.id || req.user.userId || req.user.sub;

  if (!user_id) {
    console.error('❌ No se encontró user_id en req.user:', req.user);
    return res.status(401).json({ error: 'No se pudo identificar al usuario.' });
  }

  try {
    const { data, error } = await supabase
      .from('calculator_history')
      .insert({
        user_id,
        expression: String(expression),
        result:     String(result),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase insert error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('✅ Operación guardada:', data);
    return res.status(201).json(data);
  } catch (err) {
    console.error('❌ Error saveOperation:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

// Obtener historial del usuario
const getHistory = async (req, res) => {
  const user_id = req.user.id || req.user.userId || req.user.sub;

  console.log('📋 getHistory - user_id:', user_id);

  if (!user_id) {
    return res.status(401).json({ error: 'No se pudo identificar al usuario.' });
  }

  try {
    const { data, error } = await supabase
      .from('calculator_history')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('❌ Supabase getHistory error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  } catch (err) {
    console.error('❌ Error getHistory:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

// Borrar historial del usuario
const clearHistory = async (req, res) => {
  const user_id = req.user.id || req.user.userId || req.user.sub;

  if (!user_id) {
    return res.status(401).json({ error: 'No se pudo identificar al usuario.' });
  }

  try {
    const { error } = await supabase
      .from('calculator_history')
      .delete()
      .eq('user_id', user_id);

    if (error) {
      console.error('❌ Supabase clearHistory error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.json({ message: 'Historial borrado.' });
  } catch (err) {
    console.error('❌ Error clearHistory:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { saveOperation, getHistory, clearHistory };