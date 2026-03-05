
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, IconButton, Typography,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, CircularProgress, Avatar, Tooltip, Card, CardContent,
  InputAdornment, Menu, MenuItem, Badge, Stack, Zoom,
  Fade, LinearProgress, useTheme, Grid, Checkbox  // ← AÑADIDO Grid y Checkbox
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon,
  Delete as DeleteIcon, Search as SearchIcon,
  FilterList as FilterIcon, MoreVert as MoreIcon,
  AdminPanelSettings, SupervisorAccount, Person,
  Refresh as RefreshIcon, Email, Phone, CalendarToday,
  CheckCircle, Cancel, ArrowUpward, ArrowDownward,
  Download as DownloadIcon, Print as PrintIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { alpha } from '@mui/material/styles';
import * as XLSX from 'xlsx';


const Users = () => {
  const theme = useTheme();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, userId: null, userName: '' });
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [roleFilter, setRoleFilter] = useState('todos');
  const [sortConfig, setSortConfig] = useState({ field: 'name', direction: 'asc' });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, admin: 0, manager: 0, user: 0 });
  
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const puedeGestionar = usuario?.role === 'admin' || usuario?.role === 'manager';

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    let filtered = users;

    // Filtro por búsqueda
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por rol
    if (roleFilter !== 'todos') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.field];
      let bVal = b[sortConfig.field];
      
      if (sortConfig.field === 'created_at') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredUsers(filtered);
  }, [searchTerm, users, roleFilter, sortConfig]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al cargar usuarios');
      const data = await response.json();
      setUsers(data);
      
      // Calcular estadísticas
      const stats = {
        total: data.length,
        admin: data.filter(u => u.role === 'admin').length,
        manager: data.filter(u => u.role === 'manager').length,
        user: data.filter(u => u.role === 'user').length
      };
      setStats(stats);
      
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/${deleteDialog.userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al eliminar usuario');
      await fetchUsers();
      setDeleteDialog({ open: false, userId: null, userName: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredUsers.map(u => ({
      Nombre: u.name,
      Email: u.email,
      Rol: getRoleLabel(u.role),
      Teléfono: u.phone || '-',
      'Fecha registro': new Date(u.created_at).toLocaleDateString()
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');
    XLSX.writeFile(workbook, `usuarios_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const openDeleteDialog = (userId, userName) => setDeleteDialog({ open: true, userId, userName });
  const closeDeleteDialog = () => setDeleteDialog({ open: false, userId: null, userName: '' });
  const openFilterMenu = (event) => setFilterAnchorEl(event.currentTarget);
  const closeFilterMenu = () => setFilterAnchorEl(null);

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':   return 'error';
      case 'manager': return 'warning';
      case 'user':    return 'success';
      default:        return 'default';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':   return <AdminPanelSettings />;
      case 'manager': return <SupervisorAccount />;
      case 'user':    return <Person />;
      default:        return <Person />;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':   return 'Administrador';
      case 'manager': return 'Manager';
      case 'user':    return 'Usuario';
      default:        return role;
    }
  };

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
      <Box sx={{ p: 3 }}>
        {/* Header con estadísticas */}
        <Fade in={true} timeout={500}>
          <Box mb={4}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              👥 Gestión de Usuarios
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              Administra los usuarios del sistema y sus permisos
            </Typography>

            {/* Tarjetas de estadísticas */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                  <Card sx={{ 
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                  }}>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>Total Usuarios</Typography>
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
                    background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`,
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                  }}>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>Administradores</Typography>
                      <Typography variant="h3" fontWeight="bold" color="error.main">
                        {stats.admin}
                      </Typography>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Zoom in={true} style={{ transitionDelay: '300ms' }}>
                  <Card sx={{ 
                    background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                  }}>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>Managers</Typography>
                      <Typography variant="h3" fontWeight="bold" color="warning.main">
                        {stats.manager}
                      </Typography>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Zoom in={true} style={{ transitionDelay: '400ms' }}>
                  <Card sx={{ 
                    background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                  }}>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>Usuarios</Typography>
                      <Typography variant="h3" fontWeight="bold" color="success.main">
                        {stats.user}
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
              variant="outlined"
              placeholder="Buscar por nombre, email, rol o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
            
            <Stack direction="row" spacing={1} sx={{ minWidth: 'max-content' }}>
              <Tooltip title="Filtrar por rol">
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={openFilterMenu}
                  size="medium"
                >
                  {roleFilter === 'todos' ? 'Todos' : getRoleLabel(roleFilter)}
                </Button>
              </Tooltip>
              
              <Menu
                anchorEl={filterAnchorEl}
                open={Boolean(filterAnchorEl)}
                onClose={closeFilterMenu}
              >
                <MenuItem onClick={() => { setRoleFilter('todos'); closeFilterMenu(); }}>
                  Todos los roles
                </MenuItem>
                <MenuItem onClick={() => { setRoleFilter('admin'); closeFilterMenu(); }}>
                  Administradores
                </MenuItem>
                <MenuItem onClick={() => { setRoleFilter('manager'); closeFilterMenu(); }}>
                  Managers
                </MenuItem>
                <MenuItem onClick={() => { setRoleFilter('user'); closeFilterMenu(); }}>
                  Usuarios
                </MenuItem>
              </Menu>

              <Tooltip title="Exportar a Excel">
                <IconButton onClick={handleExportExcel} color="primary">
                  <DownloadIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Actualizar">
                <IconButton onClick={fetchUsers} color="primary">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>

              {puedeGestionar && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/users/new')}
                  size="medium"
                >
                  Nuevo Usuario
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>

        {error && (
          <Fade in={true}>
            <Alert 
              severity="error" 
              sx={{ mb: 3, borderRadius: 2 }}
              onClose={() => setError(null)}
              action={
                <Button color="inherit" size="small" onClick={fetchUsers}>
                  Reintentar
                </Button>
              }
            >
              {error}
            </Alert>
          </Fade>
        )}

        {/* Tabla de usuarios */}
        <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                {puedeGestionar && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedUsers.length > 0 && selectedUsers.length < filteredUsers.length}
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                )}
                <TableCell 
                  onClick={() => handleSort('name')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  <Box display="flex" alignItems="center" gap={0.5}>
                    Usuario
                    {sortConfig.field === 'name' && (
                      sortConfig.direction === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Contacto</TableCell>
                <TableCell 
                  onClick={() => handleSort('role')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  <Box display="flex" alignItems="center" gap={0.5}>
                    Rol
                    {sortConfig.field === 'role' && (
                      sortConfig.direction === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell 
                  onClick={() => handleSort('created_at')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  <Box display="flex" alignItems="center" gap={0.5}>
                    Registro
                    {sortConfig.field === 'created_at' && (
                      sortConfig.direction === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                {puedeGestionar && (
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={puedeGestionar ? 6 : 4} align="center" sx={{ py: 8 }}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                      <Person sx={{ fontSize: 48, color: 'text.disabled' }} />
                      <Typography variant="h6" color="text.secondary">
                        {searchTerm || roleFilter !== 'todos' 
                          ? 'No se encontraron usuarios con esos filtros' 
                          : 'No hay usuarios registrados'}
                      </Typography>
                      {(searchTerm || roleFilter !== 'todos') && (
                        <Button 
                          variant="outlined" 
                          onClick={() => {
                            setSearchTerm('');
                            setRoleFilter('todos');
                          }}
                        >
                          Limpiar filtros
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user, index) => (
                  <Fade in={true} key={user.id} style={{ transitionDelay: `${index * 50}ms` }}>
                    <TableRow 
                      hover 
                      sx={{ 
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                        transition: 'background-color 0.2s'
                      }}
                    >
                      {puedeGestionar && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar 
                            sx={{ 
                              bgcolor: getRoleColor(user.role),
                              width: 40,
                              height: 40,
                              fontSize: 16,
                              fontWeight: 'bold'
                            }}
                          >
                            {getInitials(user.name)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="600">
                              {user.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {user.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Email fontSize="small" color="action" />
                            <Typography variant="body2">{user.email}</Typography>
                          </Box>
                          {user.phone && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <Phone fontSize="small" color="action" />
                              <Typography variant="body2">{user.phone}</Typography>
                            </Box>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getRoleIcon(user.role)}
                          label={getRoleLabel(user.role)}
                          color={getRoleColor(user.role)}
                          size="small"
                          sx={{ 
                            fontWeight: 500,
                            '& .MuiChip-icon': { fontSize: 16 }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CalendarToday fontSize="small" color="action" />
                          <Typography variant="body2">
                            {new Date(user.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      {puedeGestionar && (
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="Editar usuario">
                              <IconButton
                                color="primary"
                                onClick={() => navigate(`/users/edit/${user.id}`)}
                                size="small"
                                sx={{ 
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar usuario">
                              <IconButton
                                color="error"
                                onClick={() => openDeleteDialog(user.id, user.name)}
                                size="small"
                                sx={{ 
                                  bgcolor: alpha(theme.palette.error.main, 0.1),
                                  '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      )}
                    </TableRow>
                  </Fade>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Diálogo de confirmación */}
        <Dialog 
          open={deleteDialog.open} 
          onClose={closeDeleteDialog}
          PaperProps={{ sx: { borderRadius: 3, minWidth: 400 } }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h5" fontWeight="bold">Confirmar eliminación</Typography>
          </DialogTitle>
          <DialogContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Avatar sx={{ bgcolor: 'error.light', width: 48, height: 48 }}>
                <DeleteIcon />
              </Avatar>
              <Box>
                <Typography variant="body1" gutterBottom>
                  ¿Estás seguro de que deseas eliminar a?
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {deleteDialog.userName}
                </Typography>
              </Box>
            </Box>
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              Esta acción no se puede deshacer. Se eliminarán todos los datos asociados al usuario.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button 
              onClick={closeDeleteDialog}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleDelete} 
              color="error" 
              variant="contained"
              startIcon={<DeleteIcon />}
              sx={{ borderRadius: 2 }}
            >
              Eliminar permanentemente
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default Users;