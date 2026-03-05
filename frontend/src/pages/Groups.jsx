// frontend/src/pages/Groups.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton,
  Chip, TextField, CircularProgress, Avatar, Tooltip, Stack,
  Card, CardContent, Grid, Fade, Zoom, InputAdornment,
  Badge, Divider, alpha, useTheme, LinearProgress,
  Menu, MenuItem, ListItemIcon, ListItemText
} from '@mui/material';
import {
  Add, Edit, Delete, Group as GroupIcon, Search,
  MoreVert as MoreIcon, Refresh as RefreshIcon,
  Download as DownloadIcon, FilterList as FilterIcon,
  Clear as ClearIcon, People as PeopleIcon,
  CalendarToday as CalendarIcon, Visibility as ViewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import GroupForm from '../components/groups/GroupForm';
import * as XLSX from 'xlsx';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function Groups() {
  const theme = useTheme();
  const [groups, setGroups] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedGroupMenu, setSelectedGroupMenu] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    conMiembros: 0,
    totalMiembros: 0,
    gruposVacios: 0
  });
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/groups`, { headers });
      setGroups(res.data);
      
      // Calcular estadísticas
      const totalMiembros = res.data.reduce((acc, group) => 
        acc + (group.members?.length || 0), 0
      );
      const conMiembros = res.data.filter(g => g.members?.length > 0).length;
      
      setStats({
        total: res.data.length,
        conMiembros,
        totalMiembros,
        gruposVacios: res.data.length - conMiembros
      });
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGroups(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(groups.filter(g =>
      g.name.toLowerCase().includes(q) ||
      (g.description || '').toLowerCase().includes(q) ||
      g.members?.some(m => m.name.toLowerCase().includes(q))
    ));
  }, [search, groups]);

  const handleEdit = (e, group) => {
    e.stopPropagation();
    setSelectedGroup(group);
    setFormOpen(true);
  };

  const handleCreate = () => { 
    setSelectedGroup(null); 
    setFormOpen(true); 
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar este grupo?')) return;
    try {
      await axios.delete(`${API}/groups/${id}`, { headers });
      fetchGroups();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMenuOpen = (event, group) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedGroupMenu(group);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedGroupMenu(null);
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filtered.map(g => ({
      Nombre: g.name,
      Descripción: g.description || '-',
      'Nº Miembros': g.members?.length || 0,
      Miembros: g.members?.map(m => m.name).join(', ') || '-',
      'Fecha creación': new Date(g.created_at).toLocaleDateString()
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Grupos');
    XLSX.writeFile(workbook, `grupos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const clearSearch = () => setSearch('');

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Layout>
        <Box sx={{ width: '100%', mt: 4 }}>
          <LinearProgress />
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header con estadísticas */}
        <Fade in={true} timeout={500}>
          <Box mb={4}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <GroupIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    Grupos
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gestiona los grupos y sus miembros
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Tarjetas de estadísticas */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                  <Card sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    borderRadius: 3
                  }}>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>Total Grupos</Typography>
                      <Typography variant="h3" fontWeight="bold" color="primary.main">
                        {stats.total}
                      </Typography>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Zoom in={true} style={{ transitionDelay: '200ms' }}>
                  <Card sx={{ 
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                    borderRadius: 3
                  }}>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>Con miembros</Typography>
                      <Typography variant="h3" fontWeight="bold" color="success.main">
                        {stats.conMiembros}
                      </Typography>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Zoom in={true} style={{ transitionDelay: '300ms' }}>
                  <Card sx={{ 
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                    borderRadius: 3
                  }}>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>Total Miembros</Typography>
                      <Typography variant="h3" fontWeight="bold" color="info.main">
                        {stats.totalMiembros}
                      </Typography>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Zoom in={true} style={{ transitionDelay: '400ms' }}>
                  <Card sx={{ 
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                    borderRadius: 3
                  }}>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>Grupos vacíos</Typography>
                      <Typography variant="h3" fontWeight="bold" color="warning.main">
                        {stats.gruposVacios}
                      </Typography>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
            </Grid>
          </Box>
        </Fade>

        {/* Barra de herramientas */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }} elevation={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField
              fullWidth
              placeholder="Buscar por nombre, descripción o miembros..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
                endAdornment: search && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={clearSearch}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ flex: 1 }}
            />
            
            <Stack direction="row" spacing={1} sx={{ minWidth: 'max-content' }}>
              <Badge color="primary" badgeContent={search ? 1 : 0}>
                <Tooltip title="Exportar a Excel">
                  <IconButton onClick={handleExportExcel} color="primary">
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              </Badge>

              <Tooltip title="Actualizar">
                <IconButton onClick={fetchGroups} color="primary">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>

              <Divider orientation="vertical" flexItem />

              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreate}
              >
                Nuevo Grupo
              </Button>
            </Stack>
          </Stack>

          {/* Resultados de búsqueda */}
          {search && (
            <Fade in={true}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                <Typography variant="body2" color="text.secondary">
                  {filtered.length} resultados encontrados
                </Typography>
                <Button size="small" onClick={clearSearch}>
                  Limpiar búsqueda
                </Button>
              </Box>
            </Fade>
          )}
        </Paper>

        {/* Tabla de grupos */}
        <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }} elevation={2}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Grupo</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Descripción</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Miembros</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Creado</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                      <GroupIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                      <Typography variant="h6" color="text.secondary">
                        {search ? 'No se encontraron grupos' : 'No hay grupos creados'}
                      </Typography>
                      {search ? (
                        <Button variant="outlined" onClick={clearSearch}>
                          Limpiar búsqueda
                        </Button>
                      ) : (
                        <Button variant="contained" startIcon={<Add />} onClick={handleCreate}>
                          Crear primer grupo
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((group, index) => (
                  <Fade in={true} key={group.id} style={{ transitionDelay: `${index * 30}ms` }}>
                    <TableRow
                      hover
                      sx={{ 
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) }
                      }}
                      onClick={() => navigate(`/groups/${group.id}`)}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                            <GroupIcon />
                          </Avatar>
                          <Box>
                            <Typography fontWeight={600}>{group.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {group.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 250 }}>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {group.description || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ maxWidth: 200 }}>
                          {(group.members || []).slice(0, 3).map(m => (
                            <Tooltip key={m.id} title={`${m.name} (${m.email})`}>
                              <Chip
                                avatar={
                                  <Avatar sx={{ bgcolor: 'secondary.main', width: 24, height: 24 }}>
                                    {getInitials(m.name)}
                                  </Avatar>
                                }
                                label={m.name.split(' ')[0]}
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  '& .MuiChip-label': { px: 1 },
                                  cursor: 'pointer'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Aquí podrías navegar al perfil del usuario
                                }}
                              />
                            </Tooltip>
                          ))}
                          {(group.members || []).length > 3 && (
                            <Tooltip title={`${group.members.length - 3} miembros más`}>
                              <Chip 
                                label={`+${group.members.length - 3}`} 
                                size="small"
                                sx={{ cursor: 'pointer' }}
                              />
                            </Tooltip>
                          )}
                          {(group.members || []).length === 0 && (
                            <Typography variant="caption" color="text.secondary">
                              Sin miembros
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CalendarIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {new Date(group.created_at).toLocaleDateString('es-ES')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Ver detalles">
                            <IconButton 
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/groups/${group.id}`);
                              }}
                              sx={{ 
                                bgcolor: alpha(theme.palette.info.main, 0.1),
                                color: 'info.main',
                                '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.2) }
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton 
                              size="small"
                              onClick={(e) => handleEdit(e, group)}
                              sx={{ 
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: 'primary.main',
                                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton 
                              size="small"
                              onClick={(e) => handleDelete(e, group.id)}
                              sx={{ 
                                bgcolor: alpha(theme.palette.error.main, 0.1),
                                color: 'error.main',
                                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, group)}
                          >
                            <MoreIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  </Fade>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Menú contextual */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 200 } }}
        >
          <MenuItem onClick={() => {
            if (selectedGroupMenu) {
              navigate(`/groups/${selectedGroupMenu.id}`);
            }
            handleMenuClose();
          }}>
            <ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Ver detalles</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            if (selectedGroupMenu) {
              handleEdit(null, selectedGroupMenu);
            }
            handleMenuClose();
          }}>
            <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            if (selectedGroupMenu) {
              // Aquí podrías añadir opción de ver miembros
            }
            handleMenuClose();
          }}>
            <ListItemIcon><PeopleIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Ver miembros</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem 
            onClick={() => {
              if (selectedGroupMenu) {
                handleDelete(null, selectedGroupMenu.id);
              }
              handleMenuClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>Eliminar</ListItemText>
          </MenuItem>
        </Menu>

        {/* Formulario de grupo */}
        <GroupForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSaved={fetchGroups}
          group={selectedGroup}
        />
      </Box>
    </Layout>
  );
}