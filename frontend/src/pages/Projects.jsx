// frontend/src/pages/Projects.jsx (versión corregida)
import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, MenuItem,
  Grid, CircularProgress, ToggleButton, ToggleButtonGroup,
  Paper, Chip, IconButton, Tooltip, Badge, Fade, Zoom,
  LinearProgress, InputAdornment, Popover, FormControl,
  InputLabel, Select, FormControlLabel, Switch, Divider,
  Card, CardContent, Avatar, Stack, alpha, useTheme, Alert
} from '@mui/material';
import {
  Add, ViewModule, ViewList, FolderOpen,
  Search as SearchIcon, FilterList as FilterIcon,
  Clear as ClearIcon, Download as DownloadIcon,
  Refresh as RefreshIcon, Sort as SortIcon,
  TrendingUp, TrendingDown, CalendarToday,
  CheckCircle, Cancel, Schedule, MoreVert
} from '@mui/icons-material';
import axios from 'axios';
import Layout from '../components/Layout';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectForm from '../components/projects/ProjectForm';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ESTADOS = [
  { value: '', label: 'Todos', color: 'default' },
  { value: 'pendiente',   label: '⏳ Pendiente', color: 'info' },
  { value: 'en_progreso', label: '🔄 En progreso', color: 'warning' },
  { value: 'completado',  label: '✅ Completado', color: 'success' },
  { value: 'cancelado',   label: '❌ Cancelado', color: 'error' },
];

const getStatusColor = (status) => {
  switch(status) {
    case 'pendiente': return 'info';
    case 'en_progreso': return 'warning';
    case 'completado': return 'success';
    case 'cancelado': return 'error';
    default: return 'default';
  }
};

const getStatusIcon = (status) => {
  switch(status) {
    case 'pendiente': return <Schedule />;
    case 'en_progreso': return <TrendingUp />;
    case 'completado': return <CheckCircle />;
    case 'cancelado': return <Cancel />;
    default: return <FolderOpen />;
  }
};

export default function Projects() {
  const theme = useTheme();
  const [projects, setProjects] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [view, setView] = useState('grid');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pendiente: 0,
    en_progreso: 0,
    completado: 0,
    cancelado: 0
  });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projRes, groupRes] = await Promise.all([
        axios.get(`${API}/projects`, { headers }),
        axios.get(`${API}/groups`, { headers }),
      ]);
      
      // El backend ya filtra los proyectos según acceso
      const projectsData = projRes.data;
      setProjects(projectsData);
      setGroups(groupRes.data);
      
      // Calcular estadísticas solo con los proyectos accesibles
      const stats = {
        total: projectsData.length,
        pendiente: projectsData.filter(p => p.status === 'pendiente').length,
        en_progreso: projectsData.filter(p => p.status === 'en_progreso').length,
        completado: projectsData.filter(p => p.status === 'completado').length,
        cancelado: projectsData.filter(p => p.status === 'cancelado').length
      };
      setStats(stats);
      
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        setError('No tienes acceso a ningún proyecto');
      } else {
        setError('Error al cargar los proyectos');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    let result = projects;

    // Búsqueda
    if (search) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filtros básicos
    if (filterGroup) result = result.filter(p => p.group_id === filterGroup);
    if (filterStatus) result = result.filter(p => p.status === filterStatus);

    // Filtros avanzados
    if (dateRange.start) {
      result = result.filter(p => new Date(p.created_at) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      result = result.filter(p => new Date(p.created_at) <= new Date(dateRange.end));
    }

    // Ordenamiento
    result.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'created_at' || sortBy === 'start_date' || sortBy === 'end_date') {
        aVal = aVal ? new Date(aVal) : new Date(0);
        bVal = bVal ? new Date(bVal) : new Date(0);
      }
      
      if (sortBy === 'name' || sortBy === 'status') {
        aVal = aVal || '';
        bVal = bVal || '';
      }
      
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      if (aVal < bVal) return -1 * direction;
      if (aVal > bVal) return 1 * direction;
      return 0;
    });

    setFiltered(result);
  }, [search, filterGroup, filterStatus, projects, sortBy, sortDirection, dateRange]);

  const handleEdit = (e, project) => {
    e.stopPropagation();
    setSelectedProject(project);
    setFormOpen(true);
  };

  const handleCreate = () => { setSelectedProject(null); setFormOpen(true); };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar este proyecto?')) return;
    try {
      await axios.delete(`${API}/projects/${id}`, { headers });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportExcel = () => {
    if (filtered.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(filtered.map(p => ({
      Nombre: p.name,
      Descripción: p.description || '-',
      Grupo: groups.find(g => g.id === p.group_id)?.name || '-',
      Estado: ESTADOS.find(e => e.value === p.status)?.label || p.status,
      'Fecha inicio': p.start_date ? new Date(p.start_date).toLocaleDateString() : '-',
      'Fecha fin': p.end_date ? new Date(p.end_date).toLocaleDateString() : '-',
      'Fecha creación': new Date(p.created_at).toLocaleDateString()
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Proyectos');
    XLSX.writeFile(workbook, `proyectos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const clearFilters = () => {
    setSearch('');
    setFilterGroup('');
    setFilterStatus('');
    setDateRange({ start: '', end: '' });
    setSortBy('created_at');
    setSortDirection('desc');
  };

  const activeFiltersCount = [
    search,
    filterGroup,
    filterStatus,
    dateRange.start,
    dateRange.end
  ].filter(Boolean).length;

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

  // Mostrar error si no hay acceso
  if (error) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Alert severity="error" sx={{ maxWidth: 500 }}>
            {error}
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Contacta con un administrador si crees que deberías tener acceso.
            </Typography>
          </Alert>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        {/* Header con estadísticas - solo si hay proyectos */}
        {projects.length > 0 && (
          <Fade in={true} timeout={500}>
            <Box mb={4}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                    <FolderOpen fontSize="large" />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      Proyectos
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Gestiona todos los proyectos del sistema
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Tarjetas de estadísticas */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                    <Card sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                    }}>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>Total</Typography>
                        <Typography variant="h4" fontWeight="bold" color="primary.main">
                          {stats.total}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Zoom>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Zoom in={true} style={{ transitionDelay: '200ms' }}>
                    <Card sx={{ 
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                    }}>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>Pendientes</Typography>
                        <Typography variant="h4" fontWeight="bold" color="info.main">
                          {stats.pendiente}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Zoom>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Zoom in={true} style={{ transitionDelay: '300ms' }}>
                    <Card sx={{ 
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                    }}>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>En progreso</Typography>
                        <Typography variant="h4" fontWeight="bold" color="warning.main">
                          {stats.en_progreso}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Zoom>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Zoom in={true} style={{ transitionDelay: '400ms' }}>
                    <Card sx={{ 
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                    }}>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>Completados</Typography>
                        <Typography variant="h4" fontWeight="bold" color="success.main">
                          {stats.completado}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Zoom>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Zoom in={true} style={{ transitionDelay: '500ms' }}>
                    <Card sx={{ 
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                      border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                    }}>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>Cancelados</Typography>
                        <Typography variant="h4" fontWeight="bold" color="error.main">
                          {stats.cancelado}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Zoom>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        )}

        {/* Barra de herramientas - solo visible si hay proyectos o filtros */}
        {(projects.length > 0 || activeFiltersCount > 0) && (
          <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }} elevation={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
              <TextField
                fullWidth
                placeholder="Buscar proyectos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: search && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearch('')}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              
              <Stack direction="row" spacing={1} sx={{ minWidth: 'max-content' }}>
                <Badge color="primary" badgeContent={activeFiltersCount}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                    size="medium"
                  >
                    Filtros
                  </Button>
                </Badge>

                <Popover
                  open={Boolean(filterAnchorEl)}
                  anchorEl={filterAnchorEl}
                  onClose={() => setFilterAnchorEl(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  PaperProps={{ sx: { p: 3, width: 320, borderRadius: 3 } }}
                >
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Filtros avanzados
                  </Typography>
                  
                  <Stack spacing={2} mt={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Grupo</InputLabel>
                      <Select
                        value={filterGroup}
                        onChange={e => setFilterGroup(e.target.value)}
                        label="Grupo"
                      >
                        <MenuItem value="">Todos los grupos</MenuItem>
                        {groups.map(g => (
                          <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                      <InputLabel>Estado</InputLabel>
                      <Select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        label="Estado"
                      >
                        {ESTADOS.map(e => (
                          <MenuItem key={e.value} value={e.value}>
                            <Chip 
                              size="small" 
                              label={e.label} 
                              color={e.color}
                              sx={{ minWidth: 100 }}
                            />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Divider />

                    <FormControl fullWidth size="small">
                      <InputLabel>Ordenar por</InputLabel>
                      <Select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        label="Ordenar por"
                      >
                        <MenuItem value="created_at">Fecha de creación</MenuItem>
                        <MenuItem value="name">Nombre</MenuItem>
                        <MenuItem value="status">Estado</MenuItem>
                        <MenuItem value="start_date">Fecha inicio</MenuItem>
                        <MenuItem value="end_date">Fecha fin</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <ToggleButtonGroup
                        value={sortDirection}
                        exclusive
                        onChange={(_, v) => v && setSortDirection(v)}
                        size="small"
                      >
                        <ToggleButton value="asc">
                          <Stack direction="row" spacing={1} alignItems="center">
                            <TrendingUp fontSize="small" />
                            <Typography variant="caption">Ascendente</Typography>
                          </Stack>
                        </ToggleButton>
                        <ToggleButton value="desc">
                          <Stack direction="row" spacing={1} alignItems="center">
                            <TrendingDown fontSize="small" />
                            <Typography variant="caption">Descendente</Typography>
                          </Stack>
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </FormControl>

                    <Divider />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={showAdvancedFilters}
                          onChange={(e) => setShowAdvancedFilters(e.target.checked)}
                        />
                      }
                      label="Mostrar filtros de fecha"
                    />

                    {showAdvancedFilters && (
                      <Fade in={showAdvancedFilters}>
                        <Stack spacing={2}>
                          <TextField
                            type="date"
                            label="Desde"
                            value={dateRange.start}
                            onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                            size="small"
                            InputLabelProps={{ shrink: true }}
                          />
                          <TextField
                            type="date"
                            label="Hasta"
                            value={dateRange.end}
                            onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                            size="small"
                            InputLabelProps={{ shrink: true }}
                          />
                        </Stack>
                      </Fade>
                    )}

                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={clearFilters}
                      startIcon={<ClearIcon />}
                      sx={{ mt: 2 }}
                    >
                      Limpiar filtros
                    </Button>
                  </Stack>
                </Popover>

                <Tooltip title="Exportar a Excel">
                  <IconButton onClick={handleExportExcel} color="primary" disabled={filtered.length === 0}>
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Actualizar">
                  <IconButton onClick={fetchData} color="primary">
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>

                {projects.length > 0 && (
                  <>
                    <Divider orientation="vertical" flexItem />

                    <ToggleButtonGroup
                      value={view} exclusive size="small"
                      onChange={(_, v) => v && setView(v)}
                    >
                      <ToggleButton value="grid"><ViewModule /></ToggleButton>
                      <ToggleButton value="list"><ViewList /></ToggleButton>
                    </ToggleButtonGroup>
                  </>
                )}

                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleCreate}
                >
                  Nuevo Proyecto
                </Button>
              </Stack>
            </Stack>

            {/* Chips de filtros activos */}
            {activeFiltersCount > 0 && (
              <Fade in={true}>
                <Box display="flex" gap={1} mt={2} flexWrap="wrap">
                  {search && (
                    <Chip
                      label={`Búsqueda: "${search}"`}
                      onDelete={() => setSearch('')}
                      size="small"
                    />
                  )}
                  {filterGroup && (
                    <Chip
                      label={`Grupo: ${groups.find(g => g.id === filterGroup)?.name}`}
                      onDelete={() => setFilterGroup('')}
                      size="small"
                    />
                  )}
                  {filterStatus && (
                    <Chip
                      label={`Estado: ${ESTADOS.find(e => e.value === filterStatus)?.label}`}
                      onDelete={() => setFilterStatus('')}
                      size="small"
                    />
                  )}
                  {dateRange.start && (
                    <Chip
                      label={`Desde: ${new Date(dateRange.start).toLocaleDateString()}`}
                      onDelete={() => setDateRange({ ...dateRange, start: '' })}
                      size="small"
                    />
                  )}
                  {dateRange.end && (
                    <Chip
                      label={`Hasta: ${new Date(dateRange.end).toLocaleDateString()}`}
                      onDelete={() => setDateRange({ ...dateRange, end: '' })}
                      size="small"
                    />
                  )}
                  <Chip
                    label="Limpiar todo"
                    onDelete={clearFilters}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              </Fade>
            )}
          </Paper>
        )}

        {/* Resultados */}
        {filtered.length === 0 && projects.length === 0 && !error ? (
          <Fade in={true}>
            <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4 }}>
              <FolderOpen sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No tienes proyectos asignados
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                No perteneces a ningún grupo ni proyecto.
                Contacta con un administrador para que te asigne a un proyecto.
              </Typography>
              <Button variant="contained" startIcon={<Add />} onClick={handleCreate}>
                Crear proyecto (solo administradores)
              </Button>
            </Paper>
          </Fade>
        ) : filtered.length === 0 && activeFiltersCount > 0 ? (
          <Fade in={true}>
            <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4 }}>
              <FolderOpen sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No hay proyectos
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                No se encontraron proyectos con los filtros aplicados
              </Typography>
              <Button variant="outlined" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            </Paper>
          </Fade>
        ) : view === 'grid' ? (
          <Grid container spacing={3}>
            {filtered.map((p, index) => (
              <Zoom in={true} key={p.id} style={{ transitionDelay: `${index * 50}ms` }}>
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <Box sx={{ height: '100%' }}>
                    <ProjectCard
                      project={p}
                      onEdit={(e) => handleEdit(e, p)}
                      onDelete={(e) => handleDelete(e, p.id)}
                      onClick={() => navigate(`/projects/${p.id}`)}
                    />
                  </Box>
                </Grid>
              </Zoom>
            ))}
          </Grid>
        ) : (
          <Stack spacing={2}>
            {filtered.map((p, index) => (
              <Fade in={true} key={p.id} style={{ transitionDelay: `${index * 50}ms` }}>
                <Box>
                  <ProjectCard
                    project={p}
                    onEdit={(e) => handleEdit(e, p)}
                    onDelete={(e) => handleDelete(e, p.id)}
                    onClick={() => navigate(`/projects/${p.id}`)}
                  />
                </Box>
              </Fade>
            ))}
          </Stack>
        )}
      </Box>

      <ProjectForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={fetchData}
        project={selectedProject}
      />
    </Layout>
  );
}