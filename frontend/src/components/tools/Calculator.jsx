import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../Layout';
import ShareDialog from './ShareDialog';
import {
  Box, Typography, Button, IconButton, Paper,
  List, ListItem, ListItemText, Divider,
  Snackbar, Alert, Tooltip, CircularProgress, alpha,
  Fade, Zoom, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';
import BackspaceIcon from '@mui/icons-material/Backspace';
import HistoryIcon from '@mui/icons-material/History';
import CalculateIcon from '@mui/icons-material/Calculate';
import KeyboardIcon from '@mui/icons-material/Keyboard';

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
    if (value === '=') return { 
      bgcolor: '#667eea', 
      color: '#fff', 
      '&:hover': { bgcolor: '#5a6fd6', transform: 'scale(0.98)' } 
    };
    if (isOperator(value)) return { 
      bgcolor: alpha('#667eea', 0.1), 
      color: '#667eea', 
      fontWeight: 'bold',
      '&:hover': { bgcolor: alpha('#667eea', 0.2), transform: 'scale(0.98)' } 
    };
    if (['C', '±', '%'].includes(value)) return { 
      bgcolor: '#f5f5f5', 
      color: '#666',
      '&:hover': { bgcolor: '#e0e0e0', transform: 'scale(0.98)' } 
    };
    return { 
      bgcolor: '#fff', 
      color: '#333',
      '&:hover': { bgcolor: '#f5f5f5', transform: 'scale(0.98)' } 
    };
  };

  return (
    <Layout>
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4
      }}>
        <Paper 
          elevation={0}
          sx={{ 
            maxWidth: 1200, 
            mx: 'auto', 
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: 'background.default'
          }}
        >
          {/* Header */}
          <Box sx={{ 
            p: 3, 
            background: 'linear-gradient(to right, #f8f9fa, #ffffff)',
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <CalculateIcon sx={{ fontSize: 32, color: '#667eea' }} />
            <Typography variant="h5" fontWeight="600" sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              flexGrow: 1
            }}>
              Calculadora Científica
            </Typography>
            <Chip
              icon={<KeyboardIcon />}
              label="Teclado físico soportado"
              size="small"
              sx={{ 
                bgcolor: alpha('#667eea', 0.1),
                color: '#667eea',
                '& .MuiChip-icon': { color: '#667eea' }
              }}
            />
          </Box>

          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>

              {/* Calculadora */}
              <Paper 
                elevation={0}
                sx={{ 
                  width: 340, 
                  flexShrink: 0,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: alpha('#000', 0.08),
                  overflow: 'hidden'
                }}
              >
                {/* Display */}
                <Box sx={{ 
                  bgcolor: '#1a1f36', 
                  p: 2.5,
                  background: 'linear-gradient(145deg, #1a1f36 0%, #14182c 100%)'
                }}>
                  <Typography variant="caption" sx={{ 
                    color: alpha('#fff', 0.5), 
                    mb: 0.5, 
                    fontFamily: 'monospace',
                    fontSize: 14,
                    display: 'block',
                    textAlign: 'right'
                  }}>
                    {expression || ' '}
                  </Typography>
                  <Typography variant="h3" sx={{ 
                    color: '#fff', 
                    fontFamily: 'monospace', 
                    wordBreak: 'break-all', 
                    textAlign: 'right',
                    fontWeight: 300,
                    letterSpacing: 2,
                    lineHeight: 1.2
                  }}>
                    {display}
                  </Typography>
                </Box>

                {/* Botones */}
                <Box sx={{ p: 2 }}>
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
                            fontSize: 20,
                            fontWeight: 500,
                            py: 1.8,
                            border: '1px solid',
                            borderColor: alpha('#000', 0.08),
                            borderRadius: 2,
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                            ...getBtnStyle(btn)
                          }}
                        >
                          {btn === '⌫' ? <BackspaceIcon fontSize="small" /> : btn}
                        </Button>
                      ))}
                    </Box>
                  ))}
                </Box>
              </Paper>

              {/* Historial */}
              <Paper 
                elevation={0}
                sx={{ 
                  flex: 1, 
                  minWidth: 300,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: alpha('#000', 0.08),
                  display: 'flex',
                  flexDirection: 'column',
                  height: 500,
                  overflow: 'hidden'
                }}
              >
                <Box sx={{ 
                  p: 2.5, 
                  borderBottom: '1px solid',
                  borderColor: alpha('#000', 0.08),
                  background: 'linear-gradient(to right, #f8f9fa, #ffffff)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <HistoryIcon sx={{ color: '#667eea' }} />
                  <Typography variant="subtitle1" fontWeight="600" sx={{ flexGrow: 1 }}>
                    Historial de operaciones
                  </Typography>
                  {!loadingHistory && history.length > 0 && (
                    <Chip
                      label={`${history.length} items`}
                      size="small"
                      sx={{ 
                        bgcolor: alpha('#667eea', 0.1),
                        color: '#667eea',
                        fontSize: 12
                      }}
                    />
                  )}
                </Box>

                {loadingHistory && (
                  <Fade in={loadingHistory}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                      <CircularProgress size={32} sx={{ color: '#667eea' }} />
                    </Box>
                  </Fade>
                )}

                {!loadingHistory && history.length === 0 && (
                  <Fade in={!loadingHistory}>
                    <Box sx={{ 
                      p: 4, 
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <HistoryIcon sx={{ fontSize: 48, color: alpha('#667eea', 0.2) }} />
                      <Typography color="text.secondary" variant="body2">
                        Sin operaciones todavía
                      </Typography>
                      <Typography color="text.secondary" variant="caption" sx={{ maxWidth: 200 }}>
                        Realiza cálculos y aparecerán aquí automáticamente
                      </Typography>
                    </Box>
                  </Fade>
                )}

                {!loadingHistory && history.length > 0 && (
                  <List sx={{ 
                    overflowY: 'auto', 
                    flex: 1, 
                    p: 0,
                    '&::-webkit-scrollbar': {
                      width: 6,
                    },
                    '&::-webkit-scrollbar-track': {
                      background: '#f1f1f1',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#888',
                      borderRadius: 3,
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      background: '#555',
                    },
                  }}>
                    {history.map((item, idx) => (
                      <Zoom in={true} style={{ transitionDelay: `${idx * 30}ms` }} key={item.id}>
                        <div>
                          <ListItem
                            sx={{ 
                              cursor: 'pointer', 
                              transition: 'all 0.2s ease',
                              '&:hover': { 
                                bgcolor: alpha('#667eea', 0.04),
                                transform: 'translateX(4px)'
                              },
                              py: 1.5,
                              px: 2
                            }}
                            onClick={() => loadFromHistory(item)}
                            secondaryAction={
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Tooltip title="Compartir" arrow placement="left">
                                  <IconButton 
                                    size="small" 
                                    onClick={(e) => { e.stopPropagation(); setShareItem(item); }}
                                    sx={{ 
                                      color: '#667eea',
                                      '&:hover': { bgcolor: alpha('#667eea', 0.1) }
                                    }}
                                  >
                                    <ShareIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Eliminar" arrow placement="right">
                                  <IconButton 
                                    size="small" 
                                    onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.id); }}
                                    sx={{ 
                                      color: '#d32f2f',
                                      '&:hover': { bgcolor: alpha('#d32f2f', 0.1) }
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            }
                          >
                            <ListItemText
                              primary={
                                <Typography variant="body2" sx={{ 
                                  fontFamily: 'monospace', 
                                  color: '#666',
                                  fontSize: 14,
                                  mb: 0.5
                                }}>
                                  {item.expression}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="h6" sx={{ 
                                  fontFamily: 'monospace', 
                                  fontWeight: 600,
                                  color: '#667eea',
                                  fontSize: 18
                                }}>
                                  = {item.result}
                                </Typography>
                              }
                            />
                          </ListItem>
                          {idx < history.length - 1 && (
                            <Divider sx={{ borderColor: alpha('#000', 0.06) }} />
                          )}
                        </div>
                      </Zoom>
                    ))}
                  </List>
                )}

                {history.length > 0 && (
                  <Box sx={{ 
                    p: 1.5, 
                    borderTop: '1px solid',
                    borderColor: alpha('#000', 0.08),
                    textAlign: 'right',
                    bgcolor: '#fafafa'
                  }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>
                      {history.length} operaciones guardadas • Click en cualquier item para cargarlo
                    </Typography>
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

            <Snackbar 
              open={snack.open} 
              autoHideDuration={3000} 
              onClose={() => setSnack(p => ({ ...p, open: false }))} 
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              TransitionComponent={Fade}
            >
              <Alert 
                severity={snack.sev} 
                variant="filled"
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
                }}
              >
                {snack.msg}
              </Alert>
            </Snackbar>
          </Box>
        </Paper>
      </Box>
    </Layout>
  );
}