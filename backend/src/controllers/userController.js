const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');

// LISTAR TODOS LOS USUARIOS
exports.getAll = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, phone, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);  // ← CORREGIDO

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// OBTENER UN USUARIO
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, phone, created_at')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(data);  // ← CORREGIDO

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CREAR USUARIO
exports.create = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Verificar email duplicado
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Este email ya está registrado' });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert([{
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: role || 'user'  // ← CAMBIÉ 'colaborador' por 'user'
      }])
      .select('id, name, email, role, phone, created_at')
      .single();

    if (error) throw error;

    res.status(201).json({
      mensaje: 'Usuario creado correctamente',
      usuario: data
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ACTUALIZAR USUARIO
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, phone, role } = req.body;

    // Preparar datos a actualizar
    const updateData = { name, phone, role };

    // Si se proporciona nueva contraseña, hashearla
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Si se proporciona email, verificar que no esté duplicado
    if (email) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', id)
        .single();

      if (existing) {
        return res.status(400).json({ error: 'Este email ya está registrado' });
      }
      updateData.email = email;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, name, email, role, phone, created_at')
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      mensaje: 'Usuario actualizado correctamente',
      usuario: data
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ELIMINAR USUARIO
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ mensaje: 'Usuario eliminado correctamente' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};