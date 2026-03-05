import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, FormControl, InputLabel,
  Select, MenuItem, CircularProgress, Alert, Chip
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import GroupIcon from '@mui/icons-material/Group';
import FolderIcon from '@mui/icons-material/Folder';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const itemTypeLabel = { note: '📝 Nota', calculator: '🔢 Cálculo', spreadsheet: '📊 Hoja' };

export default function ShareDialog({ open, onClose, itemType, itemId, itemName }) {
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const [targetType, setTargetType] = useState('project');
  const [targetId, setTargetId] = useState('');
  const [groups, setGroups] = useState([]);
  const [projects, setProjects] = useState([]);
  const [existing, setExisting] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setSuccess('');
    setTargetId('');

    axios.get(`${API}/groups`, { headers }).then(r => setGroups(r.data)).catch(() => {});
    axios.get(`${API}/projects`, { headers }).then(r => setProjects(r.data)).catch(() => {});

    if (itemId) {
      axios.get(`${API}/shared-items/check`, { headers, params: { item_type: itemType, item_id: itemId } })
        .then(r => setExisting(r.data))
        .catch(() => {});
    }
  }, [open, itemType, itemId]);

  const targets = targetType === 'group' ? groups : projects;

  const handleShare = async () => {
    if (!targetId) { setError('Selecciona un destino'); return; }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await axios.post(`${API}/shared-items`,
        { item_type: itemType, item_id: itemId, target_type: targetType, target_id: targetId },
        { headers }
      );
      setSuccess('¡Compartido correctamente!');
      setExisting(prev => [...prev, { id: data.id, target_type: targetType, target_id: targetId }]);
      setTargetId('');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al compartir');
    } finally {
      setLoading(false);
    }
  };

  const handleUnshare = async (shareId) => {
    try {
      await axios.delete(`${API}/shared-items/${shareId}`, { headers });
      setExisting(prev => prev.filter(e => e.id !== shareId));
    } catch {
      setError('Error al dejar de compartir');
    }
  };

  const getTargetName = (type, id) => {
    const list = type === 'group' ? groups : projects;
    return list.find(t => t.id === id)?.name || id;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ShareIcon color="primary" />
        Compartir {itemTypeLabel[itemType] || itemType}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          <strong>{itemName}</strong> aparecerá en la sección "Archivos" del destino elegido.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 1 }}>{success}</Alert>}

        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Tipo</InputLabel>
            <Select value={targetType} label="Tipo" onChange={e => { setTargetType(e.target.value); setTargetId(''); }}>
              <MenuItem value="project">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><FolderIcon fontSize="small" /> Proyecto</Box>
              </MenuItem>
              <MenuItem value="group">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><GroupIcon fontSize="small" /> Grupo</Box>
              </MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>{targetType === 'group' ? 'Grupo' : 'Proyecto'}</InputLabel>
            <Select value={targetId} label={targetType === 'group' ? 'Grupo' : 'Proyecto'} onChange={e => setTargetId(e.target.value)}>
              {targets.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            onClick={handleShare}
            disabled={loading || !targetId}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ShareIcon />}
          >
            Compartir
          </Button>
        </Box>

        {existing.length > 0 && (
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
              Compartido actualmente con:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {existing.map(e => (
                <Chip
                  key={e.id}
                  size="small"
                  icon={e.target_type === 'group' ? <GroupIcon /> : <FolderIcon />}
                  label={getTargetName(e.target_type, e.target_id)}
                  onDelete={() => handleUnshare(e.id)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}