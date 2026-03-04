import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, MenuItem,
  Grid, CircularProgress, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { Add, ViewModule, ViewList, FolderOpen } from '@mui/icons-material';
import axios from 'axios';
import Layout from '../components/Layout';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectForm from '../components/projects/ProjectForm';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ESTADOS = [
  { value: '', label: 'Todos' },
  { value: 'pendiente',   label: '⏳ Pendiente' },
  { value: 'en_progreso', label: '🔄 En progreso' },
  { value: 'completado',  label: '✅ Completado' },
  { value: 'cancelado',   label: '❌ Cancelado' },
];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [view, setView] = useState('grid');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, groupRes] = await Promise.all([
        axios.get(`${API}/projects`, { headers }),
        axios.get(`${API}/groups`, { headers }),
      ]);
      setProjects(projRes.data);
      setFiltered(projRes.data);
      setGroups(groupRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    let result = projects;
    if (search) result = result.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase())
    );
    if (filterGroup) result = result.filter(p => p.group_id === filterGroup);
    if (filterStatus) result = result.filter(p => p.status === filterStatus);
    setFiltered(result);
  }, [search, filterGroup, filterStatus, projects]);

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

  return (
    <Layout>
      <Box>
        {/* Cabecera */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <FolderOpen color="primary" fontSize="large" />
            <Typography variant="h5" fontWeight={600}>Proyectos</Typography>
          </Box>
          <Box display="flex" gap={1} alignItems="center">
            <ToggleButtonGroup
              value={view} exclusive size="small"
              onChange={(_, v) => v && setView(v)}
            >
              <ToggleButton value="grid"><ViewModule /></ToggleButton>
              <ToggleButton value="list"><ViewList /></ToggleButton>
            </ToggleButtonGroup>
            <Button variant="contained" startIcon={<Add />} onClick={handleCreate}>
              Nuevo Proyecto
            </Button>
          </Box>
        </Box>

        {/* Filtros */}
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <TextField
            placeholder="Buscar proyectos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small" sx={{ minWidth: 220 }}
          />
          <TextField
            select label="Grupo" value={filterGroup}
            onChange={e => setFilterGroup(e.target.value)}
            size="small" sx={{ minWidth: 160 }}
          >
            <MenuItem value="">Todos los grupos</MenuItem>
            {groups.map(g => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
          </TextField>
          <TextField
            select label="Estado" value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            size="small" sx={{ minWidth: 160 }}
          >
            {ESTADOS.map(e => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
          </TextField>
        </Box>

        {/* Contenido */}
        {loading ? (
          <Box display="flex" justifyContent="center" mt={6}><CircularProgress /></Box>
        ) : filtered.length === 0 ? (
          <Box textAlign="center" mt={8}>
            <FolderOpen sx={{ fontSize: 64, color: 'text.disabled' }} />
            <Typography color="text.secondary" mt={1}>No hay proyectos. ¡Crea el primero!</Typography>
          </Box>
        ) : view === 'grid' ? (
          <Grid container spacing={2}>
            {filtered.map(p => (
              <Grid item xs={12} sm={6} md={4} key={p.id}>
                <ProjectCard
                  project={p}
                  onEdit={(e) => handleEdit(e, p)}
                  onDelete={(e) => handleDelete(e, p.id)}
                  onClick={() => navigate(`/projects/${p.id}`)}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box display="flex" flexDirection="column" gap={1.5}>
            {filtered.map(p => (
              <ProjectCard
                key={p.id}
                project={p}
                onEdit={(e) => handleEdit(e, p)}
                onDelete={(e) => handleDelete(e, p.id)}
                onClick={() => navigate(`/projects/${p.id}`)}
              />
            ))}
          </Box>
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