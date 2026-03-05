import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../Layout';
import ShareDialog from './ShareDialog';
import {
  Box, Typography, Button, IconButton, Paper,
  List, ListItem, ListItemText, Divider,
  Snackbar, Alert, Tooltip, CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';
import BackspaceIcon from '@mui/icons-material/Backspace';

const API = 'http://localhost:5000/api';

const BUTTONS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '⌫', '='],
];

const isOperator = (v) => ['÷', '×', '−', '+'].includes(v);

export default function Calculator() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });
  const [shareItem, setShareItem] = useState(null);

  const showSnack = (msg, sev = 'success') => setSnack({ open: true, msg, sev });

  useEffect(() => {
    fetch(`${API}/calculator/history`, { headers })
      .then(r => r.json())
      .then(d => setHistory(Array.isArray(d) ? d : []))
      .catch(() => showSnack('Error al cargar historial', 'error'))
      .finally(() => setLoadingHistory(false));
  }, []);

  const saveToHistory = async (expr, result) => {
    try {
      const res = await fetch(`${API}/calculator/history`, {
        method: 'POST', headers,
        body: JSON.stringify({ expression: expr, result: String(result) })
      });
      const saved = await res.json();
      setHistory(prev => [saved, ...prev].slice(0, 50));
    } catch { /* silencioso */ }
  };

  const handleInput = useCallback((value) => {
    if (value === 'C') {
      setDisplay('0');
      setExpression('');
      setWaitingForOperand(false);
      return;
    }

    if (value === '⌫') {
      if (display.length > 1) setDisplay(d => d.slice(0, -1));
      else setDisplay('0');
      return;
    }

    if (value === '±') {
      setDisplay(d => d.startsWith('-') ? d.slice(1) : '-' + d);
      return;
    }

    if (value === '%') {
      const num = parseFloat(display);
      if (!isNaN(num)) setDisplay(String(num / 100));
      return;
    }

    if (isOperator(value)) {
      setExpression(display + ' ' + value + ' ');
      setWaitingForOperand(true);
      return;
    }

    if (value === '=') {
      if (!expression) return;
      try {
        const expr = expression + display;
        const normalized = expr.replace(/÷/g, '/').replace(/×/g, '*').replace(/−/g, '-');
        // eslint-disable-next-line no-new-func
        const result = Function('"use strict"; return (' + normalized + ')')();
        const rounded = parseFloat(result.toFixed(10));
        setDisplay(String(rounded));
        setExpression('');
        setWaitingForOperand(false);
        saveToHistory(expr, rounded);
      } catch {
        setDisplay('Error');
        setExpression('');
        setWaitingForOperand(false);
      }
      return;
    }

    if (value === '.') {
      if (waitingForOperand) { setDisplay('0.'); setWaitingForOperand(false); return; }
      if (!display.includes('.')) setDisplay(d => d + '.');
      return;
    }

    // Número
    if (waitingForOperand) {
      setDisplay(value);
      setWaitingForOperand(false);
    } else {
      setDisplay(d => d === '0' ? value : d + value);
    }
  }, [display, expression, waitingForOperand]);

  // Teclado físico
  useEffect(() => {
    const map = { '/': '÷', '*': '×', '-': '−', '+': '+', 'Enter': '=', 'Backspace': '⌫', 'Escape': 'C', '.': '.' };
    const handleKey = (e) => {
      const mapped = map[e.key] || (e.key >= '0' && e.key <= '9' ? e.key : null);
      if (mapped) { e.preventDefault(); handleInput(mapped); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleInput]);

  const deleteHistoryItem = async (id) => {
    try {
      await fetch(`${API}/calculator/history/${id}`, { method: 'DELETE', headers });
      setHistory(prev => prev.filter(h => h.id !== id));
      showSnack('Eliminado del historial');
    } catch { showSnack('Error al eliminar', 'error'); }
  };

  const loadFromHistory = (item) => {
    setDisplay(String(item.result));
    setExpression('');
    setWaitingForOperand(false);
  };

  const getBtnStyle = (value) => {
    if (value === '=') return { bgcolor: '#1976d2', color: '#fff', '&:hover': { bgcolor: '#1565c0' } };
    if (isOperator(value)) return { bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 'bold', '&:hover': { bgcolor: '#bbdefb' } };
    if (['C', '±', '%'].includes(value)) return { bgcolor: '#f5f5f5', color: '#555', '&:hover': { bgcolor: '#e0e0e0' } };
    return { bgcolor: '#fff', color: '#222', '&:hover': { bgcolor: '#f5f5f5' } };
  };

  return (
    <Layout>
      <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
        <Typography variant="h5" fontWeight="bold" mb={3}>🔢 Calculadora</Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>

          {/* Calculadora */}
          <Paper sx={{ border: '1px solid #e0e0e0', p: 2, width: 300, flexShrink: 0 }}>

            {/* Display */}
            <Box sx={{ bgcolor: '#1a1a2e', borderRadius: 1, p: 2, mb: 2, minHeight: 80, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
              <Typography variant="caption" sx={{ color: '#888', mb: 0.5, fontFamily: 'monospace', minHeight: 18 }}>
                {expression}
              </Typography>
              <Typography variant="h4" sx={{ color: '#fff', fontFamily: 'monospace', wordBreak: 'break-all', textAlign: 'right' }}>
                {display}
              </Typography>
            </Box>

            {/* Botones */}
            {BUTTONS.map((row, ri) => (
              <Box key={ri} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                {row.map(btn => (
                  <Button
                    key={btn}
                    variant="outlined"
                    onClick={() => handleInput(btn)}
                    sx={{
                      flex: btn === '0' ? 2 : 1,
                      minWidth: 0,
                      fontSize: 18,
                      fontWeight: 500,
                      py: 1.5,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      ...getBtnStyle(btn)
                    }}
                  >
                    {btn === '⌫' ? <BackspaceIcon fontSize="small" /> : btn}
                  </Button>
                ))}
              </Box>
            ))}
          </Paper>

          {/* Historial */}
          <Paper sx={{ border: '1px solid #e0e0e0', flex: 1, minWidth: 260, maxHeight: 460, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle1" fontWeight="bold">Historial</Typography>
            </Box>

            {loadingHistory && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>}

            {!loadingHistory && history.length === 0 && (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary" variant="body2">Sin operaciones todavía</Typography>
              </Box>
            )}

            <List sx={{ overflowY: 'auto', flex: 1, p: 0 }}>
              {history.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <ListItem
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f9f9f9' }, py: 0.5 }}
                    onClick={() => loadFromHistory(item)}
                    secondaryAction={
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Compartir">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setShareItem(item); }}>
                            <ShareIcon fontSize="small" sx={{ color: '#1976d2' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.id); }}>
                            <DeleteIcon fontSize="small" sx={{ color: '#d32f2f' }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#555' }}>
                          {item.expression}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ fontFamily: 'monospace', color: '#1976d2' }}>
                          = {item.result}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {idx < history.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>

            {history.length > 0 && (
              <Box sx={{ p: 1, borderTop: '1px solid #e0e0e0', textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary">{history.length} operaciones guardadas</Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Share dialog */}
        {shareItem && (
          <ShareDialog
            open={!!shareItem}
            onClose={() => setShareItem(null)}
            itemType="calculator"
            itemId={shareItem.id}
            itemName={`${shareItem.expression} = ${shareItem.result}`}
          />
        )}

        <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity={snack.sev} variant="filled">{snack.msg}</Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
}