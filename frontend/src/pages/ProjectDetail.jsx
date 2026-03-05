import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Avatar, Chip, Button, Divider,
  TextField, IconButton, List, ListItem, ListItemAvatar,
  ListItemText, CircularProgress, Tooltip, Checkbox,
  LinearProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, MenuItem, Select, FormControl, InputLabel,
  OutlinedInput
} from '@mui/material';
import {
  ArrowBack, Add, Delete, Send, FolderOpen,
  CheckCircle, RadioButtonUnchecked, Person, Edit
} from '@mui/icons-material';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import CalculateIcon from '@mui/icons-material/Calculate';
import TableChartIcon from '@mui/icons-material/TableChart';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import axios from 'axios';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const COLORS = ['#1976d2','#388e3c','#f57c00','#7b1fa2','#c62828','#00796b'];
const getColor = (name) => COLORS[name?.charCodeAt(0) % COLORS.length];

const STATUS_CONFIG = {
  pendiente:   { label: '⏳ Pendiente',   color: 'warning' },
  en_progreso: { label: '🔄 En progreso', color: 'info'    },
  completado:  { label: '✅ Completado',  color: 'success' },
  cancelado:   { label: '❌ Cancelado',   color: 'error'   },
};

const ITEM_ICONS = {
  note:        <NoteAltIcon fontSize="small" sx={{ color: '#1976d2' }} />,
  calculator:  <CalculateIcon fontSize="small" sx={{ color: '#ed6c02' }} />,
  spreadsheet: <TableChartIcon fontSize="small" sx={{ color: '#2e7d32' }} />,
};
const ITEM_LABELS = { note: 'Nota', calculator: 'Cálculo', spreadsheet: 'Hoja de cálculo' };

// ── Componente archivos compartidos ──────────────────────────────────────────
function SharedFiles({ projectId }) {
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/shared-items/project/${projectId}`, { headers })
      .then(r => setItems(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleUnshare = async (shareId) => {
    try {
      await axios.delete(`${API}/shared-items/${shareId}`, { headers });
      setItems(prev => prev.filter(i => i.id !== shareId));
    } catch {}
  };

  const getItemTitle = (item) => {
    if (!item.item_data) return `${ITEM_LABELS[item.item_type]} eliminado`;
    if (item.item_type === 'calculator') return `${item.item_data.expression} = ${item.item_data.result}`;
    return item.item_data.name || item.item_data.title || 'Sin título';
  };

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <FolderSharedIcon color="warning" />
        <Typography variant="h6" fontWeight={600}>Archivos compartidos ({items.length})</Typography>
      </Box>

      {loading && <Box display="flex" justifyContent="center" py={2}><CircularProgress size={24} /></Box>}

      {!loading && items.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No hay archivos compartidos con este proyecto todavía.
        </Typography>
      )}

      {!loading && items.length > 0 && (
        <List disablePadding>
          {items.map(item => (
            <ListItem
              key={item.id}
              disablePadding
              sx={{
                mb: 1, px: 1.5, py: 1,
                bgcolor: 'grey.50', borderRadius: 2,
                border: '1px solid', borderColor: 'grey.200'
              }}
              secondaryAction={
                <Tooltip title="Dejar de compartir">
                  <IconButton size="small" color="error" onClick={() => handleUnshare(item.id)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              }
            >
              <ListItemAvatar sx={{ minWidth: 36 }}>
                {ITEM_ICONS[item.item_type]}
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="body2" fontWeight={500} noWrap>
                    {getItemTitle(item)}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {ITEM_LABELS[item.item_type]} · Compartido por {item.users?.name || 'alguien'} · {new Date(item.created_at).toLocaleDateString('es-ES')}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newTask, setNewTask] = useState('');
  const [newComment, setNewComment] = useState('');
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [savingMembers, setSavingMembers] = useState(false);

  const commentEndRef = useRef(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = async () => {
    try {
      const [projRes, membersRes, tasksRes, commentsRes, usersRes] = await Promise.all([
        axios.get(`${API}/projects/${id}`, { headers }),
        axios.get(`${API}/projects/${id}/members`, { headers }),
        axios.get(`${API}/projects/${id}/tasks`, { headers }),
        axios.get(`${API}/projects/${id}/comments`, { headers }),
        axios.get(`${API}/users`, { headers }),
      ]);
      setProject(projRes.data);
      setMembers(membersRes.data);
      setTasks(tasksRes.data);
      setComments(commentsRes.data);
      setAllUsers(usersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);
  useEffect(() => { commentEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [comments]);

  const openMembersDialog = () => {
    setSelectedMemberIds(members.map(m => m.id));
    setMembersDialogOpen(true);
  };

  const handleSaveMembers = async () => {
    setSavingMembers(true);
    try {
      await axios.post(`${API}/projects/${id}/members`, { memberIds: selectedMemberIds }, { headers });
      const res = await axios.get(`${API}/projects/${id}/members`, { headers });
      setMembers(res.data);
      setMembersDialogOpen(false);
    } catch (err) { console.error(err); }
    finally { setSavingMembers(false); }
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    try {
      const res = await axios.post(`${API}/projects/${id}/tasks`, { title: newTask, status: 'pendiente' }, { headers });
      setTasks(prev => [...prev, res.data]);
      setNewTask('');
    } catch (err) { console.error(err); }
  };

  const handleToggleTask = async (task) => {
    const newStatus = task.status === 'completado' ? 'pendiente' : 'completado';
    try {
      const res = await axios.put(`${API}/projects/${id}/tasks/${task.id}`, { ...task, status: newStatus }, { headers });
      setTasks(prev => prev.map(t => t.id === task.id ? res.data : t));
    } catch (err) { console.error(err); }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`${API}/projects/${id}/tasks/${taskId}`, { headers });
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) { console.error(err); }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await axios.post(`${API}/projects/${id}/comments`, { content: newComment, user_id: usuario.id }, { headers });
      setComments(prev => [...prev, res.data]);
      setNewComment('');
    } catch (err) { console.error(err); }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`${API}/projects/${id}/comments/${commentId}`, { headers });
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) { console.error(err); }
  };

  const completedTasks = tasks.filter(t => t.status === 'completado').length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  if (loading) return (
    <Layout>
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    </Layout>
  );

  if (!project) return (
    <Layout><Typography>Proyecto no encontrado</Typography></Layout>
  );

  const config = STATUS_CONFIG[project.status] || STATUS_CONFIG.pendiente;

  return (
    <Layout>
      <Box sx={{ display: 'flex', gap: 3, height: 'calc(100vh - 48px)' }}>

        {/* ── COLUMNA IZQUIERDA ── */}
        <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* Cabecera */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <IconButton size="small" onClick={() => navigate('/projects')}><ArrowBack /></IconButton>
              <Typography variant="caption" color="text.secondary">Volver a proyectos</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'warning.main', width: 52, height: 52 }}><FolderOpen /></Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={700}>{project.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{project.description || 'Sin descripción'}</Typography>
                  {project.groups && <Typography variant="caption" color="text.secondary">Grupo: {project.groups.name}</Typography>}
                </Box>
              </Box>
              <Chip label={config.label} color={config.color} />
            </Box>
            {tasks.length > 0 && (
              <Box mt={2}>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="caption" color="text.secondary">Progreso de tareas</Typography>
                  <Typography variant="caption" fontWeight={600}>{progress}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 1, height: 8 }} color={progress === 100 ? 'success' : 'primary'} />
              </Box>
            )}
          </Paper>

          {/* Miembros */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <Person color="primary" />
                <Typography variant="h6" fontWeight={600}>Miembros ({members.length})</Typography>
              </Box>
              <Button size="small" variant="outlined" startIcon={<Edit />} onClick={openMembersDialog}>Gestionar</Button>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {members.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Sin miembros asignados. Pulsa "Gestionar" para añadir.</Typography>
              ) : members.map(m => (
                <Tooltip key={m.id} title={m.email}>
                  <Chip avatar={<Avatar sx={{ bgcolor: getColor(m.name) }}>{m.name?.[0]?.toUpperCase()}</Avatar>} label={m.name} variant="outlined" />
                </Tooltip>
              ))}
            </Box>
          </Paper>

          {/* Tareas */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>✅ Tareas ({completedTasks}/{tasks.length})</Typography>
            <Box display="flex" gap={1} mb={2}>
              <TextField size="small" fullWidth placeholder="Nueva tarea..." value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTask()} />
              <Button variant="contained" startIcon={<Add />} onClick={handleAddTask} disabled={!newTask.trim()}>Añadir</Button>
            </Box>
            {tasks.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No hay tareas. ¡Añade la primera!</Typography>
            ) : (
              <List disablePadding>
                {tasks.map(task => (
                  <ListItem
                    key={task.id}
                    disablePadding
                    sx={{ mb: 0.5, px: 1, py: 0.5, bgcolor: task.status === 'completado' ? 'success.50' : 'grey.50', borderRadius: 2, border: '1px solid', borderColor: task.status === 'completado' ? 'success.200' : 'grey.200' }}
                    secondaryAction={
                      <IconButton size="small" color="error" onClick={() => handleDeleteTask(task.id)}><Delete fontSize="small" /></IconButton>
                    }
                  >
                    <Checkbox icon={<RadioButtonUnchecked />} checkedIcon={<CheckCircle color="success" />} checked={task.status === 'completado'} onChange={() => handleToggleTask(task)} size="small" />
                    <ListItemText
                      primary={task.title}
                      primaryTypographyProps={{ fontSize: 14, sx: { textDecoration: task.status === 'completado' ? 'line-through' : 'none', color: task.status === 'completado' ? 'text.secondary' : 'text.primary' } }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>

          {/* ── ARCHIVOS COMPARTIDOS ── */}
          <SharedFiles projectId={id} />

        </Box>

        {/* ── COLUMNA DERECHA — COMENTARIOS ── */}
        <Paper elevation={2} sx={{ width: 340, borderRadius: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
          <Box sx={{ px: 2, py: 1.5, bgcolor: 'warning.main' }}>
            <Typography variant="subtitle1" fontWeight={600} color="white">💬 Comentarios</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>{comments.length} comentario{comments.length !== 1 ? 's' : ''}</Typography>
          </Box>
          <Divider />
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {comments.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" mt={4}>Sin comentarios aún</Typography>
            ) : comments.map(comment => (
              <Box key={comment.id} sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 1.5, border: '1px solid', borderColor: 'grey.200' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Avatar sx={{ width: 22, height: 22, fontSize: 11, bgcolor: getColor(comment.users?.name) }}>{comment.users?.name?.[0]?.toUpperCase()}</Avatar>
                    <Typography variant="caption" fontWeight={600}>{comment.users?.name}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Typography variant="caption" color="text.secondary">{new Date(comment.created_at).toLocaleDateString('es-ES')}</Typography>
                    {comment.user_id === usuario?.id && (
                      <IconButton size="small" onClick={() => handleDeleteComment(comment.id)}>
                        <Delete sx={{ fontSize: 14, color: 'error.main' }} />
                      </IconButton>
                    )}
                  </Box>
                </Box>
                <Typography variant="body2">{comment.content}</Typography>
              </Box>
            ))}
            <div ref={commentEndRef} />
          </Box>
          <Divider />
          <Box sx={{ p: 1.5, display: 'flex', gap: 1 }}>
            <TextField size="small" fullWidth placeholder="Escribe un comentario..." value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddComment()} multiline maxRows={3} />
            <IconButton color="warning" onClick={handleAddComment} disabled={!newComment.trim()}><Send /></IconButton>
          </Box>
        </Paper>
      </Box>

      {/* Dialog miembros */}
      <Dialog open={membersDialogOpen} onClose={() => setMembersDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Gestionar miembros del proyecto</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Miembros</InputLabel>
            <Select
              multiple
              value={selectedMemberIds}
              onChange={e => setSelectedMemberIds(e.target.value)}
              input={<OutlinedInput label="Miembros" />}
              renderValue={(selected) => (
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {selected.map(uid => {
                    const u = allUsers.find(u => u.id === uid);
                    return <Chip key={uid} label={u?.name || uid} size="small" />;
                  })}
                </Box>
              )}
            >
              {allUsers.map(user => (
                <MenuItem key={user.id} value={user.id}>{user.name} — {user.email}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMembersDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveMembers} variant="contained" disabled={savingMembers}>
            {savingMembers ? <CircularProgress size={20} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}