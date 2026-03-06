// frontend/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, Avatar, Chip, 
  IconButton, Tooltip, Divider, LinearProgress, 
  Fade, Zoom, Button
} from '@mui/material';
import { 
  People, Group, FolderOpen, Schedule, TrendingUp, 
  TrendingDown, AccessTime, Refresh, CheckCircle,
  ArrowForward, CalendarMonth, Assignment, PersonAdd
} from '@mui/icons-material';  
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { alpha } from '@mui/material/styles';
import axios from '../services/axiosConfig';

export default function Dashboard() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    usuarios: { total: 0, activos: 0, nuevos: 0 },
    grupos: { total: 0, conMiembros: 0 },
    proyectos: { 
      total: 0, 
      completados: 0, 
      enProgreso: 0, 
      pendientes: 0 
    }
  });
  
  const [activities, setActivities] = useState([]);
  const [progress, setProgress] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Obtener datos de usuarios, grupos y proyectos en paralelo
        const [usersRes, groupsRes, projectsRes] = await Promise.all([
          axios.get('/users'),
          axios.get('/groups'),
          axios.get('/projects')
        ]);

        // PROCESAR USUARIOS
        const usuarios = usersRes.data;
        const usuariosActivos = usuarios.length; // Por ahora todos son activos
        const usuariosNuevos = usuarios.filter(u => {
          const fechaCreacion = new Date(u.created_at);
          const hace7Dias = new Date();
          hace7Dias.setDate(hace7Dias.getDate() - 7);
          return fechaCreacion > hace7Dias;
        }).length;

        // PROCESAR GRUPOS
        const grupos = groupsRes.data;
        const gruposConMiembros = grupos.filter(g => g.members?.length > 0).length;

        // PROCESAR PROYECTOS
        const proyectos = projectsRes.data;
        const proyectosCompletados = proyectos.filter(p => p.status === 'completado').length;
        const proyectosEnProgreso = proyectos.filter(p => p.status === 'en_progreso').length;
        const proyectosPendientes = proyectos.filter(p => p.status === 'pendiente').length;

        setStats({
          usuarios: {
            total: usuarios.length,
            activos: usuariosActivos,
            nuevos: usuariosNuevos
          },
          grupos: {
            total: grupos.length,
            conMiembros: gruposConMiembros
          },
          proyectos: {
            total: proyectos.length,
            completados: proyectosCompletados,
            enProgreso: proyectosEnProgreso,
            pendientes: proyectosPendientes
          }
        });

        setProgress({
          total: proyectos.length,
          completed: proyectosCompletados,
          inProgress: proyectosEnProgreso,
          pending: proyectosPendientes
        });

        // GENERAR ACTIVIDAD RECIENTE
        const allActivities = [];

        // Usuarios nuevos (últimos 3)
        usuarios.slice(0, 3).forEach(user => {
          allActivities.push({
            type: 'user',
            title: `Nuevo usuario: ${user.name}`,
            time: formatTimeAgo(user.created_at),
            status: 'Nuevo',
            statusColor: 'success',
            color: '#667eea',
            icon: <PersonAdd />
          });
        });

        // Proyectos recientes (últimos 3)
        proyectos.slice(0, 3).forEach(proj => {
          allActivities.push({
            type: 'project',
            title: `Proyecto: ${proj.name}`,
            time: formatTimeAgo(proj.created_at),
            status: proj.status === 'completado' ? 'Completado' : 
                    proj.status === 'en_progreso' ? 'En progreso' : 'Pendiente',
            statusColor: proj.status === 'completado' ? 'success' : 
                        proj.status === 'en_progreso' ? 'warning' : 'info',
            color: proj.status === 'completado' ? '#4caf50' : 
                   proj.status === 'en_progreso' ? '#ff9800' : '#2196f3',
            icon: <Assignment />
          });
        });

        // Grupos recientes (últimos 3)
        grupos.slice(0, 3).forEach(group => {
          allActivities.push({
            type: 'group',
            title: `Grupo: ${group.name}`,
            time: formatTimeAgo(group.created_at),
            status: group.members?.length > 0 ? 'Con miembros' : 'Vacío',
            statusColor: group.members?.length > 0 ? 'info' : 'default',
            color: '#764ba2',
            icon: <Group />
          });
        });

        // Ordenar por fecha (más reciente primero) y tomar los primeros 5
        allActivities.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
        setActivities(allActivities.slice(0, 5));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Función para formatear tiempo relativo
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    return `Hace ${diffDays} días`;
  };

  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <LinearProgress sx={{ width: '50%' }} />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
            👋 ¡Bienvenido de nuevo, <Box component="span" sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>{usuario?.name || 'Admin'}</Box>!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Aquí tienes un resumen de tu CRM
          </Typography>
        </Box>
        
        <Tooltip title="Actualizar datos">
          <IconButton onClick={() => window.location.reload()}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {/* Reloj digital */}
        <Grid item xs={12} md={4}>
          <DigitalClock />
        </Grid>
        
        {/* Tarjetas de estadísticas */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <GlassStatCard
                icon={<People />}
                label="Usuarios activos"
                value={stats.usuarios.activos}
                color="#667eea"
                onClick={() => navigate('/users')}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <GlassStatCard
                icon={<Group />}
                label="Grupos"
                value={stats.grupos.total}
                color="#764ba2"
                onClick={() => navigate('/groups')}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <GlassStatCard
                icon={<FolderOpen />}
                label="Proyectos"
                value={stats.proyectos.total}
                color="#f093fb"
                onClick={() => navigate('/projects')}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Progreso general */}
        <Grid item xs={12} md={6}>
          <OverallProgress stats={progress} />
        </Grid>

        {/* Actividad reciente */}
        <Grid item xs={12} md={6}>
          <RecentActivity activities={activities} />
        </Grid>

        {/* Estadísticas adicionales */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 4 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              📊 Resumen detallado
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary" fontWeight="bold">
                    {stats.usuarios.nuevos}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Usuarios nuevos (7 días)
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="secondary" fontWeight="bold">
                    {stats.grupos.conMiembros}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Grupos con miembros
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="warning.main" fontWeight="bold">
                    {stats.proyectos.enProgreso}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Proyectos en progreso
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Layout>
  );
}

// ===== COMPONENTES =====

const DigitalClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box sx={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: 4,
      p: 3,
      color: 'white',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Box sx={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 120,
        height: 120,
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '50%',
      }} />
      
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTime />
          <Typography variant="body2" sx={{ opacity: 0.9 }}>Hora actual</Typography>
        </Box>
        <Chip 
          label={time.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          size="small"
          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', textTransform: 'capitalize' }}
        />
      </Box>
      
      <Typography variant="h2" sx={{ fontWeight: 700, lineHeight: 1, mb: 1 }}>
        {time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CalendarMonth fontSize="small" />
          <Typography variant="body2">Semana {Math.ceil(time.getDate() / 7)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Schedule fontSize="small" />
          <Typography variant="body2">{time.getHours() > 12 ? 'PM' : 'AM'}</Typography>
        </Box>
      </Box>
    </Box>
  );
};

const GlassStatCard = ({ icon, label, value, color, onClick }) => {
  return (
    <Zoom in={true} style={{ transitionDelay: '100ms' }}>
      <Paper
        elevation={0}
        onClick={onClick}
        sx={{
          p: 3,
          borderRadius: 4,
          cursor: 'pointer',
          background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(color, 0.2)}`,
          transition: 'transform 0.3s, box-shadow 0.3s',
          '&:hover': {
            transform: 'translateY(-4px) scale(1.02)',
            boxShadow: `0 20px 40px ${alpha(color, 0.3)}`,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ 
            bgcolor: alpha(color, 0.2),
            p: 1.5,
            borderRadius: 3,
            color: color,
            display: 'inline-flex'
          }}>
            {icon}
          </Box>
        </Box>
        
        <Typography variant="h4" fontWeight="bold" sx={{ mt: 2, mb: 0.5 }}>
          {value}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {label}
          <ArrowForward sx={{ fontSize: 16, opacity: 0, transition: '0.2s', ml: 1 }} />
        </Typography>
      </Paper>
    </Zoom>
  );
};

const RecentActivity = ({ activities }) => {
  return (
    <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">Actividad Reciente</Typography>
        <IconButton size="small">
          <Refresh />
        </IconButton>
      </Box>
      
      {activities.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
          No hay actividad reciente
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {activities.map((activity, index) => (
            <Fade in={true} key={index} style={{ transitionDelay: `${index * 100}ms` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: alpha(activity.color, 0.1), color: activity.color }}>
                  {activity.type === 'user' ? <PersonAdd /> :
                   activity.type === 'group' ? <Group /> : <Assignment />}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={500}>{activity.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{activity.time}</Typography>
                </Box>
                <Chip 
                  label={activity.status} 
                  size="small" 
                  color={activity.statusColor}
                  variant="outlined"
                />
              </Box>
            </Fade>
          ))}
        </Box>
      )}
      
      <Divider sx={{ my: 2 }} />
      
      <Button 
        fullWidth 
        variant="text" 
        endIcon={<ArrowForward />}
        sx={{ textTransform: 'none' }}
      >
        Ver toda la actividad
      </Button>
    </Paper>
  );
};

const OverallProgress = ({ stats }) => {
  const completion = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;
  
  return (
    <Paper sx={{ p: 3, borderRadius: 4 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Progreso General
      </Typography>
      
      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">Completado</Typography>
          <Typography variant="body2" fontWeight="bold">{completion}%</Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={completion}
          sx={{ 
            height: 8, 
            borderRadius: 4,
            bgcolor: alpha('#667eea', 0.1),
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 4,
            }
          }}
        />
      </Box>
      
      <Box sx={{ display: 'flex', gap: 3, mt: 3, justifyContent: 'space-around' }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="success.main">{stats.completed}</Typography>
          <Typography variant="caption" color="text.secondary">Completados</Typography>
        </Box>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="warning.main">{stats.inProgress}</Typography>
          <Typography variant="caption" color="text.secondary">En progreso</Typography>
        </Box>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="info.main">{stats.pending}</Typography>
          <Typography variant="caption" color="text.secondary">Pendientes</Typography>
        </Box>
      </Box>
    </Paper>
  );
};