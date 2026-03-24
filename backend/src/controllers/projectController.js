// backend/src/controllers/projectController.js

const supabase = require('../config/supabase');

// GET /api/projects
const getAll = async (req, res) => {
  try {
    const { group_id } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Si es admin, ver todos los proyectos
    if (userRole === 'admin') {
      let query = supabase
        .from('projects')
        .select(`*, groups (id, name)`)
        .order('created_at', { ascending: false });

      if (group_id) query = query.eq('group_id', group_id);

      const { data, error } = await query;
      if (error) throw error;
      return res.json(data);
    }

    // Para manager y user: obtener proyectos con acceso
    // 1. Proyectos donde es miembro directo
    const { data: directProjects } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', userId);

    const directProjectIds = directProjects?.map(p => p.project_id) || [];

    // 2. Grupos donde pertenece el usuario
    const { data: userGroups } = await supabase
      .from('user_groups')
      .select('group_id')
      .eq('user_id', userId);

    const userGroupIds = userGroups?.map(g => g.group_id) || [];

    // Construir query de proyectos
    let query = supabase
      .from('projects')
      .select(`*, groups (id, name)`)
      .order('created_at', { ascending: false });

    // Filtrar por proyectos accesibles
    if (directProjectIds.length > 0 && userGroupIds.length > 0) {
      // Tiene ambos: proyectos donde es miembro directo O proyectos de sus grupos
      query = query.or(`id.in.(${directProjectIds.join(',')}),group_id.in.(${userGroupIds.join(',')})`);
    } else if (directProjectIds.length > 0) {
      // Solo es miembro directo de proyectos
      query = query.in('id', directProjectIds);
    } else if (userGroupIds.length > 0) {
      // Solo pertenece a grupos
      query = query.in('group_id', userGroupIds);
    } else {
      // No tiene acceso a ningún proyecto
      return res.json([]);
    }

    // Aplicar filtro adicional por group_id si viene en query
    if (group_id) {
      query = query.eq('group_id', group_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('ERROR GET ALL PROYECTOS:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/projects/:id
const getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Primero obtener el proyecto
    const { data: project, error } = await supabase
      .from('projects')
      .select(`*, groups (id, name)`)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    // Si es admin, dar acceso directo
    if (userRole === 'admin') {
      return res.json(project);
    }

    // Verificar si es miembro directo del proyecto
    const { data: memberCheck, error: memberError } = await supabase
      .from('project_members')
      .select('user_id')
      .eq('project_id', id)
      .eq('user_id', userId)
      .single();

    if (memberCheck) {
      return res.json(project);
    }

    // Verificar si pertenece al grupo del proyecto
    if (project.group_id) {
      const { data: groupCheck, error: groupError } = await supabase
        .from('user_groups')
        .select('user_id')
        .eq('group_id', project.group_id)
        .eq('user_id', userId)
        .single();

      if (groupCheck) {
        return res.json(project);
      }
    }

    // No tiene acceso
    return res.status(403).json({ error: 'No tienes acceso a este proyecto' });
    
  } catch (error) {
    console.error('ERROR GET ONE PROYECTO:', error);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/projects
const create = async (req, res) => {
  try {
    const { name, description, group_id, start_date, end_date, status } = req.body;
    if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });

    const { data, error } = await supabase
      .from('projects')
      .insert([{ name, description, group_id, start_date, end_date, status: status || 'pendiente' }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('ERROR CREAR PROYECTO:', error);
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/projects/:id
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, group_id, start_date, end_date, status } = req.body;

    const { data, error } = await supabase
      .from('projects')
      .update({ name, description, group_id, start_date, end_date, status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('ERROR UPDATE PROYECTO:', error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/projects/:id
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Proyecto eliminado correctamente' });
  } catch (error) {
    console.error('ERROR DELETE PROYECTO:', error);
    res.status(500).json({ error: error.message });
  }
};

// ── MIEMBROS ──────────────────────────────────────────

const getMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('project_members')
      .select('*, users(id, name, email)')
      .eq('project_id', id);
    if (error) throw error;
    res.json(data.map(m => ({ ...m.users, assigned_at: m.assigned_at })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const syncMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { memberIds = [] } = req.body;
    await supabase.from('project_members').delete().eq('project_id', id);
    if (memberIds.length > 0) {
      const relations = memberIds.map(user_id => ({ project_id: id, user_id }));
      const { error } = await supabase.from('project_members').insert(relations);
      if (error) throw error;
    }
    res.json({ message: 'Miembros actualizados' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── TAREAS ────────────────────────────────────────────

const getTasks = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', id)
      .order('position', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, deadline } = req.body;
    if (!title) return res.status(400).json({ error: 'El título es obligatorio' });
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ project_id: id, title, description, status: status || 'pendiente', deadline }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, deadline } = req.body;
    const { data, error } = await supabase
      .from('tasks')
      .update({ title, description, status, deadline })
      .eq('id', taskId)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) throw error;
    res.json({ message: 'Tarea eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── COMENTARIOS ───────────────────────────────────────

const getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('comments')
      .select('*, users(id, name)')
      .eq('project_id', id)
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, user_id } = req.body;
    if (!content) return res.status(400).json({ error: 'El contenido es obligatorio' });
    const { data, error } = await supabase
      .from('comments')
      .insert([{ project_id: id, user_id, content }])
      .select('*, users(id, name)')
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) throw error;
    res.json({ message: 'Comentario eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAll, getOne, create, update, remove,
  getMembers, syncMembers,
  getTasks, createTask, updateTask, deleteTask,
  getComments, createComment, deleteComment
};