import React, { useState, useEffect, useRef } from 'react';
import Layout from '../Layout';
import ShareDialog from './ShareDialog';
import {
  Box, Typography, Button, TextField, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Snackbar, Alert, Paper, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
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
      <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>

        {/* ── Cabecera ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h5" fontWeight="bold" sx={{ flexGrow: 1 }}>
            📊 {current ? current.name : 'Hoja de Cálculo'}
            {dirty && <Typography component="span" variant="caption" sx={{ ml: 1, color: '#f57c00' }}>● Sin guardar</Typography>}
          </Typography>

          <Button startIcon={<FolderOpenIcon />} variant="outlined" size="small" onClick={() => setOpenDialog(true)}>Abrir</Button>
          <Button startIcon={<CreateNewFolderIcon />} variant="outlined" size="small" onClick={() => setNewDialog(true)}>Nuevo</Button>

          {current && (
            <>
              <Button startIcon={<EditIcon />} variant="outlined" size="small" onClick={() => { setRenameName(current.name); setRenameDialog(true); }}>
                Renombrar
              </Button>
              <Button startIcon={<SaveIcon />} variant="contained" size="small" onClick={save} disabled={saving || !dirty}>
                {saving ? 'Guardando…' : 'Guardar'}
              </Button>
              <Button startIcon={<DownloadIcon />} variant="outlined" size="small" onClick={exportXLSX}>XLSX</Button>
              <Button startIcon={<DownloadIcon />} variant="outlined" size="small" onClick={exportCSV}>CSV</Button>
              <Button startIcon={<ShareIcon />} variant="outlined" size="small" color="secondary" onClick={() => setShareOpen(true)}>
                Compartir
              </Button>
            </>
          )}
        </Box>

        {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}

        {/* ── Pantalla vacía ── */}
        {!current && !loading && (
          <Paper sx={{ p: 6, textAlign: 'center', border: '1px solid #e0e0e0' }}>
            <Typography variant="h6" color="text.secondary" mb={2}>No hay ninguna hoja abierta</Typography>
            <Button variant="contained" startIcon={<CreateNewFolderIcon />} onClick={() => setNewDialog(true)} sx={{ mr: 1 }}>Crear nueva</Button>
            <Button variant="outlined" startIcon={<FolderOpenIcon />} onClick={() => setOpenDialog(true)}>Abrir existente</Button>
          </Paper>
        )}

        {/* ── Grilla ── */}
        {current && sheet && !loading && (
          <Paper sx={{ border: '1px solid #e0e0e0', overflow: 'hidden' }}>

            {/* Barra de fórmula */}
            <Box sx={{ display: 'flex', alignItems: 'center', p: 1, borderBottom: '1px solid #e0e0e0', bgcolor: '#fafafa', gap: 1 }}>
              <Box sx={{ minWidth: 56, px: 1, py: 0.5, bgcolor: '#e3f2fd', borderRadius: 1, textAlign: 'center', fontWeight: 'bold', fontSize: 13, border: '1px solid #90caf9' }}>
                {cellRef}
              </Box>
              <TextField
                size="small"
                fullWidth
                value={formulaBarValue}
                onChange={e => { setEditValue(e.target.value); if (!editing) setEditing(true); updateCell(selectedCell.r, selectedCell.c, e.target.value); }}
                placeholder="Valor o fórmula — ej: =SUM(A1:A10)"
                inputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }}
              />
            </Box>

            {/* Tabla */}
            <Box
              ref={gridRef}
              tabIndex={0}
              onKeyDown={handleGridKeyDown}
              sx={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 310px)', outline: 'none' }}
            >
              <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: COLS * 100 + 50 }}>
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
                        return (
                          <td
                            key={c}
                            onClick={() => handleCellClick(r, c)}
                            onDoubleClick={() => handleCellDoubleClick(r, c)}
                            style={{
                              border: sel ? '2px solid #1976d2' : '1px solid #ddd',
                              background: sel ? '#e3f2fd' : '#fff',
                              padding: 0,
                              minWidth: 100,
                              maxWidth: 100,
                              height: 26,
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
                                style={{ width: '100%', height: '100%', border: 'none', outline: 'none', padding: '0 4px', fontFamily: 'monospace', fontSize: 13, boxSizing: 'border-box' }}
                              />
                            ) : (
                              <span style={{ display: 'block', padding: '0 4px', fontSize: 13, lineHeight: '26px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', borderTop: '1px solid #e0e0e0', bgcolor: '#fafafa', px: 1, py: 0.5, overflowX: 'auto' }}>
              {current.sheets.map((sh, idx) => (
                <Box key={sh.id} sx={{ display: 'flex', alignItems: 'center', mr: 0.5 }}>
                  <Button
                    size="small"
                    variant={idx === activeSheet ? 'contained' : 'text'}
                    onClick={() => { commitEdit(); setActiveSheet(idx); setSelectedCell({ r: 0, c: 0 }); setEditing(false); }}
                    sx={{ minWidth: 70, textTransform: 'none', fontSize: 12, py: 0.3 }}
                  >
                    {sh.name}
                  </Button>
                  {current.sheets.length > 1 && (
                    <IconButton size="small" onClick={() => deleteSheet(idx)} sx={{ p: 0.2 }}>
                      <DeleteIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                  )}
                </Box>
              ))}
              <Tooltip title="Añadir hoja">
                <IconButton size="small" onClick={() => { setAddSheetName(`Hoja ${current.sheets.length + 1}`); setAddSheetDialog(true); }}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
        )}

        {/* Hint fórmulas */}
        {current && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', px: 0.5 }}>
            Fórmulas: <code>=SUM(A1:A10)</code> · <code>=AVG(B1:B5)</code> · <code>=MAX(C1:C10)</code> · <code>=MIN(D1:D5)</code>
          </Typography>
        )}

        {/* ── Dialogs ── */}

        {/* Nuevo */}
        <Dialog open={newDialog} onClose={() => setNewDialog(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Nueva hoja de cálculo</DialogTitle>
          <DialogContent>
            <TextField autoFocus fullWidth label="Nombre" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createNew()} sx={{ mt: 1 }} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNewDialog(false)}>Cancelar</Button>
            <Button variant="contained" onClick={createNew} disabled={saving || !newName.trim()}>Crear</Button>
          </DialogActions>
        </Dialog>

        {/* Abrir */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Abrir hoja de cálculo</DialogTitle>
          <DialogContent>
            {spreadsheets.length === 0
              ? <Typography color="text.secondary" sx={{ py: 2 }}>No hay hojas guardadas</Typography>
              : spreadsheets.map(sp => (
                  <Box key={sp.id} sx={{ display: 'flex', alignItems: 'center', py: 1, borderBottom: '1px solid #f0f0f0' }}>
                    <Box sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => loadSpreadsheet(sp.id)}>
                      <Typography fontWeight={500}>{sp.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{new Date(sp.updated_at).toLocaleString('es-ES')}</Typography>
                    </Box>
                    <IconButton size="small" color="error" onClick={() => deleteSpreadsheet(sp.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))
            }
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cerrar</Button>
          </DialogActions>
        </Dialog>

        {/* Renombrar */}
        <Dialog open={renameDialog} onClose={() => setRenameDialog(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Renombrar hoja</DialogTitle>
          <DialogContent>
            <TextField autoFocus fullWidth label="Nuevo nombre" value={renameName} onChange={e => setRenameName(e.target.value)} onKeyDown={e => e.key === 'Enter' && renameSpreadsheet()} sx={{ mt: 1 }} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRenameDialog(false)}>Cancelar</Button>
            <Button variant="contained" onClick={renameSpreadsheet}>Guardar</Button>
          </DialogActions>
        </Dialog>

        {/* Añadir pestaña */}
        <Dialog open={addSheetDialog} onClose={() => setAddSheetDialog(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Nueva pestaña</DialogTitle>
          <DialogContent>
            <TextField autoFocus fullWidth label="Nombre" value={addSheetName} onChange={e => setAddSheetName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSheet()} sx={{ mt: 1 }} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddSheetDialog(false)}>Cancelar</Button>
            <Button variant="contained" onClick={addSheet}>Añadir</Button>
          </DialogActions>
        </Dialog>

        {/* Compartir */}
        {current && (
          <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} itemType="spreadsheet" itemId={current.id} itemName={current.name} />
        )}

        <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity={snack.sev} variant="filled">{snack.msg}</Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
}

// ── Estilos tabla ──
const thCorner = { width: 44, minWidth: 44, background: '#f0f0f0', border: '1px solid #ddd', fontSize: 12 };
const thHeader = { width: 100, minWidth: 100, background: '#f0f0f0', border: '1px solid #ddd', fontSize: 12, fontWeight: 600, padding: '4px 2px', textAlign: 'center', color: '#333' };
const tdRow = { background: '#f0f0f0', border: '1px solid #ddd', fontSize: 11, textAlign: 'center', color: '#666', fontWeight: 500, padding: '0 4px', minWidth: 44, width: 44 };