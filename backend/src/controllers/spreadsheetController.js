const supabase = require('../config/supabase');

// GET /api/spreadsheets — lista del usuario
const getSpreadsheets = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabase
      .from('spreadsheets')
      .select('id, name, created_at, updated_at')
      .eq('created_by', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/spreadsheets/:id — detalle
const getSpreadsheet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('spreadsheets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'No encontrado' });
    if (data.created_by !== userId) return res.status(403).json({ error: 'Sin permiso' });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/spreadsheets — crear
const createSpreadsheet = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, sheets } = req.body;

    if (!name) return res.status(400).json({ error: 'El nombre es requerido' });

    const initialSheets = sheets || [
      {
        id: 'sheet1',
        name: 'Hoja 1',
        data: Array.from({ length: 20 }, () => Array(10).fill(''))
      }
    ];

    const { data, error } = await supabase
      .from('spreadsheets')
      .insert([{ name, sheets: initialSheets, created_by: userId }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/spreadsheets/:id — actualizar
const updateSpreadsheet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, sheets } = req.body;

    const { data: existing, error: fetchError } = await supabase
      .from('spreadsheets')
      .select('created_by')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!existing) return res.status(404).json({ error: 'No encontrado' });
    if (existing.created_by !== userId) return res.status(403).json({ error: 'Sin permiso' });

    const updates = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (sheets !== undefined) updates.sheets = sheets;

    const { data, error } = await supabase
      .from('spreadsheets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/spreadsheets/:id — eliminar
const deleteSpreadsheet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: existing, error: fetchError } = await supabase
      .from('spreadsheets')
      .select('created_by')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!existing) return res.status(404).json({ error: 'No encontrado' });
    if (existing.created_by !== userId) return res.status(403).json({ error: 'Sin permiso' });

    const { error } = await supabase.from('spreadsheets').delete().eq('id', id);
    if (error) throw error;

    // Eliminar referencias en shared_items
    await supabase.from('shared_items').delete().eq('item_type', 'spreadsheet').eq('item_id', id);

    res.json({ message: 'Eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getSpreadsheets, getSpreadsheet, createSpreadsheet, updateSpreadsheet, deleteSpreadsheet };