import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Avatar, Chip, Button, Divider,
  TextField, IconButton, List, ListItem, ListItemAvatar,
  ListItemText, CircularProgress, Tooltip, Link
} from '@mui/material';
import {
  ExitToApp, Add, Delete, Send, Link as LinkIcon,
  GitHub, Language, OpenInNew, Group as GroupIcon
} from '@mui/icons-material';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import CalculateIcon from '@mui/icons-material/Calculate';
import TableChartIcon from '@mui/icons-material/TableChart';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import axios from 'axios';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const COLORS = ['#1976d2','#388e3c','#f57c00','#7b1fa2','#c62828','#00796b'];
const getColor = (name) => COLORS[name?.charCodeAt(0) % COLORS.length];

const ITEM_ICONS = {
  note:        <NoteAltIcon fontSize="small" sx={{ color: '#1976d2' }} />,
  calculator:  <CalculateIcon fontSize="small" sx={{ color: '#ed6c02' }} />,
  spreadsheet: <TableChartIcon fontSize="small" sx={{ color: '#2e7d32' }} />,
};
const ITEM_LABELS = { note: 'Nota', calculator: 'Cálculo', spreadsheet: 'Hoja de cálculo' };

// ── Encuestas del grupo ───────────────────────────────────────────────────────
function PollsSection({ groupId }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/polls`, { headers })
      .then(r => {
        const all = r.data?.data || [];
        setPolls(all.filter(p => p.shared_with_type === 'group' && p.shared_with_id === groupId));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [groupId]);

  const isClosed = (p) => !p.is_active || (p.deadline && new Date(p.deadline) < new Date());

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <HowToVoteIcon color="secondary" />
        <Typography variant="h6" fontWeight={600}>Encuestas ({polls.length})</Typography>
      </Box>

      {loading && <Box display="flex" justifyContent="center" py={2}><CircularProgress size={24} /></Box>}

      {!loading && polls.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No hay encuestas asociadas a este grupo.
        </Typography>
      )}

      {!loading && polls.length > 0 && (
        <List disablePadding>
          {polls.map(poll => (
            <ListItem
              key={poll.id}
              disablePadding
              onClick={() => navigate(`/tools/polls/${poll.id}`)}
              sx={{
                mb: 1, px: 1.5, py: 1, cursor: 'pointer',
                bgcolor: 'grey.50', borderRadius: 2,
                border: '1px solid', borderColor: 'grey.200',
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              <ListItemAvatar sx={{ minWidth: 36 }}>
                <HowToVoteIcon fontSize="small" sx={{ color: '#9c27b0' }} />
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" fontWeight={500} noWrap>{poll.title}</Typography>
                    <Chip
                      size="small"
                      label={isClosed(poll) ? 'Cerrada' : 'Activa'}
                      color={isClosed(poll) ? 'default' : 'success'}
                      sx={{ height: 18, fontSize: '0.65rem' }}
                    />
                    {poll.user_has_voted && (
                      <Chip size="small" label="✓ Votado" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
                    )}
                  </Box>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {poll.total_votes || 0} votos · {poll.poll_options?.length || 0} opciones
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

// ── Archivos compartidos ──────────────────────────────────────────────────────
function SharedFiles({ groupId }) {
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/shared-items/group/${groupId}`, { headers })
      .then(r => setItems(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [groupId]);

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
        <FolderSharedIcon color="primary" />
        <Typography variant="h6" fontWeight={600}>Archivos compartidos ({items.length})</Typography>
      </Box>

      {loading && <Box display="flex" justifyContent="center" py={2}><CircularProgress size={24} /></Box>}

      {!loading && items.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No hay archivos compartidos con este grupo todavía.
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
export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [group, setGroup] = useState(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, author: 'Sistema', text: 'Bienvenido al chat del grupo 👋', time: '09:00', isSystem: true }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchGroup = async () => {
    try {
      const [groupRes, linksRes] = await Promise.all([
        axios.get(`${API}/groups/${id}`, { headers }),
        axios.get(`${API}/groups/${id}/links`, { headers })
      ]);
      setGroup(groupRes.data);
      setLinks(linksRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGroup(); }, [id]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const handleLeave = async () => {
    if (!window.confirm('¿Salir del grupo? Podrás ser añadido de nuevo más tarde.')) return;
    try {
      await axios.post(`${API}/groups/${id}/leave`, { userId: usuario.id }, { headers });
      navigate('/groups');
    } catch (err) { console.error(err); }
  };

  const handleAddLink = async () => {
    if (!linkName.trim() || !linkUrl.trim()) return;
    try {
      const res = await axios.post(`${API}/groups/${id}/links`, { name: linkName, url: linkUrl }, { headers });
      setLinks(prev => [...prev, res.data]);
      setLinkName('');
      setLinkUrl('');
    } catch (err) { console.error(err); }
  };

  const handleRemoveLink = async (linkId) => {
    try {
      await axios.delete(`${API}/groups/${id}/links/${linkId}`, { headers });
      setLinks(prev => prev.filter(l => l.id !== linkId));
    } catch (err) { console.error(err); }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const newMsg = {
      id: Date.now(),
      author: usuario?.name || 'Tú',
      text: chatInput,
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      isOwn: true
    };
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');
  };

  const getLinkIcon = (url) => {
    if (url.includes('github')) return <GitHub fontSize="small" />;
    return <Language fontSize="small" />;
  };

  if (loading) return (
    <Layout>
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    </Layout>
  );

  if (!group) return (
    <Layout><Typography>Grupo no encontrado</Typography></Layout>
  );

  return (
    <Layout>
      <Box sx={{ display: 'flex', gap: 3, height: 'calc(100vh - 48px)' }}>

        {/* ── COLUMNA IZQUIERDA ── */}
        <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* Cabecera */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 52, height: 52 }}><GroupIcon /></Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={700}>{group.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{group.description || 'Sin descripción'}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Creado el {new Date(group.created_at).toLocaleDateString('es-ES')}
                  </Typography>
                </Box>
              </Box>
              <Button variant="outlined" color="error" startIcon={<ExitToApp />} onClick={handleLeave} size="small">
                Salir del grupo
              </Button>
            </Box>
          </Paper>

          {/* Miembros */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Miembros ({group.members?.length || 0})</Typography>
            <Box display="flex" flexWrap="wrap" gap={1.5}>
              {group.members?.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Sin miembros</Typography>
              ) : group.members.map(m => (
                <Tooltip key={m.id} title={m.email}>
                  <Chip avatar={<Avatar sx={{ bgcolor: getColor(m.name) }}>{m.name?.[0]?.toUpperCase()}</Avatar>} label={m.name} variant="outlined" />
                </Tooltip>
              ))}
            </Box>
          </Paper>

          {/* Links */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              <LinkIcon sx={{ verticalAlign: 'middle', mr: 1 }} />Links del grupo
            </Typography>
            <Box display="flex" gap={1} mb={2} flexWrap="wrap">
              <TextField size="small" placeholder="Nombre" value={linkName} onChange={e => setLinkName(e.target.value)} sx={{ flex: 1, minWidth: 140 }} />
              <TextField size="small" placeholder="URL" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} sx={{ flex: 2, minWidth: 200 }} />
              <Button variant="contained" startIcon={<Add />} onClick={handleAddLink} disabled={!linkName.trim() || !linkUrl.trim()}>Añadir</Button>
            </Box>
            {links.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No hay links añadidos</Typography>
            ) : (
              <List dense disablePadding>
                {links.map(link => (
                  <ListItem key={link.id} disablePadding
                    sx={{ mb: 1, px: 1.5, py: 1, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}
                    secondaryAction={
                      <IconButton size="small" color="error" onClick={() => handleRemoveLink(link.id)}><Delete fontSize="small" /></IconButton>
                    }
                  >
                    <ListItemAvatar sx={{ minWidth: 36 }}>{getLinkIcon(link.url)}</ListItemAvatar>
                    <ListItemText
                      primary={
                        <Link href={link.url} target="_blank" rel="noopener" underline="hover" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {link.name}<OpenInNew sx={{ fontSize: 12 }} />
                        </Link>
                      }
                      secondary={link.url}
                      secondaryTypographyProps={{ noWrap: true, fontSize: 11 }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>

          {/* ── ENCUESTAS ── */}
          <PollsSection groupId={id} />

          {/* ── ARCHIVOS COMPARTIDOS ── */}
          <SharedFiles groupId={id} />

        </Box>

        {/* ── COLUMNA DERECHA — CHAT ── */}
        <Paper elevation={2} sx={{ width: 340, borderRadius: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
          <Box sx={{ px: 2, py: 1.5, bgcolor: 'primary.main' }}>
            <Typography variant="subtitle1" fontWeight={600} color="white">💬 Chat del grupo</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>{group.members?.length || 0} miembros</Typography>
          </Box>
          <Divider />
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {chatMessages.map(msg => (
              <Box key={msg.id} sx={{ alignSelf: msg.isSystem ? 'center' : msg.isOwn ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                {msg.isSystem ? (
                  <Typography variant="caption" color="text.secondary" sx={{ bgcolor: 'grey.100', px: 1.5, py: 0.5, borderRadius: 2, display: 'block' }}>
                    {msg.text}
                  </Typography>
                ) : (
                  <Box>
                    {!msg.isOwn && <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>{msg.author}</Typography>}
                    <Box sx={{ bgcolor: msg.isOwn ? 'primary.main' : 'grey.100', color: msg.isOwn ? 'white' : 'text.primary', px: 1.5, py: 1, borderRadius: 2, borderBottomRightRadius: msg.isOwn ? 0 : 2, borderBottomLeftRadius: msg.isOwn ? 2 : 0 }}>
                      <Typography variant="body2">{msg.text}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7, fontSize: 10 }}>{msg.time}</Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            ))}
            <div ref={chatEndRef} />
          </Box>
          <Divider />
          <Box sx={{ p: 1.5, display: 'flex', gap: 1 }}>
            <TextField size="small" fullWidth placeholder="Escribe un mensaje..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} />
            <IconButton color="primary" onClick={handleSendMessage} disabled={!chatInput.trim()}><Send /></IconButton>
          </Box>
        </Paper>

      </Box>
    </Layout>
  );
}