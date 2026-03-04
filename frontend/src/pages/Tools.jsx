import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardActionArea, CardContent, Chip
} from '@mui/material';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import CalculateIcon from '@mui/icons-material/Calculate';
import BuildIcon from '@mui/icons-material/Build';
import Layout from '../components/Layout';

const toolList = [
  {
    id: 'notes',
    label: 'Notas',
    path: '/tools/notes',
    icon: <NoteAltIcon sx={{ fontSize: 40 }} />,
    color: '#1976d2',
    chipLabel: 'Colaborativo',
    desc: 'Crea y gestiona notas vinculadas a proyectos. Con colores, búsqueda y historial.',
  },
  {
    id: 'calculator',
    label: 'Calculadora',
    path: '/tools/calculator',
    icon: <CalculateIcon sx={{ fontSize: 40 }} />,
    color: '#ed6c02',
    chipLabel: 'Utilidad',
    desc: 'Cálculos rápidos de costes, horas y presupuestos con historial guardado.',
  },
];

export default function Tools() {
  const navigate = useNavigate();

  return (
    <Layout>
      <Box>
        {/* Header igual al de Grupos/Usuarios */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <BuildIcon sx={{ fontSize: 30, color: 'text.primary' }} />
            <Typography variant="h4" fontWeight="bold">Herramientas</Typography>
          </Box>
        </Box>

        {/* Cards */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {toolList.map((tool) => (
            <Box key={tool.id} sx={{ flex: '1 1 280px', maxWidth: 380 }}>
              <Card
                sx={{
                  borderRadius: 2,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  border: '1px solid #e0e0e0',
                  height: '100%',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  '&:hover': {
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardActionArea onClick={() => navigate(tool.path)} sx={{ height: '100%', alignItems: 'flex-start', p: 1 }}>
                  <CardContent>
                    <Box sx={{
                      width: 64, height: 64, borderRadius: 2,
                      bgcolor: `${tool.color}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: tool.color, mb: 2,
                    }}>
                      {tool.icon}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography fontWeight={600} fontSize={17}>{tool.label}</Typography>
                      <Chip
                        label={tool.chipLabel}
                        size="small"
                        sx={{ fontSize: 10, height: 20, bgcolor: `${tool.color}15`, color: tool.color, fontWeight: 600 }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                      {tool.desc}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Box>
          ))}
        </Box>
      </Box>
    </Layout>
  );
}