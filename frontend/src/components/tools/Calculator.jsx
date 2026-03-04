import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, IconButton,
  List, ListItem, ListItemText, Divider, Tooltip, Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import axios from 'axios';
import Layout from '../Layout';

const API   = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const token = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const BUTTONS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '⌫', '='],
];

const isOperator = (v) => ['÷', '×', '−', '+'].includes(v);

export default function Calculator() {
  const navigate = useNavigate();

  // Estado principal como objeto para tener siempre la versión actual en el ref
  const [calc, setCalc] = useState({
    display: '0',   // lo que se muestra en pantalla
    expr: '',       // expresión acumulada (ej: "3 + ")
    justCalc: false // flag: acaba de calcular un resultado
  });

  const [history, setHistory] = useState([]);
  const [alert, setAlert]     = useState(null);

  // Ref para acceder al estado actual desde el listener de teclado
  const calcRef = useRef(calc);
  useEffect(() => { calcRef.current = calc; }, [calc]);

  const loadHistory = async () => {
    try {
      const { data } = await axios.get(`${API}/calculator/history`, { headers: token() });
      setHistory(data);
    } catch {}
  };

  useEffect(() => { loadHistory(); }, []);

  // ── Lógica principal ────────────────────────────────────────────────────
  const handleBtn = (val) => {
    const { display, expr, justCalc } = calcRef.current;

    // Limpiar todo
    if (val === 'C') {
      setCalc({ display: '0', expr: '', justCalc: false });
      return;
    }

    // Borrar último dígito
    if (val === '⌫') {
      setCalc(c => ({ ...c, display: c.display.length > 1 ? c.display.slice(0, -1) : '0' }));
      return;
    }

    // Cambiar signo
    if (val === '±') {
      const n = parseFloat(display);
      if (!isNaN(n)) setCalc(c => ({ ...c, display: String(n * -1) }));
      return;
    }

    // Porcentaje
    if (val === '%') {
      const n = parseFloat(display);
      if (!isNaN(n)) setCalc(c => ({ ...c, display: String(n / 100) }));
      return;
    }

    // Igual — evaluar
    if (val === '=') {
      if (!expr) return;
      const fullExpr = expr + display;
      try {
        const sanitized = fullExpr
          .replace(/÷/g, '/')
          .replace(/×/g, '*')
          .replace(/−/g, '-');
        // eslint-disable-next-line no-new-func
        const result = new Function('return ' + sanitized)();
        if (!isFinite(result)) { setCalc(c => ({ ...c, display: 'Error', expr: '' })); return; }
        const resultStr = String(parseFloat(result.toFixed(10)));
        setCalc({ display: resultStr, expr: '', justCalc: true });
        axios.post(
          `${API}/calculator/history`,
          { expression: fullExpr + ' =', result: resultStr },
          { headers: token() }
        ).then(loadHistory).catch(() => {});
      } catch {
        setCalc(c => ({ ...c, display: 'Error', expr: '' }));
      }
      return;
    }

    // Operador
    if (isOperator(val)) {
      // Si acaba de calcular, usar el resultado como primer operando
      const leftSide = justCalc ? display : expr + display;
      setCalc({ display: '0', expr: leftSide + ' ' + val + ' ', justCalc: false });
      return;
    }

    // Punto decimal
    if (val === '.') {
      if (justCalc) { setCalc({ display: '0.', expr: '', justCalc: false }); return; }
      if (display.includes('.')) return; // ya tiene punto
      setCalc(c => ({ ...c, display: c.display + '.' }));
      return;
    }

    // Número
    if (justCalc) {
      // Después de calcular, empieza número nuevo
      setCalc({ display: val, expr: '', justCalc: false });
      return;
    }
    setCalc(c => ({ ...c, display: c.display === '0' ? val : c.display + val }));
  };

  // ── Teclado ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const keyMap = {
      '0':'0','1':'1','2':'2','3':'3','4':'4',
      '5':'5','6':'6','7':'7','8':'8','9':'9',
      '.':'.', ',':'.',
      '+':'+', '-':'−', '*':'×', '/':'÷',
      'Enter':'=', '=':'=',
      'Backspace':'⌫',
      'Escape':'C', 'Delete':'C',
      '%':'%',
    };

    const handleKeyDown = (e) => {
      const mapped = keyMap[e.key];
      if (mapped) { e.preventDefault(); handleBtn(mapped); }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // handleBtn lee siempre del ref, no necesita dependencias
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearHistory = async () => {
    try {
      await axios.delete(`${API}/calculator/history`, { headers: token() });
      setHistory([]);
      setAlert({ type: 'success', msg: 'Historial borrado.' });
    } catch {
      setAlert({ type: 'error', msg: 'Error al borrar el historial.' });
    }
  };

  const btnStyle = (val) => {
    const base = { height: 64, borderRadius: 2, fontSize: 18, fontWeight: 500, minWidth: 0, width: '100%' };
    if (val === '=')                  return { ...base, bgcolor: '#1976d2', color: '#fff', '&:hover': { bgcolor: '#1565c0' }, border: 'none' };
    if (isOperator(val))             return { ...base, bgcolor: '#e3f2fd', color: '#1976d2', border: 'none' };
    if (['C','±','%'].includes(val)) return { ...base, bgcolor: '#f5f5f5', color: '#424242', border: 'none' };
    return { ...base, bgcolor: '#fafafa', color: '#212121', border: '1px solid #e0e0e0' };
  };

  return (
    <Layout>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton onClick={() => navigate('/tools')} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight="bold">Calculadora</Typography>
        </Box>

        {alert && (
          <Alert severity={alert.type} onClose={() => setAlert(null)} sx={{ mb: 3 }}>
            {alert.msg}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'flex-start' }}>

          {/* Calculadora */}
          <Box sx={{ flex: '0 0 320px' }}>
            <Paper sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              {/* Pantalla */}
              <Box sx={{ bgcolor: '#212121', px: 3, py: 2, textAlign: 'right' }}>
                <Typography sx={{ color: '#9e9e9e', fontSize: 13, minHeight: 20 }}>
                  {calc.expr}
                </Typography>
                <Typography sx={{ color: '#fff', fontSize: 40, fontWeight: 300, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  {calc.display}
                </Typography>
              </Box>
              {/* Botones */}
              <Box sx={{ p: 2 }}>
                {BUTTONS.map((row, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    {row.map((btn) => (
                      <Box key={btn} sx={{ flex: btn === '0' ? 2 : 1 }}>
                        <Button variant="contained" disableElevation sx={btnStyle(btn)} onClick={() => handleBtn(btn)}>
                          {btn}
                        </Button>
                      </Box>
                    ))}
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>

          {/* Historial */}
          <Box sx={{ flex: '1 1 300px' }}>
            <Paper sx={{ borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
                <Typography fontWeight={600}>Historial</Typography>
                {history.length > 0 && (
                  <Tooltip title="Borrar historial">
                    <IconButton size="small" onClick={clearHistory} color="error">
                      <DeleteSweepIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              {history.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography variant="body2">Aún no hay operaciones.</Typography>
                </Box>
              ) : (
                <List dense sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {history.map((h, i) => (
                    <Box key={h.id}>
                      <ListItem
                        secondaryAction={<Typography fontWeight={600} color="primary">{h.result}</Typography>}
                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f9f9f9' } }}
                        onClick={() => { setCalc({ display: h.result, expr: '', justCalc: true }); }}
                      >
                        <ListItemText
                          primary={h.expression}
                          secondary={new Date(h.created_at).toLocaleString('es-ES')}
                          primaryTypographyProps={{ fontSize: 13, color: '#424242' }}
                          secondaryTypographyProps={{ fontSize: 11 }}
                        />
                      </ListItem>
                      {i < history.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              )}
            </Paper>
          </Box>

        </Box>
      </Box>
    </Layout>
  );
}