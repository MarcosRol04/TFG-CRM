const supabase = require('../config/supabase');

const getAll = async (req, res) => {
  try {
    const { data: groups, error } = await supabase
      .from('groups')
      .select(`
        *,
        user_groups (
          assigned_at,
          users (id, name, email)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const result = groups.map(g => ({
      ...g,
      members: g.user_groups.map(ug => ({ ...ug.users, assigned_at: ug.assigned_at }))
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: group, error } = await supabase
      .from('groups')
      .select(`
        *,
        user_groups (
          assigned_at,
          users (id, name, email)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!group) return res.status(404).json({ error: 'Grupo no encontrado' });

    group.members = group.user_groups.map(ug => ({ ...ug.users, assigned_at: ug.assigned_at }));
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, description, memberIds = [] } = req.body;
    if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });

    const { data: group, error } = await supabase
      .from('groups')
      .insert([{ name, description }])
      .select()
      .single();

    if (error) throw error;

    if (memberIds.length > 0) {
      const relations = memberIds.map(user_id => ({ user_id, group_id: group.id }));
      const { error: relError } = await supabase.from('user_groups').insert(relations);
      if (relError) throw relError;
    }

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, memberIds } = req.body;

    const { data: group, error } = await supabase
      .from('groups')
      .update({ name, description })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (memberIds !== undefined) {
      await supabase.from('user_groups').delete().eq('group_id', id);
      if (memberIds.length > 0) {
        const relations = memberIds.map(user_id => ({ user_id, group_id: id }));
        await supabase.from('user_groups').insert(relations);
      }
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('groups').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Grupo eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET links de un grupo
const getLinks = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('group_links')
      .select('*')
      .eq('group_id', id)
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST añadir link
const addLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, url } = req.body;
    if (!name || !url) return res.status(400).json({ error: 'Nombre y URL obligatorios' });
    const { data, error } = await supabase
      .from('group_links')
      .insert([{ group_id: id, name, url }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE eliminar link
const removeLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { error } = await supabase.from('group_links').delete().eq('id', linkId);
    if (error) throw error;
    res.json({ message: 'Link eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE salir del grupo
const leaveGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const { error } = await supabase
      .from('user_groups')
      .delete()
      .eq('group_id', id)
      .eq('user_id', userId);
    if (error) throw error;
    res.json({ message: 'Has salido del grupo' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, getOne, create, update, remove, getLinks, addLink, removeLink, leaveGroup };