// frontend/src/components/tools/PollForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../Layout';
import {
  Box, Typography, TextField, Button, MenuItem, Card, CardContent,
  IconButton, Alert, CircularProgress, Divider, Stack, Chip,
  Paper, InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  Save as SaveIcon,
  DragIndicator as DragIcon,
  Event as EventIcon,
  Group as GroupIcon,
  Folder as FolderIcon,
  Public as PublicIcon,
} from '@mui/icons-material';
import { usePolls } from '../../hooks/usePolls';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const POLL_TYPES = [
  { value: 'single',   label: '🔘 Opción única',    desc: 'El usuario elige solo una respuesta' },
  { value: 'multiple', label: '☑️ Opción múltiple', desc: 'El usuario puede elegir varias' },
  { value: 'text',     label: '✍️ Texto libre',      desc: 'El usuario escribe su respuesta' },
];

const SHARE_TYPES = [
  { value: 'all',     label: '🌐 Todos los usuarios' },
  { value: 'group',   label: '👥 Grupo específico' },
  { value: 'project', label: '📁 Proyecto específico' },
];

const EMPTY_FORM = {
  title: '',
  description: '',
  type: 'single',
  deadline: '',
  shared_with_type: 'all',
  shared_with_id: '',
  options: ['', ''],
};

export default function PollForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { loading, error, setError, fetchPoll, createPoll, updatePoll } = usePolls();

  const [form, setForm] = useState(EMPTY_FORM);
  const [groups, setGroups] = useState([]);
  const [projects, setProjects] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(!!id);

  const isEdit = !!id;
  const needsOptions = form.type !== 'text';

  // ✅ FIX: incluir token en todas las peticiones
  const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [groupsRes, projectsRes] = await Promise.all([
          fetch(`${API}/api/groups`, { headers: getHeaders() }),
          fetch(`${API}/api/projects`, { headers: getHeaders() }),
        ]);

        if (groupsRes.ok) {
          const d = await groupsRes.json();
          setGroups(d.data || d || []);
        }
        if (projectsRes.ok) {
          const d = await projectsRes.json();
          setProjects(d.data || d || []);
        }

        if (isEdit) {
          const poll = await fetchPoll(id);
          if (poll) {
            setForm({
              title: poll.title || '',
              description: poll.description || '',
              type: poll.type || 'single',
              deadline: poll.deadline ? poll.deadline.slice(0, 16) : '',
              shared_with_type: poll.shared_with_type || 'all',
              shared_with_id: poll.shared_with_id || '',
              options: poll.poll_options?.length > 0
                ? poll.poll_options.map(o => o.option_text)
                : ['', ''],
            });
          }
        }
      } catch (err) {
        console.error('Error cargando datos:', err);
      } finally {
        setFetchLoading(false);
      }
    };

    loadData();
  }, [id, isEdit]); // ✅ fetchPoll eliminado de deps para evitar loops

  const handleChange = (field) => (e) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleOptionChange = (idx, value) =>
    setForm(prev => {
      const options = [...prev.options];
      options[idx] = value;
      return { ...prev, options };
    });

  const addOption = () =>
    setForm(prev => ({ ...prev, options: [...prev.options, ''] }));

  const removeOption = (idx) => {
    if (form.options.length <= 2) return;
    setForm(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== idx) }));
  };

  const validate = () => {
    if (!form.title.trim()) return 'El título es obligatorio';
    if (needsOptions && form.options.filter(o => o.trim()).length < 2)
      return 'Añade al menos 2 opciones válidas';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }

    const payload = {
      ...form,
      options: needsOptions ? form.options.filter(o => o.trim()) : [],
      shared_with_id: form.shared_with_type !== 'all' ? form.shared_with_id : null,
      deadline: form.deadline || null,
    };

    const result = isEdit ? await updatePoll(id, payload) : await createPoll(payload);
    if (result?.success) navigate('/tools/polls');
  };

  if (fetchLoading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  const validOptionsCount = form.options.filter(o => o.trim()).length;

  return (
    <Layout>
      <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>

        {/* Breadcrumb */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'white' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton onClick={() => navigate('/tools/polls')} size="small">
              <BackIcon />
            </IconButton>
            <Typography variant="body2" color="text.secondary">Encuestas</Typography>
            <Typography variant="body2" color="text.secondary">/</Typography>
            <Typography variant="body2" fontWeight={500}>
              {isEdit ? 'Editar encuesta' : 'Nueva encuesta'}
            </Typography>
          </Box>
        </Paper>

        <Typography variant="h4" fontWeight={800} color="primary" gutterBottom>
          {isEdit ? 'Editar encuesta' : 'Nueva encuesta'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>

            {/* Información básica */}
            <Typography variant="subtitle1" fontWeight={700} mb={2}>📝 Información básica</Typography>

            <TextField fullWidth label="Título *" value={form.title} onChange={handleChange('title')} sx={{ mb: 2 }} />
            <TextField fullWidth label="Descripción" value={form.description} onChange={handleChange('description')} multiline rows={2} sx={{ mb: 2 }} />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
              <TextField select fullWidth label="Tipo *" value={form.type} onChange={handleChange('type')}>
                {POLL_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>

              <TextField
                fullWidth
                label="Fecha límite"
                type="datetime-local"
                value={form.deadline}
                onChange={handleChange('deadline')}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><EventIcon /></InputAdornment>,
                }}
              />
            </Stack>

            <Divider sx={{ my: 3 }} />

            {/* Destinatarios */}
            <Typography variant="subtitle1" fontWeight={700} mb={2}>👥 Destinatarios</Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
              <TextField
                select fullWidth label="Compartir con *"
                value={form.shared_with_type}
                onChange={(e) => setForm(prev => ({ ...prev, shared_with_type: e.target.value, shared_with_id: '' }))}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {form.shared_with_type === 'all'     && <PublicIcon />}
                      {form.shared_with_type === 'group'   && <GroupIcon />}
                      {form.shared_with_type === 'project' && <FolderIcon />}
                    </InputAdornment>
                  ),
                }}
              >
                {SHARE_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>

              {form.shared_with_type === 'group' && (
                <TextField select fullWidth label="Grupo" value={form.shared_with_id} onChange={handleChange('shared_with_id')}>
                  {groups.length === 0
                    ? <MenuItem disabled>No hay grupos disponibles</MenuItem>
                    : groups.map(g => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)
                  }
                </TextField>
              )}

              {form.shared_with_type === 'project' && (
                <TextField select fullWidth label="Proyecto" value={form.shared_with_id} onChange={handleChange('shared_with_id')}>
                  {projects.length === 0
                    ? <MenuItem disabled>No hay proyectos disponibles</MenuItem>
                    : projects.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)
                  }
                </TextField>
              )}
            </Stack>

            {/* Opciones */}
            {needsOptions && (
              <>
                <Divider sx={{ my: 3 }} />

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="subtitle1" fontWeight={700}>🔢 Opciones</Typography>
                  <Chip
                    label={`${validOptionsCount} válidas`}
                    color={validOptionsCount >= 2 ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>

                <Stack spacing={1.5}>
                  {form.options.map((opt, idx) => (
                    <Box key={idx} display="flex" alignItems="center" gap={1}>
                      <DragIcon color="disabled" />
                      <TextField
                        fullWidth size="small"
                        placeholder={`Opción ${idx + 1}`}
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                      />
                      <IconButton
                        size="small" color="error"
                        onClick={() => removeOption(idx)}
                        disabled={form.options.length <= 2}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>

                <Button startIcon={<AddIcon />} onClick={addOption} sx={{ mt: 2 }}>
                  Añadir opción
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Acciones */}
        <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
          <Button variant="outlined" onClick={() => navigate('/tools/polls')}>Cancelar</Button>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={handleSubmit}
            disabled={loading}
          >
            {isEdit ? 'Guardar' : 'Crear'}
          </Button>
        </Box>

      </Box>
    </Layout>
  );
}