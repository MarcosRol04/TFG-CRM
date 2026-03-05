// frontend/src/components/groups/GroupForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Chip, MenuItem, Select,
  InputLabel, FormControl, OutlinedInput, CircularProgress,
  Alert, Typography  // ← IMPORTANTE: Añadido Typography
} from '@mui/material';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function GroupForm({ open, onClose, onSaved, group }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [memberIds, setMemberIds] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Referencia para saber si el componente está montado
  const isMounted = useRef(true);

  // Controlar montaje/desmontaje
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Cargar usuarios disponibles
  useEffect(() => {
    if (!open) return;

    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/users`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        
        // Solo actualizar si el componente sigue montado
        if (isMounted.current) {
          setAllUsers(response.data);
        }
      } catch (err) {
        console.error('Error cargando usuarios:', err);
        if (isMounted.current) {
          setError('Error al cargar los usuarios');
        }
      }
    };

    fetchUsers();
  }, [open]);

  // Si es edición, rellenar formulario
  useEffect(() => {
    if (group) {
      setName(group.name || '');
      setDescription(group.description || '');
      setMemberIds((group.members || []).map(m => m.id));
    } else {
      setName(''); 
      setDescription(''); 
      setMemberIds([]);
    }
    setError(null); // Limpiar errores al abrir
  }, [group, open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('El nombre del grupo es obligatorio');
      return;
    }

    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      let response;
      if (group) {
        response = await axios.put(`${API}/groups/${group.id}`, 
          { name, description, memberIds }, 
          { headers }
        );
      } else {
        response = await axios.post(`${API}/groups`, 
          { name, description, memberIds }, 
          { headers }
        );
      }

      // Solo continuar si el componente sigue montado
      if (isMounted.current) {
        onSaved(response.data);
        // Pequeño delay para evitar problemas con el cierre
        setTimeout(() => {
          if (isMounted.current) {
            onClose();
          }
        }, 100);
      }
    } catch (err) {
      console.error('Error guardando grupo:', err);
      if (isMounted.current) {
        setError(err.response?.data?.error || 'Error al guardar el grupo');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleClose = () => {
    // No cerrar mientras se está guardando
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      fullWidth 
      maxWidth="sm"
      disableEscapeKeyDown={loading} // Evitar cerrar con ESC mientras guarda
    >
      <DialogTitle sx={{ pb: 1 }}>
        {group ? 'Editar Grupo' : 'Nuevo Grupo'}
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField
            label="Nombre del grupo"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            fullWidth
            disabled={loading}
            error={!name.trim() && error?.includes('nombre')}
            helperText={!name.trim() && error?.includes('nombre') ? 'El nombre es obligatorio' : ''}
          />
          
          <TextField
            label="Descripción"
            value={description}
            onChange={e => setDescription(e.target.value)}
            multiline
            rows={3}
            fullWidth
            disabled={loading}
          />
          
          <FormControl fullWidth disabled={loading}>
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
                    return u ? (
                      <Chip 
                        key={id} 
                        label={u.name} 
                        size="small"
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    ) : null;
                  })}
                </Box>
              )}
            >
              {allUsers.length === 0 ? (
                <MenuItem disabled>Cargando usuarios...</MenuItem>
              ) : (
                allUsers.map(user => (
                  <MenuItem key={user.id} value={user.id}>
                    <Box display="flex" flexDirection="column">
                      <Typography variant="body2">{user.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || !name.trim()}
        >
          {loading ? <CircularProgress size={24} /> : (group ? 'Guardar' : 'Crear')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}