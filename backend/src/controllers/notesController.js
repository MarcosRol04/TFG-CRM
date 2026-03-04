const supabase = require('../config/supabase');

// GET todas las notas (admin/manager ven todas, user solo las suyas)
const getNotes = async (req, res) => {
  try {
    let query = supabase
      .from('notes')
      .select('*, users!notes_created_by_fkey(name, email), projects(name)')
      .order('updated_at', { ascending: false });

    if (req.user.role === 'user') {
      query = query.eq('created_by', req.user.id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET nota por id
const getNoteById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*, users!notes_created_by_fkey(name, email), projects(name)')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Nota no encontrada.' });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// POST crear nota
const createNote = async (req, res) => {
  const { title, content, color, project_id } = req.body;
  if (!title) return res.status(400).json({ error: 'El título es obligatorio.' });
  try {
    const { data, error } = await supabase
      .from('notes')
      .insert({ title, content: content || '', color: color || '#ffffff', project_id: project_id || null, created_by: req.user.id })
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// PUT editar nota
const updateNote = async (req, res) => {
  const { title, content, color, project_id } = req.body;
  try {
    const { data, error } = await supabase
      .from('notes')
      .update({ title, content, color, project_id: project_id || null, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// DELETE nota
const deleteNote = async (req, res) => {
  try {
    const { error } = await supabase.from('notes').delete().eq('id', req.params.id);
    if (error) throw error;
    return res.json({ message: 'Nota eliminada.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { getNotes, getNoteById, createNote, updateNote, deleteNote };