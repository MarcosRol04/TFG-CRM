import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, MenuItem, CircularProgress
} from '@mui/material';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ESTADOS = [
  { value: 'pendiente',    label: '⏳ Pendiente' },
  { value: 'en_progreso',  label: '🔄 En progreso' },
  { value: 'completado',   label: '✅ Completado' },
  { value: 'cancelado',    label: '❌ Cancelado' },
];

export default function ProjectForm({ open, onClose, onSaved, project }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [groupId, setGroupId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('pendiente');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!open) return;
    axios.get(`${API}/groups`, { headers })
      .then(res => setGroups(res.data))
      .catch(console.error);
  }, [open]);

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setDescription(project.description || '');
      setGroupId(project.group_id || '');
      setStartDate(project.start_date || '');
      setEndDate(project.end_date || '');
      setStatus(project.status || 'pendiente');
    } else {
      setName(''); setDescription(''); setGroupId('');
      setStartDate(''); setEndDate(''); setStatus('pendiente');
    }
  }, [project, open]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const payload = { name, description, group_id: groupId || null, start_date: startDate || null, end_date: endDate || null, status };
      if (project) {
        await axios.put(`${API}/projects/${project.id}`, payload, { headers });
      } else {
        await axios.post(`${API}/projects`, payload, { headers });
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{project ? 'Editar Proyecto' : 'Nuevo Proyecto'}</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField
            label="Nombre del proyecto"
            value={name}
            onChange={e => setName(e.target.value)}
            required fullWidth
          />
          <TextField
            label="Descripción"
            value={description}
            onChange={e => setDescription(e.target.value)}
            multiline rows={3} fullWidth
          />
          <TextField
            select label="Grupo" value={groupId}
            onChange={e => setGroupId(e.target.value)} fullWidth
          >
            <MenuItem value="">Sin grupo</MenuItem>
            {groups.map(g => (
              <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select label="Estado" value={status}
            onChange={e => setStatus(e.target.value)} fullWidth
          >
            {ESTADOS.map(e => (
              <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>
            ))}
          </TextField>
          <Box display="flex" gap={2}>
            <TextField
              label="Fecha inicio" type="date" value={startDate}
              onChange={e => setStartDate(e.target.value)}
              fullWidth InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Fecha fin" type="date" value={endDate}
              onChange={e => setEndDate(e.target.value)}
              fullWidth InputLabelProps={{ shrink: true }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : project ? 'Guardar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}