import React, { useState, useEffect } from 'react';
import Layout from '../Layout';
import ShareDialog from './ShareDialog';
import {
  Box, Typography, Button, TextField, IconButton, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, CircularProgress, MenuItem, Select,
  FormControl, InputLabel, Tooltip, Paper, alpha, Chip,
  Fade, Zoom
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import ShareIcon from '@mui/icons-material/Share';
import FolderIcon from '@mui/icons-material/Folder';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ColorLensIcon from '@mui/icons-material/ColorLens';

const API = 'http://localhost:5000/api';

const NOTE_COLORS = [
  { label: 'Amarillo', value: '#fff9c4', light: '#fffde7' },
  { label: 'Verde', value: '#c8e6c9', light: '#f1f8e9' },
  { label: 'Azul', value: '#bbdefb', light: '#e3f2fd' },
  { label: 'Rosa', value: '#f8bbd0', light: '#fce4ec' },
  { label: 'Naranja', value: '#ffe0b2', light: '#fff3e0' },
  { label: 'Blanco', value: '#ffffff', light: '#fafafa' },
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
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4
      }}>
        <Paper 
          elevation={0}
          sx={{ 
            maxWidth: 1400, 
            mx: 'auto', 
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: 'background.default'
          }}
        >
          {/* Header con efecto vidrio */}
          <Box sx={{ 
            p: 3, 
            background: 'linear-gradient(to right, #f8f9fa, #ffffff)',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventNoteIcon sx={{ fontSize: 32, color: '#667eea' }} />
                <Typography variant="h5" fontWeight="600" sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Mis Notas
                </Typography>
              </Box>
              
              <Box sx={{ flexGrow: 1 }} />
              
              <TextField
                size="small"
                placeholder="Buscar notas..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                InputProps={{ 
                  startAdornment: <SearchIcon sx={{ mr: 0.5, color: 'text.secondary' }} />,
                  sx: { borderRadius: 3, bgcolor: 'background.paper' }
                }}
                sx={{ minWidth: 280 }}
              />
              
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={openCreate}
                sx={{ 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                  px: 3,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4292 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Nueva nota
              </Button>
            </Box>
          </Box>

          <Box sx={{ p: 3 }}>
            {loading && (
              <Fade in={loading}>
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress sx={{ color: '#667eea' }} />
                </Box>
              </Fade>
            )}

            {!loading && filtered.length === 0 && (
              <Fade in={!loading}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    textAlign: 'center', 
                    py: 8, 
                    px: 3,
                    bgcolor: alpha('#667eea', 0.02),
                    borderRadius: 3,
                    border: '2px dashed',
                    borderColor: alpha('#667eea', 0.2)
                  }}
                >
                  <EventNoteIcon sx={{ fontSize: 64, color: alpha('#667eea', 0.3), mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {search ? 'No hay notas que coincidan' : 'Comienza a tomar notas'}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 3 }}>
                    {search ? 'Prueba con otros términos de búsqueda' : 'Crea tu primera nota para organizar tus ideas'}
                  </Typography>
                  {!search && (
                    <Button 
                      variant="outlined" 
                      startIcon={<AddIcon />} 
                      onClick={openCreate}
                      sx={{ 
                        borderRadius: 3,
                        borderColor: '#667eea',
                        color: '#667eea',
                        '&:hover': { borderColor: '#764ba2', bgcolor: alpha('#667eea', 0.02) }
                      }}
                    >
                      Crear primera nota
                    </Button>
                  )}
                </Paper>
              </Fade>
            )}

            {/* Grid de notas */}
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)'
              },
              gap: 2
            }}>
              {filtered.map((note, index) => (
                <Zoom in={true} style={{ transitionDelay: `${index * 50}ms` }} key={note.id}>
                  <Card
                    sx={{
                      bgcolor: note.color || '#fff9c4',
                      borderRadius: 2.5,
                      border: '1px solid',
                      borderColor: alpha('#000', 0.08),
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': { 
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 28px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)',
                        borderColor: alpha('#667eea', 0.3)
                      },
                      position: 'relative',
                      overflow: 'visible'
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                        <Typography 
                          variant="subtitle1" 
                          fontWeight="600" 
                          sx={{ 
                            flexGrow: 1, 
                            wordBreak: 'break-word',
                            lineHeight: 1.4,
                            color: alpha('#000', 0.87)
                          }}
                        >
                          {note.title}
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          gap: 0.5, 
                          ml: 1,
                          bgcolor: alpha('#fff', 0.8),
                          borderRadius: 2,
                          p: 0.5,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}>
                          <Tooltip title="Compartir" arrow placement="top">
                            <IconButton 
                              size="small" 
                              onClick={() => setShareItem(note)}
                              sx={{ 
                                color: '#667eea',
                                '&:hover': { bgcolor: alpha('#667eea', 0.1) }
                              }}
                            >
                              <ShareIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar" arrow placement="top">
                            <IconButton 
                              size="small" 
                              onClick={() => openEdit(note)}
                              sx={{ 
                                color: '#764ba2',
                                '&:hover': { bgcolor: alpha('#764ba2', 0.1) }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar" arrow placement="top">
                            <IconButton 
                              size="small" 
                              onClick={() => confirmDelete(note)}
                              sx={{ 
                                color: '#d32f2f',
                                '&:hover': { bgcolor: alpha('#d32f2f', 0.1) }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      <Typography 
                        variant="body2" 
                        sx={{ 
                          whiteSpace: 'pre-wrap', 
                          wordBreak: 'break-word', 
                          mb: 2,
                          minHeight: 60,
                          color: alpha('#000', 0.6),
                          lineHeight: 1.6
                        }}
                      >
                        {note.content || <em style={{ opacity: 0.5 }}>Sin contenido</em>}
                      </Typography>

                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mt: 1,
                        pt: 1,
                        borderTop: '1px solid',
                        borderColor: alpha('#000', 0.08)
                      }}>
                        {note.project_id ? (
                          <Chip
                            icon={<FolderIcon sx={{ fontSize: 16 }} />}
                            label={projects.find(p => p.id === note.project_id)?.name || 'Proyecto'}
                            size="small"
                            sx={{ 
                              bgcolor: alpha('#667eea', 0.1),
                              color: '#667eea',
                              fontWeight: 500,
                              '& .MuiChip-icon': { color: '#667eea' }
                            }}
                          />
                        ) : (
                          <Chip
                            label="Sin proyecto"
                            size="small"
                            variant="outlined"
                            sx={{ opacity: 0.5 }}
                          />
                        )}
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: alpha('#000', 0.4),
                            fontWeight: 500
                          }}
                        >
                          {new Date(note.updated_at || note.created_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Zoom>
              ))}
            </Box>

            {/* Dialog crear/editar */}
            <Dialog 
              open={dialog} 
              onClose={() => setDialog(false)} 
              maxWidth="sm" 
              fullWidth
              TransitionComponent={Fade}
              PaperProps={{
                sx: {
                  borderRadius: 3,
                  boxShadow: '0 24px 48px rgba(0,0,0,0.2)'
                }
              }}
            >
              <DialogTitle sx={{ 
                borderBottom: '1px solid',
                borderColor: 'divider',
                pb: 2,
                background: 'linear-gradient(to right, #f8f9fa, #ffffff)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ColorLensIcon sx={{ color: '#667eea' }} />
                  <Typography variant="h6" fontWeight="600">
                    {editing ? 'Editar nota' : 'Nueva nota'}
                  </Typography>
                </Box>
              </DialogTitle>
              <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 3 }}>
                <TextField
                  autoFocus
                  label="Título"
                  fullWidth
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <TextField
                  label="Contenido"
                  fullWidth
                  multiline
                  rows={5}
                  value={form.content}
                  onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  placeholder="Escribe el contenido de tu nota..."
                />
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Color</InputLabel>
                    <Select 
                      value={form.color} 
                      label="Color" 
                      onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                      sx={{ borderRadius: 2 }}
                    >
                      {NOTE_COLORS.map(c => (
                        <MenuItem key={c.value} value={c.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ 
                              width: 20, 
                              height: 20, 
                              bgcolor: c.value, 
                              borderRadius: '6px',
                              border: '2px solid',
                              borderColor: c.value === '#ffffff' ? '#e0e0e0' : 'transparent',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }} />
                            {c.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Proyecto (opcional)</InputLabel>
                    <Select 
                      value={form.project_id} 
                      label="Proyecto (opcional)" 
                      onChange={e => setForm(p => ({ ...p, project_id: e.target.value }))}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="">
                        <em>Sin proyecto</em>
                      </MenuItem>
                      {projects.map(p => (
                        <MenuItem key={p.id} value={p.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FolderIcon sx={{ fontSize: 18, color: '#667eea' }} />
                            {p.name}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </DialogContent>
              <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button 
                  onClick={() => setDialog(false)}
                  sx={{ borderRadius: 2, px: 3 }}
                >
                  Cancelar
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleSave}
                  sx={{ 
                    borderRadius: 2,
                    px: 4,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4292 100%)',
                    }
                  }}
                >
                  {editing ? 'Actualizar' : 'Crear'}
                </Button>
              </DialogActions>
            </Dialog>

            {/* Dialog eliminar */}
            <Dialog 
              open={deleteDialog} 
              onClose={() => setDeleteDialog(false)} 
              maxWidth="xs" 
              fullWidth
              TransitionComponent={Fade}
              PaperProps={{
                sx: { borderRadius: 3 }
              }}
            >
              <DialogTitle sx={{ pb: 1 }}>Eliminar nota</DialogTitle>
              <DialogContent>
                <Typography>
                  ¿Seguro que quieres eliminar <strong>"{toDelete?.title}"</strong>? Esta acción no se puede deshacer.
                </Typography>
              </DialogContent>
              <DialogActions sx={{ p: 2.5 }}>
                <Button 
                  onClick={() => setDeleteDialog(false)}
                  sx={{ borderRadius: 2 }}
                >
                  Cancelar
                </Button>
                <Button 
                  variant="contained" 
                  color="error" 
                  onClick={handleDelete}
                  sx={{ borderRadius: 2, px: 3 }}
                >
                  Eliminar
                </Button>
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

            <Snackbar 
              open={snack.open} 
              autoHideDuration={3000} 
              onClose={() => setSnack(p => ({ ...p, open: false }))} 
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              TransitionComponent={Fade}
            >
              <Alert 
                severity={snack.sev} 
                variant="filled"
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
                }}
              >
                {snack.msg}
              </Alert>
            </Snackbar>
          </Box>
        </Paper>
      </Box>
    </Layout>
  );
}