import React, { useState, useEffect, useRef } from 'react';
import Layout from '../Layout';
import ShareDialog from './ShareDialog';
import {
  Box, Typography, Button, TextField, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Snackbar, Alert, Paper, Tooltip, Chip,
  alpha, Fade, Zoom, Divider, Badge
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import TableChartIcon from '@mui/icons-material/TableChart';
import FunctionsIcon from '@mui/icons-material/Functions';
import TabIcon from '@mui/icons-material/Tab';
import * as XLSX from 'xlsx';

const API = 'http://localhost:5000/api';
const COLS = 10;
const ROWS = 20;
const COL_LETTERS = Array.from({ length: COLS }, (_, i) => String.fromCharCode(65 + i));

// ── Lógica de fórmulas ────────────────────────────────────────────────────────
function parseRange(range, data) {
  const match = range.match(/^([A-Z])(\d+):([A-Z])(\d+)$/i);
  if (!match) return null;
  const c1 = match[1].toUpperCase().charCodeAt(0) - 65;
  const r1 = parseInt(match[2]) - 1;
  const c2 = match[3].toUpperCase().charCodeAt(0) - 65;
  const r2 = parseInt(match[4]) - 1;
  const values = [];
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      const val = parseFloat(data[r]?.[c]);
      if (!isNaN(val)) values.push(val);
    }
  }
  return values;
}

function evalFormula(formula, data) {
  const f = formula.trim().toUpperCase();
  const sumM = f.match(/^SUM\(([A-Z]\d+:[A-Z]\d+)\)$/);
  const avgM = f.match(/^AVG\(([A-Z]\d+:[A-Z]\d+)\)$/);
  const maxM = f.match(/^MAX\(([A-Z]\d+:[A-Z]\d+)\)$/);
  const minM = f.match(/^MIN\(([A-Z]\d+:[A-Z]\d+)\)$/);
  if (sumM) { const v = parseRange(sumM[1], data); return v ? v.reduce((a, b) => a + b, 0) : '#ERROR'; }
  if (avgM) { const v = parseRange(avgM[1], data); return v?.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) : '#ERROR'; }
  if (maxM) { const v = parseRange(maxM[1], data); return v?.length ? Math.max(...v) : '#ERROR'; }
  if (minM) { const v = parseRange(minM[1], data); return v?.length ? Math.min(...v) : '#ERROR'; }
  return '#FORMULA?';
}

function getCellDisplay(value, data) {
  if (typeof value === 'string' && value.startsWith('=')) return String(evalFormula(value.slice(1), data));
  return value;
}

function emptySheet(name) {
  return { id: `sheet_${Date.now()}_${Math.random()}`, name: name || 'Hoja 1', data: Array.from({ length: ROWS }, () => Array(COLS).fill('')) };
}

// ── Componente ────────────────────────────────────────────────────────────────
export default function Spreadsheet() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const [spreadsheets, setSpreadsheets] = useState([]);
  const [current, setCurrent] = useState(null);
  const [activeSheet, setActiveSheet] = useState(0);
  const [selectedCell, setSelectedCell] = useState({ r: 0, c: 0 });
  const [editValue, setEditValue] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

  // Dialogs
  const [newDialog, setNewDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [renameDialog, setRenameDialog] = useState(false);
  const [renameName, setRenameName] = useState('');
  const [addSheetDialog, setAddSheetDialog] = useState(false);
  const [addSheetName, setAddSheetName] = useState('');
  const [shareOpen, setShareOpen] = useState(false);

  const inputRef = useRef(null);
  const gridRef = useRef(null);

  const showSnack = (msg, sev = 'success') => setSnack({ open: true, msg, sev });

  // Cargar lista inicial
  useEffect(() => {
    fetch(`${API}/spreadsheets`, { headers })
      .then(r => r.json())
      .then(d => setSpreadsheets(Array.isArray(d) ? d : []))
      .catch(() => showSnack('Error al cargar hojas', 'error'));
  }, []);

  const loadSpreadsheet = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/spreadsheets/${id}`, { headers });
      const data = await res.json();
      setCurrent(data);
      setActiveSheet(0);
      setSelectedCell({ r: 0, c: 0 });
      setEditing(false);
      setDirty(false);
      setOpenDialog(false);
    } catch { showSnack('Error al cargar', 'error'); }
    finally { setLoading(false); }
  };

  const createNew = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/spreadsheets`, { method: 'POST', headers, body: JSON.stringify({ name: newName.trim() }) });
      const data = await res.json();
      setSpreadsheets(prev => [data, ...prev]);
      setCurrent(data);
      setActiveSheet(0);
      setDirty(false);
      setNewDialog(false);
      setNewName('');
      showSnack('Hoja creada');
    } catch { showSnack('Error al crear', 'error'); }
    finally { setSaving(false); }
  };

  const save = async () => {
    if (!current) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/spreadsheets/${current.id}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ name: current.name, sheets: current.sheets })
      });
      const data = await res.json();
      setCurrent(data);
      setDirty(false);
      setSpreadsheets(prev => prev.map(s => s.id === data.id ? { ...s, name: data.name, updated_at: data.updated_at } : s));
      showSnack('Guardado correctamente');
    } catch { showSnack('Error al guardar', 'error'); }
    finally { setSaving(false); }
  };

  const deleteSpreadsheet = async (id) => {
    try {
      await fetch(`${API}/spreadsheets/${id}`, { method: 'DELETE', headers });
      setSpreadsheets(prev => prev.filter(s => s.id !== id));
      if (current?.id === id) { setCurrent(null); setDirty(false); }
      showSnack('Eliminado');
    } catch { showSnack('Error al eliminar', 'error'); }
  };

  // ── Hoja activa ──
  const sheet = current?.sheets?.[activeSheet];

  const updateCell = (r, c, value) => {
    setCurrent(prev => ({
      ...prev,
      sheets: prev.sheets.map((sh, idx) => idx !== activeSheet ? sh : {
        ...sh,
        data: sh.data.map((row, ri) => ri === r ? row.map((cell, ci) => ci === c ? value : cell) : row)
      })
    }));
    setDirty(true);
  };

  const commitEdit = () => {
    if (editing) { updateCell(selectedCell.r, selectedCell.c, editValue); setEditing(false); }
  };

  const handleCellClick = (r, c) => {
    if (editing) commitEdit();
    setSelectedCell({ r, c });
    setEditValue(sheet?.data?.[r]?.[c] || '');
    gridRef.current?.focus();
  };

  const handleCellDoubleClick = (r, c) => {
    setSelectedCell({ r, c });
    setEditValue(sheet?.data?.[r]?.[c] || '');
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const handleGridKeyDown = (e) => {
    const { r, c } = selectedCell;
    if (editing) {
      if (e.key === 'Enter') { commitEdit(); setSelectedCell({ r: Math.min(r + 1, ROWS - 1), c }); e.preventDefault(); }
      else if (e.key === 'Escape') { setEditing(false); setEditValue(sheet?.data?.[r]?.[c] || ''); }
      else if (e.key === 'Tab') { e.preventDefault(); commitEdit(); setSelectedCell({ r, c: Math.min(c + 1, COLS - 1) }); }
      return;
    }
    if (e.key === 'Enter' || e.key === 'F2') { setEditing(true); setTimeout(() => inputRef.current?.focus(), 30); e.preventDefault(); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { updateCell(r, c, ''); setEditValue(''); }
    else if (e.key === 'ArrowUp' && r > 0) setSelectedCell({ r: r - 1, c });
    else if (e.key === 'ArrowDown' && r < ROWS - 1) setSelectedCell({ r: r + 1, c });
    else if (e.key === 'ArrowLeft' && c > 0) setSelectedCell({ r, c: c - 1 });
    else if (e.key === 'ArrowRight' && c < COLS - 1) setSelectedCell({ r, c: c + 1 });
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      setEditValue(e.key);
      setEditing(true);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
  };

  // ── Hojas múltiples ──
  const addSheet = () => {
    if (!addSheetName.trim()) return;
    setCurrent(prev => ({ ...prev, sheets: [...prev.sheets, emptySheet(addSheetName.trim())] }));
    setActiveSheet(current.sheets.length);
    setDirty(true);
    setAddSheetDialog(false);
    setAddSheetName('');
  };

  const deleteSheet = (idx) => {
    if (current.sheets.length <= 1) { showSnack('Debe haber al menos una hoja', 'warning'); return; }
    setCurrent(prev => ({ ...prev, sheets: prev.sheets.filter((_, i) => i !== idx) }));
    setActiveSheet(Math.max(0, idx - 1));
    setDirty(true);
  };

  // ── Renombrar hoja de cálculo ──
  const renameSpreadsheet = () => {
    if (!renameName.trim()) return;
    setCurrent(prev => ({ ...prev, name: renameName.trim() }));
    setDirty(true);
    setRenameDialog(false);
    setRenameName('');
  };

  // ── Exportar ──
  const exportXLSX = () => {
    if (!current) return;
    const wb = XLSX.utils.book_new();
    current.sheets.forEach(sh => {
      const display = sh.data.map(row => row.map(cell => getCellDisplay(cell, sh.data)));
      const ws = XLSX.utils.aoa_to_sheet([COL_LETTERS, ...display]);
      XLSX.utils.book_append_sheet(wb, ws, sh.name);
    });
    XLSX.writeFile(wb, `${current.name}.xlsx`);
    showSnack('Exportado a XLSX');
  };

  const exportCSV = () => {
    if (!sheet) return;
    const rows = sheet.data.map(row => row.map(cell => getCellDisplay(cell, sheet.data)).join(','));
    const csv = [COL_LETTERS.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${current.name}_${sheet.name}.csv`;
    a.click();
    showSnack('Exportado a CSV');
  };

  // ── Barra fórmula ──
  const cellRef = `${COL_LETTERS[selectedCell.c]}${selectedCell.r + 1}`;
  const formulaBarValue = editing ? editValue : (sheet?.data?.[selectedCell.r]?.[selectedCell.c] || '');

  return (
    <Layout>
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
        py: 4
      }}>
        <Paper 
          elevation={0}
          sx={{ 
            maxWidth: 1400, 
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
            borderColor: 'divider'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TableChartIcon sx={{ fontSize: 32, color: '#2ecc71' }} />
                <Typography variant="h5" fontWeight="600" sx={{ 
                  background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {current ? current.name : 'Hoja de Cálculo'}
                </Typography>
                {dirty && (
                  <Chip
                    label="Sin guardar"
                    size="small"
                    sx={{ 
                      bgcolor: alpha('#f39c12', 0.1),
                      color: '#f39c12',
                      fontWeight: 500,
                      fontSize: 11,
                      height: 20
                    }}
                  />
                )}
              </Box>

              <Box sx={{ flexGrow: 1 }} />

              <Button 
                startIcon={<FolderOpenIcon />} 
                variant="outlined" 
                size="small" 
                onClick={() => setOpenDialog(true)}
                sx={{ 
                  borderRadius: 2,
                  borderColor: '#2ecc71',
                  color: '#2ecc71',
                  '&:hover': { borderColor: '#27ae60', bgcolor: alpha('#2ecc71', 0.04) }
                }}
              >
                Abrir
              </Button>
              <Button 
                startIcon={<CreateNewFolderIcon />} 
                variant="outlined" 
                size="small" 
                onClick={() => setNewDialog(true)}
                sx={{ 
                  borderRadius: 2,
                  borderColor: '#2ecc71',
                  color: '#2ecc71',
                  '&:hover': { borderColor: '#27ae60', bgcolor: alpha('#2ecc71', 0.04) }
                }}
              >
                Nuevo
              </Button>

              {current && (
                <>
                  <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                  
                  <Tooltip title="Renombrar">
                    <IconButton 
                      size="small" 
                      onClick={() => { setRenameName(current.name); setRenameDialog(true); }}
                      sx={{ color: '#2ecc71' }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Button 
                    startIcon={<SaveIcon />} 
                    variant="contained" 
                    size="small" 
                    onClick={save} 
                    disabled={saving || !dirty}
                    sx={{ 
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                      boxShadow: '0 4px 15px rgba(46, 204, 113, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
                        boxShadow: '0 6px 20px rgba(46, 204, 113, 0.4)',
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {saving ? 'Guardando…' : 'Guardar'}
                  </Button>
                  
                  <Tooltip title="Exportar XLSX">
                    <IconButton size="small" onClick={exportXLSX} sx={{ color: '#2ecc71' }}>
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Exportar CSV">
                    <IconButton size="small" onClick={exportCSV} sx={{ color: '#27ae60' }}>
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Button 
                    startIcon={<ShareIcon />} 
                    variant="outlined" 
                    size="small"
                    onClick={() => setShareOpen(true)}
                    sx={{ 
                      borderRadius: 2,
                      borderColor: '#2ecc71',
                      color: '#2ecc71',
                      '&:hover': { borderColor: '#27ae60', bgcolor: alpha('#2ecc71', 0.04) }
                    }}
                  >
                    Compartir
                  </Button>
                </>
              )}
            </Box>
          </Box>

          <Box sx={{ p: 3 }}>
            {loading && (
              <Fade in={loading}>
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress sx={{ color: '#2ecc71' }} />
                </Box>
              </Fade>
            )}

            {/* Pantalla vacía */}
            {!current && !loading && (
              <Fade in={!current}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 6, 
                    textAlign: 'center',
                    bgcolor: alpha('#2ecc71', 0.02),
                    borderRadius: 3,
                    border: '2px dashed',
                    borderColor: alpha('#2ecc71', 0.2)
                  }}
                >
                  <TableChartIcon sx={{ fontSize: 64, color: alpha('#2ecc71', 0.3), mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No hay ninguna hoja abierta
                  </Typography>
                  <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button 
                      variant="contained" 
                      startIcon={<CreateNewFolderIcon />} 
                      onClick={() => setNewDialog(true)}
                      sx={{ 
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                        '&:hover': { background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)' }
                      }}
                    >
                      Crear nueva
                    </Button>
                    <Button 
                      variant="outlined" 
                      startIcon={<FolderOpenIcon />} 
                      onClick={() => setOpenDialog(true)}
                      sx={{ 
                        borderRadius: 2,
                        borderColor: '#2ecc71',
                        color: '#2ecc71',
                        '&:hover': { borderColor: '#27ae60', bgcolor: alpha('#2ecc71', 0.04) }
                      }}
                    >
                      Abrir existente
                    </Button>
                  </Box>
                </Paper>
              </Fade>
            )}

            {/* Grilla */}
            {current && sheet && !loading && (
              <Fade in={!!current}>
                <Paper sx={{ 
                  border: '1px solid',
                  borderColor: alpha('#000', 0.08),
                  borderRadius: 2,
                  overflow: 'hidden'
                }}>

                  {/* Barra de fórmula */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    p: 1.5, 
                    borderBottom: '1px solid',
                    borderColor: alpha('#000', 0.08),
                    bgcolor: '#fafafa',
                    gap: 1
                  }}>
                    <Box sx={{ 
                      minWidth: 70, 
                      px: 1.5, 
                      py: 0.8, 
                      bgcolor: alpha('#2ecc71', 0.1), 
                      borderRadius: 2, 
                      textAlign: 'center', 
                      fontWeight: '600',
                      fontSize: 13, 
                      border: '1px solid',
                      borderColor: alpha('#2ecc71', 0.3),
                      color: '#2ecc71'
                    }}>
                      {cellRef}
                    </Box>
                    <TextField
                      size="small"
                      fullWidth
                      value={formulaBarValue}
                      onChange={e => { setEditValue(e.target.value); if (!editing) setEditing(true); updateCell(selectedCell.r, selectedCell.c, e.target.value); }}
                      placeholder="Valor o fórmula — ej: =SUM(A1:A10)"
                      InputProps={{
                        startAdornment: <FunctionsIcon sx={{ mr: 1, color: alpha('#2ecc71', 0.5), fontSize: 18 }} />,
                        sx: { 
                          fontFamily: 'monospace', 
                          fontSize: 13,
                          borderRadius: 2,
                          bgcolor: '#fff'
                        }
                      }}
                    />
                  </Box>

                  {/* Tabla */}
                  <Box
                    ref={gridRef}
                    tabIndex={0}
                    onKeyDown={handleGridKeyDown}
                    sx={{ 
                      overflowX: 'auto', 
                      overflowY: 'auto', 
                      maxHeight: 'calc(100vh - 380px)',
                      outline: 'none',
                      '&:focus': { outline: 'none' }
                    }}
                  >
                    <table style={{ 
                      borderCollapse: 'collapse', 
                      tableLayout: 'fixed', 
                      minWidth: COLS * 100 + 50,
                      fontFamily: 'monospace'
                    }}>
                      <thead>
                        <tr>
                          <th style={thCorner} />
                          {COL_LETTERS.map(l => <th key={l} style={thHeader}>{l}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {sheet.data.map((row, r) => (
                          <tr key={r}>
                            <td style={tdRow}>{r + 1}</td>
                            {row.map((cell, c) => {
                              const sel = selectedCell.r === r && selectedCell.c === c;
                              const display = getCellDisplay(cell, sheet.data);
                              const isFormula = typeof cell === 'string' && cell.startsWith('=');
                              return (
                                <td
                                  key={c}
                                  onClick={() => handleCellClick(r, c)}
                                  onDoubleClick={() => handleCellDoubleClick(r, c)}
                                  style={{
                                    border: sel ? '2px solid #2ecc71' : '1px solid #e0e0e0',
                                    background: sel ? alpha('#2ecc71', 0.04) : '#fff',
                                    padding: 0,
                                    minWidth: 100,
                                    maxWidth: 100,
                                    height: 28,
                                    overflow: 'hidden',
                                    position: 'relative'
                                  }}
                                >
                                  {sel && editing ? (
                                    <input
                                      ref={inputRef}
                                      value={editValue}
                                      onChange={e => setEditValue(e.target.value)}
                                      onBlur={commitEdit}
                                      onKeyDown={handleGridKeyDown}
                                      style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        border: '2px solid #2ecc71',
                                        outline: 'none', 
                                        padding: '0 6px', 
                                        fontFamily: 'monospace', 
                                        fontSize: 13, 
                                        boxSizing: 'border-box',
                                        borderRadius: 2
                                      }}
                                    />
                                  ) : (
                                    <span style={{ 
                                      display: 'block', 
                                      padding: '0 6px', 
                                      fontSize: 13, 
                                      lineHeight: '28px', 
                                      whiteSpace: 'nowrap', 
                                      overflow: 'hidden',
                                      color: isFormula ? '#2ecc71' : 'inherit',
                                      fontWeight: isFormula ? 500 : 400
                                    }}>
                                      {display}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>

                  {/* Pestañas de hojas */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    borderTop: '1px solid',
                    borderColor: alpha('#000', 0.08),
                    bgcolor: '#fafafa',
                    px: 1.5, 
                    py: 1, 
                    overflowX: 'auto'
                  }}>
                    {current.sheets.map((sh, idx) => (
                      <Zoom in={true} key={sh.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5 }}>
                          <Button
                            size="small"
                            variant={idx === activeSheet ? 'contained' : 'text'}
                            onClick={() => { commitEdit(); setActiveSheet(idx); setSelectedCell({ r: 0, c: 0 }); setEditing(false); }}
                            sx={{ 
                              minWidth: 80, 
                              textTransform: 'none', 
                              fontSize: 12, 
                              py: 0.5,
                              borderRadius: 2,
                              ...(idx === activeSheet && {
                                background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                                color: 'white',
                                '&:hover': { background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)' }
                              })
                            }}
                          >
                            <TabIcon sx={{ fontSize: 14, mr: 0.5 }} />
                            {sh.name}
                          </Button>
                          {current.sheets.length > 1 && (
                            <Tooltip title="Eliminar hoja" arrow>
                              <IconButton 
                                size="small" 
                                onClick={() => deleteSheet(idx)} 
                                sx={{ 
                                  p: 0.3,
                                  ml: 0.2,
                                  color: '#999',
                                  '&:hover': { color: '#e74c3c' }
                                }}
                              >
                                <DeleteIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </Zoom>
                    ))}
                    <Tooltip title="Añadir hoja" arrow>
                      <IconButton 
                        size="small" 
                        onClick={() => { setAddSheetName(`Hoja ${current.sheets.length + 1}`); setAddSheetDialog(true); }}
                        sx={{ 
                          ml: 0.5,
                          color: '#2ecc71',
                          '&:hover': { bgcolor: alpha('#2ecc71', 0.1) }
                        }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Paper>
              </Fade>
            )}

            {/* Hint fórmulas */}
            {current && (
              <Fade in={!!current}>
                <Box sx={{ 
                  mt: 2, 
                  px: 2, 
                  py: 1.5,
                  bgcolor: alpha('#2ecc71', 0.04),
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  flexWrap: 'wrap'
                }}>
                  <FunctionsIcon sx={{ color: '#2ecc71', fontSize: 20 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip 
                      label="=SUM(A1:A10)" 
                      size="small" 
                      variant="outlined" 
                      sx={{ 
                        fontSize: 11,
                        borderColor: alpha('#2ecc71', 0.3),
                        color: '#2ecc71'
                      }} 
                    />
                    <Chip 
                      label="=AVG(B1:B5)" 
                      size="small" 
                      variant="outlined" 
                      sx={{ 
                        fontSize: 11,
                        borderColor: alpha('#2ecc71', 0.3),
                        color: '#2ecc71'
                      }} 
                    />
                    <Chip 
                      label="=MAX(C1:C10)" 
                      size="small" 
                      variant="outlined" 
                      sx={{ 
                        fontSize: 11,
                        borderColor: alpha('#2ecc71', 0.3),
                        color: '#2ecc71'
                      }} 
                    />
                    <Chip 
                      label="=MIN(D1:D5)" 
                      size="small" 
                      variant="outlined" 
                      sx={{ 
                        fontSize: 11,
                        borderColor: alpha('#2ecc71', 0.3),
                        color: '#2ecc71'
                      }} 
                    />
                  </Typography>
                </Box>
              </Fade>
            )}

            {/* Dialogs */}

            {/* Nuevo */}
            <Dialog 
              open={newDialog} 
              onClose={() => setNewDialog(false)} 
              maxWidth="xs" 
              fullWidth
              TransitionComponent={Fade}
              PaperProps={{ sx: { borderRadius: 3 } }}
            >
              <DialogTitle sx={{ 
                borderBottom: '1px solid',
                borderColor: 'divider',
                pb: 2,
                background: 'linear-gradient(to right, #f8f9fa, #ffffff)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CreateNewFolderIcon sx={{ color: '#2ecc71' }} />
                  <Typography variant="h6" fontWeight="600">Nueva hoja de cálculo</Typography>
                </Box>
              </DialogTitle>
              <DialogContent sx={{ pt: 3 }}>
                <TextField 
                  autoFocus 
                  fullWidth 
                  label="Nombre" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && createNew()}
                  sx={{ 
                    '& .MuiOutlinedInput-root': { 
                      borderRadius: 2,
                      '&.Mui-focused fieldset': { borderColor: '#2ecc71' }
                    },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#2ecc71' }
                  }}
                />
              </DialogContent>
              <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button onClick={() => setNewDialog(false)} sx={{ borderRadius: 2 }}>Cancelar</Button>
                <Button 
                  variant="contained" 
                  onClick={createNew} 
                  disabled={saving || !newName.trim()}
                  sx={{ 
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                    '&:hover': { background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)' }
                  }}
                >
                  Crear
                </Button>
              </DialogActions>
            </Dialog>

            {/* Abrir */}
            <Dialog 
              open={openDialog} 
              onClose={() => setOpenDialog(false)} 
              maxWidth="sm" 
              fullWidth
              TransitionComponent={Fade}
              PaperProps={{ sx: { borderRadius: 3 } }}
            >
              <DialogTitle sx={{ 
                borderBottom: '1px solid',
                borderColor: 'divider',
                pb: 2,
                background: 'linear-gradient(to right, #f8f9fa, #ffffff)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FolderOpenIcon sx={{ color: '#2ecc71' }} />
                  <Typography variant="h6" fontWeight="600">Abrir hoja de cálculo</Typography>
                </Box>
              </DialogTitle>
              <DialogContent sx={{ pt: 2 }}>
                {spreadsheets.length === 0
                  ? <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>No hay hojas guardadas</Typography>
                  : spreadsheets.map(sp => (
                      <Zoom in={true} key={sp.id}>
                        <Paper
                          elevation={0}
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            py: 1.5, 
                            px: 2,
                            mb: 1,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: alpha('#000', 0.08),
                            transition: 'all 0.2s ease',
                            '&:hover': { 
                              borderColor: '#2ecc71',
                              bgcolor: alpha('#2ecc71', 0.02)
                            }
                          }}
                        >
                          <Box 
                            sx={{ flexGrow: 1, cursor: 'pointer' }} 
                            onClick={() => loadSpreadsheet(sp.id)}
                          >
                            <Typography fontWeight={500} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <TableChartIcon sx={{ fontSize: 18, color: '#2ecc71' }} />
                              {sp.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(sp.updated_at).toLocaleString('es-ES', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                              })}
                            </Typography>
                          </Box>
                          <Tooltip title="Eliminar">
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => deleteSpreadsheet(sp.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Paper>
                      </Zoom>
                    ))
                }
              </DialogContent>
              <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button onClick={() => setOpenDialog(false)} sx={{ borderRadius: 2 }}>Cerrar</Button>
              </DialogActions>
            </Dialog>

            {/* Renombrar */}
            <Dialog 
              open={renameDialog} 
              onClose={() => setRenameDialog(false)} 
              maxWidth="xs" 
              fullWidth
              TransitionComponent={Fade}
              PaperProps={{ sx: { borderRadius: 3 } }}
            >
              <DialogTitle sx={{ 
                borderBottom: '1px solid',
                borderColor: 'divider',
                pb: 2,
                background: 'linear-gradient(to right, #f8f9fa, #ffffff)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EditIcon sx={{ color: '#2ecc71' }} />
                  <Typography variant="h6" fontWeight="600">Renombrar hoja</Typography>
                </Box>
              </DialogTitle>
              <DialogContent sx={{ pt: 3 }}>
                <TextField 
                  autoFocus 
                  fullWidth 
                  label="Nuevo nombre" 
                  value={renameName} 
                  onChange={e => setRenameName(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && renameSpreadsheet()}
                  sx={{ 
                    '& .MuiOutlinedInput-root': { 
                      borderRadius: 2,
                      '&.Mui-focused fieldset': { borderColor: '#2ecc71' }
                    },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#2ecc71' }
                  }}
                />
              </DialogContent>
              <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button onClick={() => setRenameDialog(false)} sx={{ borderRadius: 2 }}>Cancelar</Button>
                <Button 
                  variant="contained" 
                  onClick={renameSpreadsheet}
                  sx={{ 
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                    '&:hover': { background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)' }
                  }}
                >
                  Guardar
                </Button>
              </DialogActions>
            </Dialog>

            {/* Añadir pestaña */}
            <Dialog 
              open={addSheetDialog} 
              onClose={() => setAddSheetDialog(false)} 
              maxWidth="xs" 
              fullWidth
              TransitionComponent={Fade}
              PaperProps={{ sx: { borderRadius: 3 } }}
            >
              <DialogTitle sx={{ 
                borderBottom: '1px solid',
                borderColor: 'divider',
                pb: 2,
                background: 'linear-gradient(to right, #f8f9fa, #ffffff)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AddIcon sx={{ color: '#2ecc71' }} />
                  <Typography variant="h6" fontWeight="600">Nueva pestaña</Typography>
                </Box>
              </DialogTitle>
              <DialogContent sx={{ pt: 3 }}>
                <TextField 
                  autoFocus 
                  fullWidth 
                  label="Nombre de la pestaña" 
                  value={addSheetName} 
                  onChange={e => setAddSheetName(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && addSheet()}
                  sx={{ 
                    '& .MuiOutlinedInput-root': { 
                      borderRadius: 2,
                      '&.Mui-focused fieldset': { borderColor: '#2ecc71' }
                    },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#2ecc71' }
                  }}
                />
              </DialogContent>
              <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button onClick={() => setAddSheetDialog(false)} sx={{ borderRadius: 2 }}>Cancelar</Button>
                <Button 
                  variant="contained" 
                  onClick={addSheet}
                  sx={{ 
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                    '&:hover': { background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)' }
                  }}
                >
                  Añadir
                </Button>
              </DialogActions>
            </Dialog>

            {/* Compartir */}
            {current && (
              <ShareDialog 
                open={shareOpen} 
                onClose={() => setShareOpen(false)} 
                itemType="spreadsheet" 
                itemId={current.id} 
                itemName={current.name} 
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
                  boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                  bgcolor: snack.sev === 'success' ? '#2ecc71' : undefined
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

// ── Estilos tabla ──
const thCorner = { 
  width: 44, 
  minWidth: 44, 
  background: '#f8f9fa', 
  border: '1px solid #e0e0e0', 
  fontSize: 12,
  fontWeight: 600,
  color: '#666',
  position: 'sticky',
  left: 0,
  zIndex: 2
};

const thHeader = { 
  width: 100, 
  minWidth: 100, 
  background: '#f8f9fa', 
  border: '1px solid #e0e0e0', 
  fontSize: 12, 
  fontWeight: 600, 
  padding: '6px 2px', 
  textAlign: 'center', 
  color: '#2ecc71',
  position: 'sticky',
  top: 0,
  zIndex: 1
};

const tdRow = { 
  background: '#f8f9fa', 
  border: '1px solid #e0e0e0', 
  fontSize: 11, 
  textAlign: 'center', 
  color: '#666', 
  fontWeight: 500, 
  padding: '0 4px', 
  minWidth: 44, 
  width: 44,
  position: 'sticky',
  left: 0,
  zIndex: 1
};