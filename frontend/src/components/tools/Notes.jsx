import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, CardActions,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Tooltip, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axios from 'axios';
import Layout from '../Layout';

const API   = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const token = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const NOTE_COLORS = [
  { label: 'Blanco',   value: '#ffffff' },
  { label: 'Amarillo', value: '#fff9c4' },
  { label: 'Azul',     value: '#e3f2fd' },
  { label: 'Verde',    value: '#e8f5e9' },
  { label: 'Rosa',     value: '#fce4ec' },
  { label: 'Naranja',  value: '#fff3e0' },
];

const emptyForm = { title: '', content: '', color: '#ffffff', project_id: '' };

export default function Notes() {
  const navigate = useNavigate();
  const [notes, setNotes]       = useState([]);
  const [projects, setProjects] = useState([]);
  const [open, setOpen]         = useState(false);
  const [form, setForm]         = useState(emptyForm);
  const [editing, setEditing]   = useState(null);
  const [alert, setAlert]       = useState(null);
  const [search, setSearch]     = useState('');

  const load = async () => {
    try {
      const [n, p] = await Promise.all([
        axios.get(`${API}/notes`,    { headers: token() }),
        axios.get(`${API}/projects`, { headers: token() }),
      ]);
      setNotes(n.data);
      setProjects(p.data.projects || p.data);
    } catch {
      setAlert({ type: 'error', msg: 'Error al cargar los datos.' });
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditing(null); setOpen(true); };
  const openEdit   = (n) => {
    setForm({ title: n.title, content: n.content, color: n.color, project_id: n.project_id || '' });
    setEditing(n.id);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title) return setAlert({ type: 'warning', msg: 'El título es obligatorio.' });
    try {
      if (editing) {
        await axios.put(`${API}/notes/${editing}`, form, { headers: token() });
      } else {
        await axios.post(`${API}/notes`, form, { headers: token() });
      }
      setOpen(false);
      setAlert({ type: 'success', msg: editing ? 'Nota actualizada.' : 'Nota creada.' });
      load();
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.error || 'Error al guardar.' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta nota?')) return;
    try {
      await axios.delete(`${API}/notes/${id}`, { headers: token() });
      load();
    } catch {
      setAlert({ type: 'error', msg: 'Error al eliminar.' });
    }
  };

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => navigate('/tools')} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight="bold">Notas</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              size="small" placeholder="Buscar notas…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: 220 }}
            />
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              Nueva nota
            </Button>
          </Box>
        </Box>

        {alert && (
          <Alert severity={alert.type} onClose={() => setAlert(null)} sx={{ mb: 3 }}>
            {alert.msg}
          </Alert>
        )}

        {filtered.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <Typography>No hay notas todavía. ¡Crea la primera!</Typography>
          </Box>
        )}

        {/* Grid de notas */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {filtered.map((note) => (
            <Box key={note.id} sx={{ flex: '1 1 280px', maxWidth: 380 }}>
              <Card sx={{
                borderRadius: 2,
                border: '1px solid #e0e0e0',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                bgcolor: note.color || '#fff',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <CardContent sx={{ flex: 1 }}>
                  <Typography fontWeight={600} fontSize={15} gutterBottom noWrap>
                    {note.title}
                  </Typography>
                  {note.projects && (
                    <Chip label={note.projects.name} size="small" sx={{ mb: 1, fontSize: 10, height: 20 }} />
                  )}
                  <Typography variant="body2" color="text.secondary" sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.6,
                  }}>
                    {note.content || 'Sin contenido.'}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {note.users?.name} · {new Date(note.updated_at).toLocaleDateString('es-ES')}
                  </Typography>
                  <Box>
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => openEdit(note)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton size="small" color="error" onClick={() => handleDelete(note.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>

        {/* Dialog crear/editar */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editing ? 'Editar nota' : 'Nueva nota'}</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
            <TextField
              label="Título" fullWidth value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <TextField
              label="Contenido" fullWidth multiline rows={5} value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
            <TextField
              select label="Proyecto (opcional)" fullWidth value={form.project_id}
              onChange={(e) => setForm({ ...form, project_id: e.target.value })}
            >
              <MenuItem value="">— Sin proyecto —</MenuItem>
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
              ))}
            </TextField>
            <TextField
              select label="Color" fullWidth value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            >
              {NOTE_COLORS.map((c) => (
                <MenuItem key={c.value} value={c.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: c.value, border: '1px solid #e0e0e0' }} />
                    {c.label}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="contained" onClick={handleSave}>Guardar</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
}