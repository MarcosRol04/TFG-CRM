import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Typography, Divider, Avatar, Collapse, Tooltip
} from '@mui/material';
import {
  Dashboard as DashboardIcon, People, Group,
  Logout, ExpandLess, ExpandMore, FiberManualRecord
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const SIDEBAR_WIDTH = 240;
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function Layout({ children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [groupsOpen, setGroupsOpen] = useState(true);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`${API}/groups`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setGroups(res.data))
      .catch(console.error);
  }, [location.pathname]); // recarga al cambiar de página

  const navItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { label: 'Usuarios',  icon: <People />,        path: '/users' },
  ];

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

          {/* Dashboard y Usuarios */}
          {navItems.map(({ label, icon, path }) => {
            const active = location.pathname === path;
            return (
              <ListItem key={path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(path)}
                  sx={{
                    borderRadius: 2,
                    bgcolor: active ? 'primary.main' : 'transparent',
                    color: active ? 'white' : 'text.primary',
                    '&:hover': { bgcolor: active ? 'primary.dark' : 'action.hover' },
                    '& .MuiListItemIcon-root': { color: active ? 'white' : 'text.secondary', minWidth: 40 },
                  }}
                >
                  <ListItemIcon>{icon}</ListItemIcon>
                  <ListItemText primary={label} primaryTypographyProps={{ fontWeight: active ? 600 : 400 }} />
                </ListItemButton>
              </ListItem>
            );
          })}

          {/* Grupos — desplegable */}
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => { navigate('/groups'); setGroupsOpen(!groupsOpen); }}
              sx={{
                borderRadius: 2,
                bgcolor: location.pathname === '/groups' ? 'primary.main' : 'transparent',
                color: location.pathname === '/groups' ? 'white' : 'text.primary',
                '&:hover': { bgcolor: location.pathname === '/groups' ? 'primary.dark' : 'action.hover' },
                '& .MuiListItemIcon-root': {
                  color: location.pathname === '/groups' ? 'white' : 'text.secondary',
                  minWidth: 40
                },
              }}
            >
              <ListItemIcon><Group /></ListItemIcon>
              <ListItemText primary="Grupos" primaryTypographyProps={{ fontWeight: location.pathname === '/groups' ? 600 : 400 }} />
              {groupsOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            </ListItemButton>
          </ListItem>

          {/* Lista de grupos en el sidebar */}
          <Collapse in={groupsOpen} timeout="auto" unmountOnExit>
            <List disablePadding sx={{ pl: 2 }}>
              {groups.length === 0 ? (
                <ListItem sx={{ py: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Sin grupos</Typography>
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
                            noWrap: true
                          }}
                        />
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                );
              })}
            </List>
          </Collapse>

        </List>

        <Divider />

        {/* Usuario + logout */}
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: 14 }}>
              {usuario?.name?.[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="body2" fontWeight={600} noWrap>{usuario?.name}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>{usuario?.role}</Typography>
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
      </Drawer>

      {/* Contenido */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, minWidth: 0 }}>
        {children}
      </Box>

    </Box>
  );
}