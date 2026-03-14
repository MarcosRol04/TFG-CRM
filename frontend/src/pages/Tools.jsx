// frontend/src/pages/Tools.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Chip,
  Grid, Paper, Avatar, Fade, Zoom, Tooltip, IconButton,
  Divider, Stack, alpha, useTheme
} from '@mui/material';
import {
  Build as BuildIcon, TableChart as TableChartIcon,
  Star as StarIcon, StarBorder as StarBorderIcon,
  Refresh as RefreshIcon, ViewModule as GridIcon,
  ViewList as ListIcon, HowToVote as VoteIcon,
  NoteAlt as NoteAltIcon, Calculate as CalculateIcon,
} from '@mui/icons-material';
import Layout from '../components/Layout';

const toolList = [
  {
    id: 'notes',
    label: 'Notas',
    path: '/tools/notes',
    icon: <NoteAltIcon sx={{ fontSize: 40 }} />,
    color: '#1976d2',
    chipLabel: 'Colaborativo',
    chipColor: 'primary',
    desc: 'Crea y gestiona notas vinculadas a proyectos. Con colores, búsqueda y historial.',
    features: ['Tareas', 'Etiquetas', 'Búsqueda'],
    popular: true,
  },
  {
    id: 'calculator',
    label: 'Calculadora',
    path: '/tools/calculator',
    icon: <CalculateIcon sx={{ fontSize: 40 }} />,
    color: '#ed6c02',
    chipLabel: 'Utilidad',
    chipColor: 'warning',
    desc: 'Cálculos rápidos de costes, horas y presupuestos con historial guardado.',
    features: ['Historial', 'Fórmulas', 'Exportar'],
    popular: false,
  },
  {
    id: 'spreadsheet',
    label: 'Hoja de Cálculo',
    path: '/tools/spreadsheet',
    icon: <TableChartIcon sx={{ fontSize: 40 }} />,
    color: '#2e7d32',
    chipLabel: 'Excel',
    chipColor: 'success',
    desc: 'Crea hojas de cálculo con fórmulas, múltiples pestañas y exportación a XLSX/CSV.',
    features: ['Fórmulas', 'Pestañas', 'Exportar'],
    popular: true,
  },
  {
    id: 'polls',
    label: 'Encuestas',
    path: '/tools/polls',
    icon: <VoteIcon sx={{ fontSize: 40 }} />,
    color: '#9c27b0',
    chipLabel: 'Votaciones',
    chipColor: 'secondary',
    desc: 'Crea votaciones y consulta resultados en tiempo real.',
    features: ['Votación', 'Resultados', 'Tiempo real'],
    popular: false,
  },
];

export default function Tools() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [view, setView] = useState('grid');
  const [favorites, setFavorites] = useState(['notes', 'spreadsheet']);

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  return (
    <Layout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>

        {/* Header */}
        <Fade in timeout={500}>
          <Box mb={4}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{
                  width: 56, height: 56,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}>
                  <BuildIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">Herramientas</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Potencia tu flujo de trabajo con estas utilidades
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" gap={1}>
                <Tooltip title="Vista cuadrícula">
                  <IconButton onClick={() => setView('grid')} color={view === 'grid' ? 'primary' : 'default'}
                    sx={{ bgcolor: view === 'grid' ? alpha(theme.palette.primary.main, 0.1) : 'transparent' }}>
                    <GridIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Vista lista">
                  <IconButton onClick={() => setView('list')} color={view === 'list' ? 'primary' : 'default'}
                    sx={{ bgcolor: view === 'list' ? alpha(theme.palette.primary.main, 0.1) : 'transparent' }}>
                    <ListIcon />
                  </IconButton>
                </Tooltip>
                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                <Tooltip title="Actualizar">
                  <IconButton><RefreshIcon /></IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Paper sx={{
              p: 2, borderRadius: 3,
              bgcolor: alpha(theme.palette.primary.main, 0.02),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            }}>
              <Stack direction="row" spacing={4} justifyContent="center">
                <Box textAlign="center">
                  <Typography variant="h5" fontWeight="bold" color="primary.main">{toolList.length}</Typography>
                  <Typography variant="caption" color="text.secondary">Herramientas disponibles</Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h5" fontWeight="bold" color="warning.main">{favorites.length}</Typography>
                  <Typography variant="caption" color="text.secondary">Tus favoritas</Typography>
                </Box>
              </Stack>
            </Paper>
          </Box>
        </Fade>

        {/* Vista cuadrícula */}
        {view === 'grid' ? (
          <Grid container spacing={3}>
            {toolList.map((tool, index) => (
              <Zoom in key={tool.id} style={{ transitionDelay: `${index * 100}ms` }}>
                {/* ✅ Grid v2: size en vez de item+xs */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  {/* ✅ Click en Card, no en CardActionArea — evita button dentro de button */}
                  <Card
                    onClick={() => navigate(tool.path)}
                    sx={{
                      borderRadius: 4, height: '100%', cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      border: `1px solid ${alpha(tool.color, 0.2)}`,
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      position: 'relative', overflow: 'visible',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 20px 30px ${alpha(tool.color, 0.2)}`,
                      },
                    }}
                  >
                    {tool.popular && (
                      <Box sx={{
                        position: 'absolute', top: -10, right: 20,
                        bgcolor: 'error.main', color: 'white',
                        px: 1.5, py: 0.5, borderRadius: 2,
                        fontSize: '0.75rem', fontWeight: 'bold',
                        textTransform: 'uppercase', zIndex: 1,
                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                      }}>
                        ⭐ Popular
                      </Box>
                    )}

                    <CardContent sx={{ p: 3 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box sx={{
                          width: 70, height: 70, borderRadius: 3,
                          background: `linear-gradient(135deg, ${tool.color} 0%, ${alpha(tool.color, 0.7)} 100%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', boxShadow: `0 10px 20px ${alpha(tool.color, 0.3)}`,
                        }}>
                          {tool.icon}
                        </Box>

                        {/* ✅ stopPropagation evita que el click llegue a la Card */}
                        <Tooltip title={favorites.includes(tool.id) ? 'Quitar de favoritos' : 'Añadir a favoritos'}>
                          <IconButton
                            size="small"
                            onClick={(e) => toggleFavorite(tool.id, e)}
                            sx={{ color: favorites.includes(tool.id) ? 'warning.main' : 'text.disabled' }}
                          >
                            {favorites.includes(tool.id) ? <StarIcon /> : <StarBorderIcon />}
                          </IconButton>
                        </Tooltip>
                      </Box>

                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="h6" fontWeight="bold">{tool.label}</Typography>
                        <Chip label={tool.chipLabel} size="small" color={tool.chipColor}
                          sx={{ height: 22, '& .MuiChip-label': { px: 1, fontSize: '0.7rem', fontWeight: 600 } }}
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                        {tool.desc}
                      </Typography>

                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {tool.features.map(f => (
                          <Chip key={f} label={f} size="small" variant="outlined"
                            sx={{ fontSize: '0.7rem', borderColor: alpha(tool.color, 0.3), color: tool.color }}
                          />
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Zoom>
            ))}
          </Grid>
        ) : (
          /* Vista lista */
          <Stack spacing={2}>
            {toolList.map((tool, index) => (
              <Fade in key={tool.id} style={{ transitionDelay: `${index * 100}ms` }}>
                <Paper
                  onClick={() => navigate(tool.path)}
                  sx={{
                    p: 2, borderRadius: 3, cursor: 'pointer',
                    border: `1px solid ${alpha(tool.color, 0.2)}`,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateX(4px)',
                      boxShadow: `0 10px 20px ${alpha(tool.color, 0.15)}`,
                      borderColor: tool.color,
                    },
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box sx={{
                      width: 60, height: 60, borderRadius: 2,
                      bgcolor: alpha(tool.color, 0.1),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: tool.color,
                    }}>
                      {tool.icon}
                    </Box>

                    <Box flex={1}>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Typography variant="h6" fontWeight="bold">{tool.label}</Typography>
                        <Chip label={tool.chipLabel} size="small" color={tool.chipColor} sx={{ height: 22 }} />
                        {tool.popular && <Chip label="Popular" size="small" color="error" sx={{ height: 22 }} />}
                      </Box>
                      <Typography variant="body2" color="text.secondary">{tool.desc}</Typography>
                    </Box>

                    <IconButton
                      size="small"
                      onClick={(e) => toggleFavorite(tool.id, e)}
                      sx={{ color: favorites.includes(tool.id) ? 'warning.main' : 'text.disabled' }}
                    >
                      {favorites.includes(tool.id) ? <StarIcon /> : <StarBorderIcon />}
                    </IconButton>
                  </Box>
                </Paper>
              </Fade>
            ))}
          </Stack>
        )}

      </Box>
    </Layout>
  );
}