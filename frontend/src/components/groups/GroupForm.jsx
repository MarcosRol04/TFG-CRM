import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Chip, MenuItem, Select,
  InputLabel, FormControl, OutlinedInput, CircularProgress
} from '@mui/material';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function GroupForm({ open, onClose, onSaved, group }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [memberIds, setMemberIds] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar usuarios disponibles
  useEffect(() => {
    if (!open) return;
    const token = localStorage.getItem('token');
    axios.get(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setAllUsers(res.data))
      .catch(console.error);
  }, [open]);

  // Si es edición, rellenar formulario
  useEffect(() => {
    if (group) {
      setName(group.name || '');
      setDescription(group.description || '');
      setMemberIds((group.members || []).map(m => m.id));
    } else {
      setName(''); setDescription(''); setMemberIds([]);
    }
  }, [group, open]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    try {
      if (group) {
        await axios.put(`${API}/groups/${group.id}`, { name, description, memberIds }, { headers });
      } else {
        await axios.post(`${API}/groups`, { name, description, memberIds }, { headers });
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
      <DialogTitle>{group ? 'Editar Grupo' : 'Nuevo Grupo'}</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField
            label="Nombre del grupo"
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
          <FormControl fullWidth>
            <InputLabel>Miembros</InputLabel>
            <Select
              multiple
              value={memberIds}
              onChange={e => setMemberIds(e.target.value)}
              input={<OutlinedInput label="Miembros" />}
              renderValue={(selected) => (
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {selected.map(id => {
                    const u = allUsers.find(u => u.id === id);
                    return <Chip key={id} label={u?.name || id} size="small" />;
                  })}
                </Box>
              )}
            >
              {allUsers.map(user => (
                <MenuItem key={user.id} value={user.id}>{user.name} — {user.email}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : group ? 'Guardar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}