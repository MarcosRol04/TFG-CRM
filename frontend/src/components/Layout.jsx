import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Typography, Divider, Avatar, Collapse, Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Dashboard as DashboardIcon, People, Group,
  Logout, ExpandLess, ExpandMore, FiberManualRecord
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FolderOpen } from '@mui/icons-material';
import BuildIcon from '@mui/icons-material/Build';

const SIDEBAR_WIDTH = 240;
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function Layout({ children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [groupsOpen, setGroupsOpen] = useState(true);
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groupsError, setGroupsError] = useState(null);

  useEffect(() => {
    const fetchGroups = async () => {
      const token = localStorage.getItem('token');
      
      // ⚠️ Si no hay token, no hacer la petición
      if (!token) {
        console.log('⏳ No hay token disponible, omitiendo carga de grupos');
        setGroups([]);
        setGroupsError(null);
        return;
      }

      setLoadingGroups(true);
      setGroupsError(null);

      try {
        console.log('📡 Cargando grupos...');
        const res = await axios.get(`${API}/groups`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        console.log('✅ Grupos cargados:', res.data);
        // El backend ya filtra los grupos según acceso del usuario
        setGroups(res.data);
        
        // Si no hay grupos, mostrar mensaje informativo
        if (res.data.length === 0) {
          console.log('ℹ️ El usuario no pertenece a ningún grupo');
        }
      } catch (error) {
        console.error('❌ Error al cargar grupos:', error);
        
        // Si es error 401, el token es inválido o expiró
        if (error.response?.status === 401) {
          console.log('🔑 Token inválido o expirado');
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
          
          // Redirigir a login si no estamos ya allí
          if (!location.pathname.includes('/login')) {
            navigate('/login');
          }
        }
        // Si es error 403, el usuario no tiene acceso a ningún grupo
        else if (error.response?.status === 403) {
          setGroupsError('No tienes acceso a ningún grupo');
        } else {
          setGroupsError('Error al cargar grupos');
        }
        
        setGroups([]);
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchGroups();
  }, [location.pathname, navigate]);

  const navItems = [
    { label: 'Dashboard',    icon: <DashboardIcon />, path: '/dashboard' },
    { label: 'Usuarios',     icon: <People />,        path: '/users'     },
    { label: 'Proyectos',    icon: <FolderOpen />,    path: '/projects'  },
  ];

  // Filtrar usuarios solo si el usuario actual tiene rol admin
  const visibleNavItems = navItems.filter(item => {
    if (item.path === '/users' && usuario?.role !== 'admin') {
      return false;
    }
    return true;
  });

  const isActive = (path) => location.pathname === path;

  const navBtnSx = (path) => ({
    borderRadius: 2,
    bgcolor: isActive(path) ? 'primary.main' : 'transparent',
    color: isActive(path) ? 'white' : 'text.primary',
    '&:hover': { bgcolor: isActive(path) ? 'primary.dark' : 'action.hover' },
    '& .MuiListItemIcon-root': {
      color: isActive(path) ? 'white' : 'text.secondary',
      minWidth: 40,
    },
  });

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>

      <Drawer
        variant="permanent"
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            bgcolor: '#ffffff',
            borderRight: '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Logo */}
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight="bold" color="primary">TFG CRM</Typography>
          <Typography variant="caption" color="text.secondary">Panel de gestión</Typography>
        </Box>

        <Divider />

        <List sx={{ px: 1, mt: 1, flexGrow: 1, overflowY: 'auto' }}>

          {/* Dashboard, Usuarios, Proyectos (filtrados por rol) */}
          {visibleNavItems.map(({ label, icon, path }) => (
            <ListItem key={path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton onClick={() => navigate(path)} sx={navBtnSx(path)}>
                <ListItemIcon>{icon}</ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{ fontWeight: isActive(path) ? 600 : 400 }}
                />
              </ListItemButton>
            </ListItem>
          ))}

          {/* Grupos — desplegable */}
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => { 
                navigate('/groups'); 
                setGroupsOpen(!groupsOpen); 
              }}
              sx={navBtnSx('/groups')}
            >
              <ListItemIcon><Group /></ListItemIcon>
              <ListItemText
                primary="Grupos"
                primaryTypographyProps={{ fontWeight: isActive('/groups') ? 600 : 400 }}
              />
              {groupsOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            </ListItemButton>
          </ListItem>

          {/* Lista de grupos con estado de carga y errores */}
          <Collapse in={groupsOpen} timeout="auto" unmountOnExit>
            <List disablePadding sx={{ pl: 2 }}>
              {loadingGroups ? (
                <ListItem sx={{ py: 1, justifyContent: 'center' }}>
                  <CircularProgress size={20} />
                </ListItem>
              ) : groupsError ? (
                <ListItem sx={{ py: 0.5 }}>
                  <Typography variant="caption" color="error.main">
                    {groupsError}
                  </Typography>
                </ListItem>
              ) : groups.length === 0 ? (
                <ListItem sx={{ py: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {localStorage.getItem('token') ? 'No perteneces a ningún grupo' : 'Inicia sesión'}
                  </Typography>
                </ListItem>
              ) : groups.map(group => {
                const active = location.pathname === `/groups/${group.id}`;
                return (
                  <ListItem key={group.id} disablePadding sx={{ mb: 0.25 }}>
                    <Tooltip title={group.description || group.name} placement="right">
                      <ListItemButton
                        onClick={() => navigate(`/groups/${group.id}`)}
                        sx={{
                          borderRadius: 2, py: 0.75,
                          bgcolor: active ? 'primary.light' : 'transparent',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <FiberManualRecord sx={{ fontSize: 8, color: active ? 'primary.main' : 'text.disabled' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={group.name}
                          primaryTypographyProps={{
                            fontSize: 13,
                            fontWeight: active ? 600 : 400,
                            color: active ? 'primary.main' : 'text.primary',
                            noWrap: true,
                          }}
                        />
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                );
              })}
            </List>
          </Collapse>

          {/* ── HERRAMIENTAS ── */}
          <ListItem disablePadding sx={{ mb: 0.5, mt: 0.5 }}>
            <ListItemButton onClick={() => navigate('/tools')} sx={navBtnSx('/tools')}>
              <ListItemIcon><BuildIcon /></ListItemIcon>
              <ListItemText
                primary="Herramientas"
                primaryTypographyProps={{ fontWeight: isActive('/tools') ? 600 : 400 }}
              />
            </ListItemButton>
          </ListItem>

        </List>

        <Divider />

        {/* Usuario + logout - Solo mostrar si hay usuario */}
        {usuario && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: 14 }}>
                {usuario?.name?.[0]?.toUpperCase()}
              </Avatar>
              <Box sx={{ overflow: 'hidden' }}>
                <Typography variant="body2" fontWeight={600} noWrap>{usuario?.name}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {usuario?.role === 'admin' ? 'Administrador' : usuario?.role === 'manager' ? 'Manager' : 'Usuario'}
                </Typography>
              </Box>
            </Box>
            <ListItemButton
              onClick={logout}
              sx={{
                borderRadius: 2, color: 'error.main',
                '&:hover': { bgcolor: '#fff5f5' },
                '& .MuiListItemIcon-root': { color: 'error.main', minWidth: 36 },
              }}
            >
              <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
              <ListItemText primary="Cerrar sesión" primaryTypographyProps={{ fontSize: 14 }} />
            </ListItemButton>
          </Box>
        )}
      </Drawer>

      {/* Contenido principal */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, minWidth: 0 }}>
        {children}
      </Box>

    </Box>
  );
}