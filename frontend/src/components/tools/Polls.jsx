// frontend/src/components/tools/Polls.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout';
import {
  Box, Typography, Button, Card, CardContent, CardActions, Chip,
  Grid, Tabs, Tab, IconButton, Tooltip, CircularProgress, Alert,
  Stack, Avatar, Paper, Divider, TextField, InputAdornment,
  FormControl, InputLabel, Select, MenuItem, Pagination,
} from '@mui/material';
import {
  Add as AddIcon, HowToVote as VoteIcon, BarChart as ChartIcon,
  Delete as DeleteIcon, Edit as EditIcon, Schedule as ScheduleIcon,
  Group as GroupIcon, Folder as ProjectIcon, Public as PublicIcon,
  Search as SearchIcon, Clear as ClearIcon,
  AccessTime as TimeIcon, EmojiEvents as WinnerIcon, Share as ShareIcon,
} from '@mui/icons-material';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const TYPE_LABELS  = { single: 'Opción única', multiple: 'Opción múltiple', text: 'Texto libre' };
const TYPE_COLORS  = { single: 'primary', multiple: 'secondary', text: 'success' };
const TYPE_ICONS   = { single: '🔘', multiple: '☑️', text: '✍️' };
const SHARE_ICONS  = { all: <PublicIcon fontSize="small" />, group: <GroupIcon fontSize="small" />, project: <ProjectIcon fontSize="small" /> };
const SHARE_LABELS = { all: 'Todos', group: 'Grupo', project: 'Proyecto' };

const isClosed = (poll) => !poll.is_active || (poll.deadline && new Date(poll.deadline) < new Date());

// ── Estadísticas rápidas ──────────────────────────────────────────────────────
const QuickStats = ({ polls }) => {
  const active     = polls.filter(p => !isClosed(p)).length;
  const totalVotes = polls.reduce((acc, p) => acc + (p.total_votes || 0), 0);
  const closingSoon = polls.filter(p => {
    if (!p.deadline || isClosed(p)) return false;
    return (new Date(p.deadline) - new Date()) / 864e5 <= 3;
  }).length;

  const stats = [
    { icon: <VoteIcon />,   value: active,      label: 'Encuestas activas', color: 'primary' },
    { icon: <ChartIcon />,  value: totalVotes,   label: 'Votos emitidos',    color: 'success' },
    { icon: <TimeIcon />,   value: closingSoon,  label: 'Cierran pronto',    color: 'warning' },
    { icon: <WinnerIcon />, value: polls.length, label: 'Total encuestas',   color: 'info'    },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 4 }}>
      {stats.map((s, i) => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <Paper elevation={0} sx={{ p: 2, bgcolor: `${s.color}.light`, color: `${s.color}.dark`, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: `${s.color}.main`, color: 'white', width: 48, height: 48 }}>{s.icon}</Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>{s.value}</Typography>
              <Typography variant="body2" fontWeight={500}>{s.label}</Typography>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

// ── Tarjeta de encuesta ───────────────────────────────────────────────────────
// ✅ FIX: sin CardActionArea — evita <button> dentro de <button>
const PollCard = ({ poll, user, onDelete, onView, onEdit }) => {
  const closed = isClosed(poll);

  return (
    <Card
      onClick={() => onView(poll.id)}
      sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        cursor: 'pointer', borderRadius: 3,
        transition: 'all 0.2s',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: 6 },
        border: poll.user_has_voted ? '2px solid' : '1px solid',
        borderColor: poll.user_has_voted ? 'success.main' : 'divider',
      }}
    >
      <CardContent sx={{ flex: 1, p: 2.5 }}>
        <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
          <Chip size="small" label={`${TYPE_ICONS[poll.type]} ${TYPE_LABELS[poll.type]}`} color={TYPE_COLORS[poll.type]} variant="outlined" />
          <Chip size="small" icon={SHARE_ICONS[poll.shared_with_type]} label={SHARE_LABELS[poll.shared_with_type]} variant="outlined" />
          {poll.user_has_voted && <Chip size="small" label="✓ Votado" color="success" />}
          {closed && <Chip size="small" label="Cerrada" />}
        </Stack>

        <Typography variant="h6" fontSize={16} fontWeight={700} mb={1} noWrap>
          {poll.title}
        </Typography>
        {poll.description && (
          <Typography variant="body2" color="text.secondary" mb={2}
            sx={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {poll.description}
          </Typography>
        )}

        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <VoteIcon fontSize="small" color="action" />
            <Typography variant="body2">{poll.total_votes || 0} votos</Typography>
          </Box>
          {poll.poll_options?.length > 0 && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <ChartIcon fontSize="small" color="action" />
              <Typography variant="body2">{poll.poll_options.length} opciones</Typography>
            </Box>
          )}
        </Box>

        {poll.deadline && (
          <Box display="flex" alignItems="center" gap={0.5}
            sx={{ p: 1, bgcolor: closed ? 'error.50' : 'warning.50', borderRadius: 1 }}>
            <ScheduleIcon fontSize="small" sx={{ color: closed ? 'error.main' : 'warning.main' }} />
            <Typography variant="caption" sx={{ color: closed ? 'error.main' : 'warning.main' }}>
              {closed ? 'Expiró: ' : 'Cierra: '}{new Date(poll.deadline).toLocaleDateString('es-ES')}
            </Typography>
          </Box>
        )}
      </CardContent>

      <Divider />

      {/* ✅ CardActions con e.stopPropagation() en cada botón — sin CardActionArea */}
      <CardActions sx={{ px: 2, py: 1, justifyContent: 'space-between' }}>
        <Button
          size="small"
          variant={poll.user_has_voted || closed ? 'outlined' : 'contained'}
          startIcon={poll.user_has_voted || closed ? <ChartIcon /> : <VoteIcon />}
          color={poll.user_has_voted ? 'success' : 'primary'}
          onClick={(e) => { e.stopPropagation(); onView(poll.id); }}
        >
          {poll.user_has_voted || closed ? 'Ver resultados' : 'Votar'}
        </Button>

        <Box onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Compartir">
            <IconButton size="small" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/tools/polls/${poll.id}`)}>
              <ShareIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {['admin', 'manager'].includes(user?.role) && poll.created_by === user?.id && (
            <>
              <Tooltip title="Editar">
                <IconButton size="small" onClick={() => onEdit(poll.id)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Eliminar">
                <IconButton size="small" color="error" onClick={() => onDelete(poll.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </CardActions>
    </Card>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────
export default function Polls() {
  const navigate = useNavigate();
  const [polls, setPolls]       = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [tab, setTab]           = useState(0);
  const [search, setSearch]     = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy]     = useState('newest');
  const [page, setPage]         = useState(1);
  const itemsPerPage = 9;

const user = JSON.parse(localStorage.getItem('usuario') || '{}');

  const fetchPolls = useCallback(async () => {
    try {
      setLoading(true);
      const token  = localStorage.getItem('token');
      const status = tab === 0 ? 'active' : 'closed';

      const res = await fetch(`${API}/api/polls?status=${status}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (res.status === 401) { setError('Sesión expirada. Inicia sesión de nuevo.'); return; }
      if (!res.ok) throw new Error('Error al cargar');

      const data = await res.json();
      setPolls(data.data || []);
      setError('');
    } catch {
      setError('Error al cargar las encuestas');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchPolls(); }, [fetchPolls]);

  // Filtrado y ordenación
  useEffect(() => {
    let result = [...polls];

    if (search)
      result = result.filter(p =>
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
      );

    if (filterType !== 'all')
      result = result.filter(p => p.type === filterType);

    const sorters = {
      newest:     (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
      oldest:     (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0),
      mostVoted:  (a, b) => (b.total_votes || 0) - (a.total_votes || 0),
      endingSoon: (a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      },
    };
    result.sort(sorters[sortBy] || sorters.newest);

    setFiltered(result);
    setPage(1);
  }, [polls, search, filterType, sortBy]);

  const handleDelete = async (pollId) => {
    if (!window.confirm('¿Eliminar esta encuesta y todos sus votos?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/polls/${pollId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) fetchPolls();
      else setError('Error al eliminar la encuesta');
    } catch {
      setError('Error al eliminar la encuesta');
    }
  };

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const displayed  = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const activeCount = polls.filter(p => !isClosed(p)).length;
  const closedCount = polls.filter(p =>  isClosed(p)).length;

  return (
    <Layout>
      <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>

        {/* Cabecera */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight={800} color="primary">📊 Encuestas y Votaciones</Typography>
            <Typography variant="body1" color="text.secondary">Crea encuestas para tu equipo y obtén resultados en tiempo real</Typography>
          </Box>
          <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={() => navigate('/tools/polls/new')}>
            Nueva encuesta
          </Button>
        </Box>

        {polls.length > 0 && <QuickStats polls={polls} />}

        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField fullWidth size="small" placeholder="Buscar encuestas..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                  endAdornment: search && <IconButton size="small" onClick={() => setSearch('')}><ClearIcon /></IconButton>,
                }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select value={filterType} onChange={(e) => setFilterType(e.target.value)} label="Tipo">
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="single">Opción única</MenuItem>
                  <MenuItem value="multiple">Opción múltiple</MenuItem>
                  <MenuItem value="text">Texto libre</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Ordenar</InputLabel>
                <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} label="Ordenar">
                  <MenuItem value="newest">Más recientes</MenuItem>
                  <MenuItem value="mostVoted">Más votadas</MenuItem>
                  <MenuItem value="endingSoon">Próximas a cerrar</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button fullWidth variant="outlined"
                onClick={() => { setSearch(''); setFilterType('all'); setSortBy('newest'); }}>
                Limpiar
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab label={`Activas (${activeCount})`} />
          <Tab label={`Cerradas (${closedCount})`} />
        </Tabs>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {loading ? (
          <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
        ) : filtered.length === 0 ? (
          <Paper sx={{ textAlign: 'center', py: 8, px: 4 }}>
            <VoteIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              {tab === 0 ? 'No hay encuestas activas' : 'No hay encuestas cerradas'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {tab === 0 ? 'Comienza creando tu primera encuesta' : 'Las encuestas cerradas aparecerán aquí'}
            </Typography>
            {tab === 0 && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/tools/polls/new')}>
                Crear primera encuesta
              </Button>
            )}
          </Paper>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Mostrando {displayed.length} de {filtered.length} encuestas
            </Typography>
            <Grid container spacing={3}>
              {displayed.map((poll) => (
                <Grid item xs={12} sm={6} lg={4} key={poll.id}>
                  <PollCard
                    poll={poll}
                    user={user}
                    onDelete={handleDelete}
                    onView={(id) => navigate(`/tools/polls/${id}`)}
                    onEdit={(id)  => navigate(`/tools/polls/${id}/edit`)}
                  />
                </Grid>
              ))}
            </Grid>
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={4}>
                <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
              </Box>
            )}
          </>
        )}

      </Box>
    </Layout>
  );
}