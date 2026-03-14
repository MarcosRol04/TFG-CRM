// backend/src/controllers/pollsController.js
const supabase = require('../config/supabase');

// ─────────────────────────────────────────────
// GET /api/polls — Listar encuestas accesibles
// ─────────────────────────────────────────────
const getPolls = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { status } = req.query;

    let query = supabase
      .from('polls')
      .select(`*, poll_options (id, option_text, position), poll_votes (id, user_id)`)
      .order('created_at', { ascending: false });

    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'closed') {
      query = query.eq('is_active', false);
    }

    const { data: polls, error } = await query;
    if (error) throw error;

    let filteredPolls = polls;
    if (role !== 'admin') {
      const { data: userGroups } = await supabase
        .from('group_members').select('group_id').eq('user_id', userId);
      const { data: userProjects } = await supabase
        .from('project_members').select('project_id').eq('user_id', userId);

      const groupIds = (userGroups || []).map(g => g.group_id);
      const projectIds = (userProjects || []).map(p => p.project_id);

      filteredPolls = polls.filter(poll => {
        if (poll.shared_with_type === 'all') return true;
        if (poll.shared_with_type === 'group') return groupIds.includes(poll.shared_with_id);
        if (poll.shared_with_type === 'project') return projectIds.includes(poll.shared_with_id);
        if (poll.created_by === userId) return true;
        return false;
      });
    }

    const enriched = filteredPolls.map(poll => {
      const uniqueVoters = new Set((poll.poll_votes || []).map(v => v.user_id)).size;
      return {
        ...poll,
        user_has_voted: (poll.poll_votes || []).some(v => v.user_id === userId),
        total_votes: uniqueVoters,
        poll_options: (poll.poll_options || []).sort((a, b) => a.position - b.position),
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('getPolls error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/polls/:id — Detalle de una encuesta
// ─────────────────────────────────────────────
const getPollById = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;

    const { data: poll, error } = await supabase
      .from('polls')
      .select(`*, poll_options (id, option_text, position), poll_votes (id, option_id, user_id, text_response, voted_at)`)
      .eq('id', id)
      .single();

    if (error || !poll) {
      return res.status(404).json({ success: false, message: 'Encuesta no encontrada' });
    }

    const options = (poll.poll_options || []).sort((a, b) => a.position - b.position);
    const votes = poll.poll_votes || [];
    const uniqueVoters = new Set(votes.map(v => v.user_id)).size;

    const results = options.map(opt => {
      const uniqueVotersForOpt = new Set(
        votes.filter(v => v.option_id === opt.id).map(v => v.user_id)
      ).size;
      return {
        ...opt,
        vote_count: uniqueVotersForOpt,
        percentage: uniqueVoters > 0 ? Math.round((uniqueVotersForOpt / uniqueVoters) * 100) : 0,
      };
    });

    let voterDetails = [];
    if (votes.length > 0) {
      const voterIds = [...new Set(votes.map(v => v.user_id))];
      const { data: users } = await supabase
        .from('users').select('id, name, email').in('id', voterIds);

      voterDetails = votes.map(v => ({
        ...v,
        user: users?.find(u => u.id === v.user_id) || { name: 'Usuario', email: '' },
        option_text: options.find(o => o.id === v.option_id)?.option_text || v.text_response,
      }));
    }

    res.json({
      success: true,
      data: {
        ...poll,
        poll_options: results,
        poll_votes: voterDetails,
        total_voters: uniqueVoters,
        user_has_voted: votes.some(v => v.user_id === userId),
        user_votes: votes.filter(v => v.user_id === userId),
      },
    });
  } catch (error) {
    console.error('getPollById error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/polls — Crear encuesta
// ─────────────────────────────────────────────
const createPoll = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { title, description, type, deadline, shared_with_type, shared_with_id, options } = req.body;

    if (!title || !type || !shared_with_type) {
      return res.status(400).json({ success: false, message: 'Título, tipo y destinatario son obligatorios' });
    }
    if ((type === 'single' || type === 'multiple') && (!options || options.length < 2)) {
      return res.status(400).json({ success: false, message: 'Se necesitan al menos 2 opciones' });
    }

    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        type,
        deadline: deadline || null,
        shared_with_type,
        shared_with_id: shared_with_id || null,
        created_by: userId,
        is_active: true,
      })
      .select()
      .single();

    if (pollError) throw pollError;

    if (options && options.length > 0) {
      const optionsToInsert = options
        .filter(o => o.trim() !== '')
        .map((opt, idx) => ({ poll_id: poll.id, option_text: opt.trim(), position: idx }));

      if (optionsToInsert.length > 0) {
        const { error: optError } = await supabase.from('poll_options').insert(optionsToInsert);
        if (optError) throw optError;
      }
    }

    const { data: fullPoll } = await supabase
      .from('polls')
      .select('*, poll_options(id, option_text, position)')
      .eq('id', poll.id)
      .single();

    res.status(201).json({ success: true, data: fullPoll, message: 'Encuesta creada correctamente' });
  } catch (error) {
    console.error('createPoll error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// PUT /api/polls/:id — Actualizar encuesta
// ─────────────────────────────────────────────
const updatePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;
    const { title, description, deadline, is_active, options } = req.body;

    const { data: existing } = await supabase.from('polls').select('created_by').eq('id', id).single();
    if (!existing) return res.status(404).json({ success: false, message: 'Encuesta no encontrada' });
    if (existing.created_by !== userId && role !== 'admin') {
      return res.status(403).json({ success: false, message: 'No tienes permiso para editar esta encuesta' });
    }

    const { count } = await supabase
      .from('poll_votes').select('id', { count: 'exact' }).eq('poll_id', id);

    if (count > 0 && options) {
      return res.status(400).json({ success: false, message: 'No se pueden editar opciones de una encuesta con votos' });
    }

    const updates = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (deadline !== undefined) updates.deadline = deadline || null;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data: poll, error } = await supabase
      .from('polls').update(updates).eq('id', id).select().single();
    if (error) throw error;

    if (options && count === 0) {
      await supabase.from('poll_options').delete().eq('poll_id', id);
      const optionsToInsert = options
        .filter(o => o.trim() !== '')
        .map((opt, idx) => ({ poll_id: id, option_text: opt.trim(), position: idx }));
      if (optionsToInsert.length > 0) {
        await supabase.from('poll_options').insert(optionsToInsert);
      }
    }

    res.json({ success: true, data: poll, message: 'Encuesta actualizada' });
  } catch (error) {
    console.error('updatePoll error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/polls/:id — Eliminar encuesta
// ─────────────────────────────────────────────
const deletePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    const { data: existing } = await supabase.from('polls').select('created_by').eq('id', id).single();
    if (!existing) return res.status(404).json({ success: false, message: 'Encuesta no encontrada' });
    if (existing.created_by !== userId && role !== 'admin') {
      return res.status(403).json({ success: false, message: 'No tienes permiso para eliminar esta encuesta' });
    }

    const { error } = await supabase.from('polls').delete().eq('id', id);
    if (error) throw error;

    res.json({ success: true, message: 'Encuesta eliminada correctamente' });
  } catch (error) {
    console.error('deletePoll error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/polls/:id/vote — Votar en encuesta
// ─────────────────────────────────────────────
const votePoll = async (req, res) => {
  try {
    const { id: pollId } = req.params;
    const { id: userId } = req.user;
    const { option_ids, text_response } = req.body;

    const { data: poll, error: pollError } = await supabase
      .from('polls').select('*, poll_options(id)').eq('id', pollId).single();

    if (pollError || !poll) {
      return res.status(404).json({ success: false, message: 'Encuesta no encontrada' });
    }
    if (!poll.is_active) {
      return res.status(400).json({ success: false, message: 'Esta encuesta está cerrada' });
    }
    if (poll.deadline && new Date(poll.deadline) < new Date()) {
      return res.status(400).json({ success: false, message: 'Esta encuesta ha expirado' });
    }

    const { data: existingVote } = await supabase
      .from('poll_votes').select('id').eq('poll_id', pollId).eq('user_id', userId).limit(1);

    if (existingVote && existingVote.length > 0) {
      return res.status(400).json({ success: false, message: 'Ya has votado en esta encuesta' });
    }

    let votesToInsert = [];
    if (poll.type === 'text') {
      if (!text_response?.trim()) {
        return res.status(400).json({ success: false, message: 'La respuesta no puede estar vacía' });
      }
      votesToInsert = [{ poll_id: pollId, user_id: userId, text_response: text_response.trim() }];
    } else if (poll.type === 'single') {
      if (!option_ids || option_ids.length !== 1) {
        return res.status(400).json({ success: false, message: 'Debes seleccionar exactamente una opción' });
      }
      votesToInsert = [{ poll_id: pollId, user_id: userId, option_id: option_ids[0] }];
    } else if (poll.type === 'multiple') {
      if (!option_ids || option_ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Debes seleccionar al menos una opción' });
      }
      votesToInsert = option_ids.map(optId => ({ poll_id: pollId, user_id: userId, option_id: optId }));
    }

    const { error: voteError } = await supabase.from('poll_votes').insert(votesToInsert);
    if (voteError) throw voteError;

    res.json({ success: true, message: '¡Voto registrado correctamente!' });
  } catch (error) {
    console.error('votePoll error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/polls/:id/export — Exportar CSV
// ─────────────────────────────────────────────
const exportPollResults = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: poll, error } = await supabase
      .from('polls')
      .select(`*, poll_options(id, option_text, position), poll_votes(id, option_id, user_id, text_response, voted_at)`)
      .eq('id', id)
      .single();

    if (error || !poll) {
      return res.status(404).json({ success: false, message: 'Encuesta no encontrada' });
    }

    const voterIds = [...new Set((poll.poll_votes || []).map(v => v.user_id))];
    let users = [];
    if (voterIds.length > 0) {
      const { data } = await supabase.from('users').select('id, name, email').in('id', voterIds);
      users = data || [];
    }

    const lines = [
      `"Encuesta","${poll.title}"`,
      `"Tipo","${poll.type}"`,
      `"Total votantes","${voterIds.length}"`,
      `"Exportado","${new Date().toLocaleString('es-ES')}"`,
      '',
      '"Usuario","Email","Respuesta","Fecha voto"',
    ];

    (poll.poll_votes || []).forEach(vote => {
      const user = users.find(u => u.id === vote.user_id) || {};
      const option = (poll.poll_options || []).find(o => o.id === vote.option_id);
      const response = option ? option.option_text : (vote.text_response || '');
      lines.push(`"${user.name || ''}","${user.email || ''}","${response}","${new Date(vote.voted_at).toLocaleString('es-ES')}"`);
    });

    const csv = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="encuesta-${id}.csv"`);
    res.send('\uFEFF' + csv);
  } catch (error) {
    console.error('exportPollResults error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPolls, getPollById, createPoll, updatePoll, deletePoll, votePoll, exportPollResults };