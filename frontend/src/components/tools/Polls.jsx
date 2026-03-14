// frontend/src/components/tools/Polls.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout';
import {
  Box, Typography, Button, Card, CardContent, CardActions, Chip,
  Grid, Tabs, Tab, IconButton, Tooltip, CircularProgress, Alert,
  Stack, Avatar, Paper, Divider, TextField, InputAdornment,
  FormControl, InputLabel, Select, MenuItem, Pagination,
  alpha, Fade, Zoom
} from '@mui/material';
import {
  Add as AddIcon, HowToVote as VoteIcon, BarChart as ChartIcon,
  Delete as DeleteIcon, Edit as EditIcon, Schedule as ScheduleIcon,
  Group as GroupIcon, Folder as ProjectIcon, Public as PublicIcon,
  Search as SearchIcon, Clear as ClearIcon,
  AccessTime as TimeIcon, EmojiEvents as WinnerIcon, Share as ShareIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const TYPE_LABELS  = { single: 'Opción única', multiple: 'Opción múltiple', text: 'Texto libre' };
const TYPE_COLORS  = { single: 'primary', multiple: 'secondary', text: 'success' };
const TYPE_ICONS   = { single: '🔘', multiple: '☑️', text: '✍️' };
const SHARE_ICONS  = { 
  all: <PublicIcon fontSize="small" />, 
  group: <GroupIcon fontSize="small" />, 
  project: <ProjectIcon fontSize="small" /> 
};
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
    { icon: <VoteIcon />,   value: active,      label: 'Encuestas activas', color: '#667eea' },
    { icon: <ChartIcon />,  value: totalVotes,  label: 'Votos emitidos',    color: '#48bb78' },
    { icon: <TimeIcon />,   value: closingSoon, label: 'Cierran pronto',    color: '#ed8936' },
    { icon: <WinnerIcon />, value: polls.length,label: 'Total encuestas',   color: '#9f7aea' },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 4 }}>
      {stats.map((s, i) => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <Zoom in={true} style={{ transitionDelay: `${i * 100}ms` }}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2.5, 
                background: `linear-gradient(135deg, ${alpha(s.color, 0.1)} 0%, ${alpha(s.color, 0.05)} 100%)`,
                borderRadius: 3, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                border: '1px solid',
                borderColor: alpha(s.color, 0.2),
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 24px ${alpha(s.color, 0.2)}`
                }
              }}
            >
              <Avatar sx={{ 
                bgcolor: s.color, 
                color: 'white', 
                width: 52, 
                height: 52,
                boxShadow: `0 8px 16px ${alpha(s.color, 0.3)}`
              }}>
                {s.icon}
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight={700} sx={{ color: s.color, lineHeight: 1.2 }}>
                  {s.value}
                </Typography>
                <Typography variant="body2" fontWeight={500} color="text.secondary">
                  {s.label}
                </Typography>
              </Box>
            </Paper>
          </Zoom>
        </Grid>
      ))}
    </Grid>
  );
};

// ── Tarjeta de encuesta ───────────────────────────────────────────────────────
const PollCard = ({ poll, user, onDelete, onView, onEdit }) => {
  const closed = isClosed(poll);

  return (
    <Zoom in={true} style={{ transitionDelay: `${Math.random() * 100}ms` }}>
      <Card
        onClick={() => onView(poll.id)}
        sx={{
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          cursor: 'pointer', 
          borderRadius: 3,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': { 
            transform: 'translateY(-6px)', 
            boxShadow: '0 20px 30px rgba(102, 126, 234, 0.2)',
            borderColor: '#667eea'
          },
          border: poll.user_has_voted ? '2px solid' : '1px solid',
          borderColor: poll.user_has_voted ? '#48bb78' : alpha('#000', 0.08),
          position: 'relative',
          overflow: 'visible'
        }}
      >
        {poll.user_has_voted && (
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              bgcolor: '#48bb78',
              color: 'white',
              borderRadius: '20px',
              px: 1,
              py: 0.5,
              fontSize: '0.7rem',
              fontWeight: 600,
              boxShadow: '0 4px 8px rgba(72, 187, 120, 0.3)',
              zIndex: 1
            }}
          >
            ✓ Votado
          </Box>
        )}

        <CardContent sx={{ flex: 1, p: 2.5 }}>
          <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
            <Chip 
              size="small" 
              label={`${TYPE_ICONS[poll.type]} ${TYPE_LABELS[poll.type]}`} 
              sx={{ 
                bgcolor: alpha('#667eea', 0.1), 
                color: '#667eea',
                fontWeight: 500,
                border: 'none'
              }}
              variant="outlined"
            />
            <Chip 
              size="small" 
              icon={SHARE_ICONS[poll.shared_with_type]} 
              label={SHARE_LABELS[poll.shared_with_type]} 
              sx={{ 
                bgcolor: alpha('#9f7aea', 0.1), 
                color: '#9f7aea',
                border: 'none',
                '& .MuiChip-icon': { color: '#9f7aea' }
              }}
              variant="outlined"
            />
            {closed && (
              <Chip 
                size="small" 
                label="Cerrada" 
                sx={{ 
                  bgcolor: alpha('#f56565', 0.1), 
                  color: '#f56565',
                  border: 'none'
                }}
              />
            )}
          </Stack>

          <Typography variant="h6" fontSize={18} fontWeight={700} mb={1} sx={{ color: '#2d3748' }}>
            {poll.title}
          </Typography>
          
          {poll.description && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              mb={2}
              sx={{ 
                overflow: 'hidden', 
                display: '-webkit-box', 
                WebkitLineClamp: 2, 
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.6
              }}
            >
              {poll.description}
            </Typography>
          )}

          <Box display="flex" alignItems="center" gap={2} mb={1.5}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <VoteIcon fontSize="small" sx={{ color: alpha('#667eea', 0.6) }} />
              <Typography variant="body2" fontWeight={500}>
                {poll.total_votes || 0} votos
              </Typography>
            </Box>
            {poll.poll_options?.length > 0 && (
              <Box display="flex" alignItems="center" gap={0.5}>
                <ChartIcon fontSize="small" sx={{ color: alpha('#9f7aea', 0.6) }} />
                <Typography variant="body2" fontWeight={500}>
                  {poll.poll_options.length} opciones
                </Typography>
              </Box>
            )}
          </Box>

          {poll.deadline && (
            <Box 
              display="flex" 
              alignItems="center" 
              gap={0.5}
              sx={{ 
                p: 1, 
                bgcolor: closed ? alpha('#f56565', 0.1) : alpha('#ed8936', 0.1), 
                borderRadius: 2,
                border: '1px solid',
                borderColor: closed ? alpha('#f56565', 0.2) : alpha('#ed8936', 0.2)
              }}
            >
              <ScheduleIcon fontSize="small" sx={{ color: closed ? '#f56565' : '#ed8936' }} />
              <Typography variant="caption" sx={{ color: closed ? '#f56565' : '#ed8936', fontWeight: 500 }}>
                {closed ? 'Expiró: ' : 'Cierra: '}{new Date(poll.deadline).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </Typography>
            </Box>
          )}
        </CardContent>

        <Divider sx={{ borderColor: alpha('#000', 0.06) }} />

        <CardActions sx={{ px: 2, py: 1.5, justifyContent: 'space-between' }}>
          <Button
            size="small"
            variant={poll.user_has_voted || closed ? 'outlined' : 'contained'}
            startIcon={poll.user_has_voted || closed ? <ChartIcon /> : <VoteIcon />}
            onClick={(e) => { e.stopPropagation(); onView(poll.id); }}
            sx={{ 
              borderRadius: 2,
              ...(poll.user_has_voted || closed ? {
                borderColor: '#667eea',
                color: '#667eea',
                '&:hover': { borderColor: '#5a6fd6', bgcolor: alpha('#667eea', 0.04) }
              } : {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4292 100%)' }
              })
            }}
          >
            {poll.user_has_voted || closed ? 'Ver resultados' : 'Votar'}
          </Button>

          <Box onClick={(e) => e.stopPropagation()}>
            <Tooltip title="Compartir" arrow placement="top">
              <IconButton 
                size="small" 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/tools/polls/${poll.id}`);
                }}
                sx={{ color: '#667eea', '&:hover': { bgcolor: alpha('#667eea', 0.1) } }}
              >
                <ShareIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {['admin', 'manager'].includes(user?.role) && poll.created_by === user?.id && (
              <>
                <Tooltip title="Editar" arrow placement="top">
                  <IconButton 
                    size="small" 
                    onClick={() => onEdit(poll.id)}
                    sx={{ color: '#9f7aea', '&:hover': { bgcolor: alpha('#9f7aea', 0.1) } }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar" arrow placement="top">
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => onDelete(poll.id)}
                    sx={{ '&:hover': { bgcolor: alpha('#f56565', 0.1) } }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </CardActions>
      </Card>
    </Zoom>
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
          {/* Cabecera con gradiente */}
          <Box sx={{ 
            p: 3, 
            background: 'linear-gradient(to right, #f8f9fa, #ffffff)',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Box>
                <Typography variant="h4" fontWeight={800} sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 0.5
                }}>
                  📊 Encuestas y Votaciones
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Crea encuestas para tu equipo y obtén resultados en tiempo real
                </Typography>
              </Box>
              <Button 
                variant="contained" 
                size="large" 
                startIcon={<AddIcon />} 
                onClick={() => navigate('/tools/polls/new')}
                sx={{ 
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)',
                  px: 3,
                  py: 1,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4292 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 24px rgba(102, 126, 234, 0.4)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Nueva encuesta
              </Button>
            </Box>
          </Box>

          <Box sx={{ p: 3 }}>
            {polls.length > 0 && <QuickStats polls={polls} />}

            {/* Filtros */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2.5, 
                mb: 3, 
                borderRadius: 2,
                border: '1px solid',
                borderColor: alpha('#000', 0.08),
                bgcolor: '#fafafa'
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField 
                    fullWidth 
                    size="small" 
                    placeholder="Buscar encuestas..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: alpha('#667eea', 0.6) }} />
                        </InputAdornment>
                      ),
                      endAdornment: search && (
                        <IconButton size="small" onClick={() => setSearch('')}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      ),
                      sx: { borderRadius: 2 }
                    }}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: '#667eea' }}>Tipo</InputLabel>
                    <Select 
                      value={filterType} 
                      onChange={(e) => setFilterType(e.target.value)} 
                      label="Tipo"
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="all">Todos los tipos</MenuItem>
                      <MenuItem value="single">🔘 Opción única</MenuItem>
                      <MenuItem value="multiple">☑️ Opción múltiple</MenuItem>
                      <MenuItem value="text">✍️ Texto libre</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: '#667eea' }}>Ordenar</InputLabel>
                    <Select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value)} 
                      label="Ordenar"
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="newest">🆕 Más recientes</MenuItem>
                      <MenuItem value="mostVoted">🔥 Más votadas</MenuItem>
                      <MenuItem value="endingSoon">⏰ Próximas a cerrar</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button 
                    fullWidth 
                    variant="outlined"
                    onClick={() => { setSearch(''); setFilterType('all'); setSortBy('newest'); }}
                    sx={{ 
                      borderRadius: 2,
                      borderColor: '#667eea',
                      color: '#667eea',
                      '&:hover': { borderColor: '#764ba2', bgcolor: alpha('#667eea', 0.04) }
                    }}
                  >
                    <FilterIcon sx={{ mr: 1 }} fontSize="small" />
                    Limpiar
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            <Tabs 
              value={tab} 
              onChange={(_, v) => setTab(v)} 
              sx={{ 
                mb: 3,
                '& .MuiTab-root.Mui-selected': { color: '#667eea' },
                '& .MuiTabs-indicator': { bgcolor: '#667eea' }
              }}
            >
              <Tab 
                label={`Activas (${activeCount})`} 
                sx={{ fontWeight: 600 }}
              />
              <Tab 
                label={`Cerradas (${closedCount})`} 
                sx={{ fontWeight: 600 }}
              />
            </Tabs>

            {error && (
              <Fade in={!!error}>
                <Alert 
                  severity="error" 
                  sx={{ mb: 2, borderRadius: 2 }} 
                  onClose={() => setError('')}
                >
                  {error}
                </Alert>
              </Fade>
            )}

            {loading ? (
              <Box display="flex" justifyContent="center" py={8}>
                <CircularProgress sx={{ color: '#667eea' }} />
              </Box>
            ) : filtered.length === 0 ? (
              <Fade in={filtered.length === 0}>
                <Paper 
                  sx={{ 
                    textAlign: 'center', 
                    py: 8, 
                    px: 4,
                    bgcolor: alpha('#667eea', 0.02),
                    borderRadius: 3,
                    border: '2px dashed',
                    borderColor: alpha('#667eea', 0.2)
                  }}
                >
                  <VoteIcon sx={{ fontSize: 64, color: alpha('#667eea', 0.3), mb: 2 }} />
                  <Typography variant="h5" color="text.secondary" gutterBottom>
                    {tab === 0 ? 'No hay encuestas activas' : 'No hay encuestas cerradas'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    {tab === 0 ? 'Comienza creando tu primera encuesta' : 'Las encuestas cerradas aparecerán aquí'}
                  </Typography>
                  {tab === 0 && (
                    <Button 
                      variant="contained" 
                      startIcon={<AddIcon />} 
                      onClick={() => navigate('/tools/polls/new')}
                      sx={{ 
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': { background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4292 100%)' }
                      }}
                    >
                      Crear primera encuesta
                    </Button>
                  )}
                </Paper>
              </Fade>
            ) : (
              <>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Mostrando <strong>{displayed.length}</strong> de <strong>{filtered.length}</strong> encuestas
                  </Typography>
                  <Chip 
                    label={`Página ${page} de ${totalPages}`}
                    size="small"
                    sx={{ bgcolor: alpha('#667eea', 0.1), color: '#667eea' }}
                  />
                </Box>
                
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
                    <Pagination 
                      count={totalPages} 
                      page={page} 
                      onChange={(_, v) => setPage(v)} 
                      color="primary"
                      sx={{
                        '& .MuiPaginationItem-root.Mui-selected': {
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white'
                        }
                      }}
                    />
                  </Box>
                )}
              </>
            )}
          </Box>
        </Paper>
      </Box>
    </Layout>
  );
}