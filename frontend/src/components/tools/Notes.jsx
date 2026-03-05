import React, { useState, useEffect } from 'react';
import Layout from '../Layout';
import ShareDialog from './ShareDialog';
import {
  Box, Typography, Button, TextField, IconButton, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, CircularProgress, MenuItem, Select,
  FormControl, InputLabel, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import ShareIcon from '@mui/icons-material/Share';

const API = 'http://localhost:5000/api';

const NOTE_COLORS = [
  { label: 'Amarillo', value: '#fff9c4' },
  { label: 'Verde',    value: '#c8e6c9' },
  { label: 'Azul',     value: '#bbdefb' },
  { label: 'Rosa',     value: '#f8bbd0' },
  { label: 'Naranja',  value: '#ffe0b2' },
  { label: 'Blanco',   value: '#ffffff' },
];

export default function Notes() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const [notes, setNotes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

  // Dialog crear/editar
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', color: '#fff9c4', project_id: '' });

  // Dialog eliminar
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // Share
  const [shareItem, setShareItem] = useState(null);

  const showSnack = (msg, sev = 'success') => setSnack({ open: true, msg, sev });

  useEffect(() => {
    Promise.all([
      fetch(`${API}/notes`, { headers }).then(r => r.json()),
      fetch(`${API}/projects`, { headers }).then(r => r.json())
    ]).then(([n, p]) => {
      setNotes(Array.isArray(n) ? n : []);
      setProjects(Array.isArray(p) ? p : []);
    }).catch(() => showSnack('Error al cargar', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', content: '', color: '#fff9c4', project_id: '' });
    setDialog(true);
  };

  const openEdit = (note) => {
    setEditing(note);
    setForm({ title: note.title, content: note.content, color: note.color || '#fff9c4', project_id: note.project_id || '' });
    setDialog(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { showSnack('El título es requerido', 'warning'); return; }
    const body = { ...form, project_id: form.project_id || null };
    try {
      if (editing) {
        const res = await fetch(`${API}/notes/${editing.id}`, { method: 'PUT', headers, body: JSON.stringify(body) });
        const updated = await res.json();
        setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
        showSnack('Nota actualizada');
      } else {
        const res = await fetch(`${API}/notes`, { method: 'POST', headers, body: JSON.stringify(body) });
        const created = await res.json();
        setNotes(prev => [created, ...prev]);
        showSnack('Nota creada');
      }
      setDialog(false);
    } catch { showSnack('Error al guardar', 'error'); }
  };

  const confirmDelete = (note) => { setToDelete(note); setDeleteDialog(true); };

  const handleDelete = async () => {
    try {
      await fetch(`${API}/notes/${toDelete.id}`, { method: 'DELETE', headers });
      setNotes(prev => prev.filter(n => n.id !== toDelete.id));
      showSnack('Nota eliminada');
    } catch { showSnack('Error al eliminar', 'error'); }
    finally { setDeleteDialog(false); setToDelete(null); }
  };

  const filtered = notes.filter(n =>
    n.title?.toLowerCase().includes(search.toLowerCase()) ||
    n.content?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>

        {/* Cabecera */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h5" fontWeight="bold" sx={{ flexGrow: 1 }}>📝 Notas</Typography>
          <TextField
            size="small"
            placeholder="Buscar notas…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 0.5, color: 'text.secondary' }} /> }}
            sx={{ minWidth: 220 }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Nueva nota</Button>
        </Box>

        {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}

        {!loading && filtered.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="text.secondary">
              {search ? 'No hay notas que coincidan con la búsqueda' : 'No tienes notas todavía. ¡Crea la primera!'}
            </Typography>
          </Box>
        )}

        {/* Grid de notas */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {filtered.map(note => (
            <Card
              key={note.id}
              sx={{
                width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33% - 11px)' },
                bgcolor: note.color || '#fff9c4',
                border: '1px solid #e0e0e0',
                boxShadow: 'none',
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ flexGrow: 1, wordBreak: 'break-word' }}>
                    {note.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                    <Tooltip title="Compartir">
                      <IconButton size="small" onClick={() => setShareItem(note)}>
                        <ShareIcon fontSize="small" sx={{ color: '#1976d2' }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => openEdit(note)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton size="small" onClick={() => confirmDelete(note)}>
                        <DeleteIcon fontSize="small" sx={{ color: '#d32f2f' }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', mb: 1, minHeight: 40 }}>
                  {note.content}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                  {note.project_id && (
                    <Typography variant="caption" sx={{ bgcolor: 'rgba(0,0,0,0.08)', borderRadius: 1, px: 0.8, py: 0.2 }}>
                      📁 {projects.find(p => p.id === note.project_id)?.name || 'Proyecto'}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                    {new Date(note.updated_at || note.created_at).toLocaleDateString('es-ES')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Dialog crear/editar */}
        <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editing ? 'Editar nota' : 'Nueva nota'}</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              autoFocus
              label="Título"
              fullWidth
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            />
            <TextField
              label="Contenido"
              fullWidth
              multiline
              rows={5}
              value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
            />
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Color</InputLabel>
                <Select value={form.color} label="Color" onChange={e => setForm(p => ({ ...p, color: e.target.value }))}>
                  {NOTE_COLORS.map(c => (
                    <MenuItem key={c.value} value={c.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 16, height: 16, bgcolor: c.value, borderRadius: '50%', border: '1px solid #ccc' }} />
                        {c.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Proyecto (opcional)</InputLabel>
                <Select value={form.project_id} label="Proyecto (opcional)" onChange={e => setForm(p => ({ ...p, project_id: e.target.value }))}>
                  <MenuItem value="">Sin proyecto</MenuItem>
                  {projects.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialog(false)}>Cancelar</Button>
            <Button variant="contained" onClick={handleSave}>Guardar</Button>
          </DialogActions>
        </Dialog>

        {/* Dialog eliminar */}
        <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Eliminar nota</DialogTitle>
          <DialogContent>
            <Typography>¿Seguro que quieres eliminar <strong>{toDelete?.title}</strong>?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog(false)}>Cancelar</Button>
            <Button variant="contained" color="error" onClick={handleDelete}>Eliminar</Button>
          </DialogActions>
        </Dialog>

        {/* Share dialog */}
        {shareItem && (
          <ShareDialog
            open={!!shareItem}
            onClose={() => setShareItem(null)}
            itemType="note"
            itemId={shareItem.id}
            itemName={shareItem.title}
          />
        )}

        <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity={snack.sev} variant="filled">{snack.msg}</Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
}