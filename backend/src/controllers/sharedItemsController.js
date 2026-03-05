const supabase = require('../config/supabase');

// POST /api/shared-items — compartir un elemento
const shareItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { item_type, item_id, target_type, target_id } = req.body;

    if (!item_type || !item_id || !target_type || !target_id) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Verificar que no esté ya compartido
    const { data: existing } = await supabase
      .from('shared_items')
      .select('id')
      .eq('item_type', item_type)
      .eq('item_id', item_id)
      .eq('target_type', target_type)
      .eq('target_id', target_id)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Ya está compartido con este destino' });
    }

    const { data, error } = await supabase
      .from('shared_items')
      .insert([{ item_type, item_id, shared_by: userId, target_type, target_id }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/shared-items/:id — dejar de compartir
const unshareItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: existing, error: fetchError } = await supabase
      .from('shared_items')
      .select('shared_by')
      .eq('id', id)
      .single();

    if (fetchError || !existing) return res.status(404).json({ error: 'No encontrado' });
    if (existing.shared_by !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    const { error } = await supabase.from('shared_items').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/shared-items/group/:groupId — archivos de un grupo
const getGroupSharedItems = async (req, res) => {
  try {
    const { groupId } = req.params;

    const { data: sharedItems, error } = await supabase
      .from('shared_items')
      .select('*, users:shared_by(name, email)')
      .eq('target_type', 'group')
      .eq('target_id', groupId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const enriched = await enrichSharedItems(sharedItems);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/shared-items/project/:projectId — archivos de un proyecto
const getProjectSharedItems = async (req, res) => {
  try {
    const { projectId } = req.params;

    const { data: sharedItems, error } = await supabase
      .from('shared_items')
      .select('*, users:shared_by(name, email)')
      .eq('target_type', 'project')
      .eq('target_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const enriched = await enrichSharedItems(sharedItems);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Enriquecer con datos del item original
async function enrichSharedItems(items) {
  const enriched = [];

  for (const item of items) {
    let itemData = null;
    let table = '';

    if (item.item_type === 'note') table = 'notes';
    else if (item.item_type === 'spreadsheet') table = 'spreadsheets';
    else if (item.item_type === 'calculator') table = 'calculator_history';

    if (table) {
      const { data } = await supabase
        .from(table)
        .select(item.item_type === 'calculator' ? 'id, expression, result, created_at' : 'id, name, created_at, updated_at')
        .eq('id', item.item_id)
        .single();
      itemData = data;
    }

    enriched.push({ ...item, item_data: itemData });
  }

  return enriched;
}

// GET /api/shared-items/check — verificar si un item está compartido
const checkShared = async (req, res) => {
  try {
    const { item_type, item_id } = req.query;

    const { data, error } = await supabase
      .from('shared_items')
      .select('id, target_type, target_id')
      .eq('item_type', item_type)
      .eq('item_id', item_id);

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { shareItem, unshareItem, getGroupSharedItems, getProjectSharedItems, checkShared };