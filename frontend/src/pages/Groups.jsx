import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton,
  Chip, TextField, CircularProgress, Avatar, Tooltip, Stack
} from '@mui/material';
import { Add, Edit, Delete, Group as GroupIcon, Search } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import GroupForm from '../components/groups/GroupForm';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/groups`, { headers });
      setGroups(res.data);
      setFiltered(res.data);
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
      (g.description || '').toLowerCase().includes(q)
    ));
  }, [search, groups]);

  const handleEdit = (e, group) => {
    e.stopPropagation();
    setSelectedGroup(group);
    setFormOpen(true);
  };

  const handleCreate = () => { setSelectedGroup(null); setFormOpen(true); };

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

  return (
    <Layout>
      <Box>
        {/* Cabecera */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <GroupIcon color="primary" fontSize="large" />
            <Typography variant="h5" fontWeight={600}>Grupos</Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={handleCreate}>
            Nuevo Grupo
          </Button>
        </Box>

        {/* Buscador */}
        <TextField
          placeholder="Buscar grupos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
          size="small"
          sx={{ mb: 2, width: 300 }}
        />

        {/* Tabla */}
        {loading ? (
          <Box display="flex" justifyContent="center" mt={6}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead sx={{ bgcolor: 'primary.main' }}>
                <TableRow>
                  {['Nombre', 'Descripción', 'Miembros', 'Creado', 'Acciones'].map(col => (
                    <TableCell key={col} sx={{ color: 'white', fontWeight: 600 }}>{col}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No hay grupos. ¡Crea el primero!
                    </TableCell>
                  </TableRow>
                ) : filtered.map(group => (
                  <TableRow
                    key={group.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/groups/${group.id}`)}
                  >
                    <TableCell>
                      <Typography
                        fontWeight={500}
                        sx={{ '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}
                      >
                        {group.name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', maxWidth: 250 }}>
                      {group.description || '—'}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {(group.members || []).slice(0, 3).map(m => (
                          <Tooltip key={m.id} title={m.email}>
                            <Chip
                              avatar={<Avatar sx={{ bgcolor: 'secondary.main' }}>{m.name?.[0]}</Avatar>}
                              label={m.name}
                              size="small"
                              variant="outlined"
                            />
                          </Tooltip>
                        ))}
                        {(group.members || []).length > 3 && (
                          <Chip label={`+${group.members.length - 3}`} size="small" />
                        )}
                        {(group.members || []).length === 0 && (
                          <Typography variant="caption" color="text.secondary">Sin miembros</Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {new Date(group.created_at).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={(e) => handleEdit(e, group)} color="primary" size="small">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={(e) => handleDelete(e, group.id)} color="error" size="small">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

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