import { Box, Typography, Chip, IconButton, Tooltip, LinearProgress } from '@mui/material';
import { Edit, Delete, CalendarToday, Group } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  pendiente:   { label: '⏳ Pendiente',   color: 'warning', progress: 0   },
  en_progreso: { label: '🔄 En progreso', color: 'info',    progress: 50  },
  completado:  { label: '✅ Completado',  color: 'success', progress: 100 },
  cancelado:   { label: '❌ Cancelado',   color: 'error',   progress: 0   },
};

export default function ProjectCard({ project, onEdit, onDelete, onClick }) {
  const config = STATUS_CONFIG[project.status] || STATUS_CONFIG.pendiente;
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-ES') : null;

  return (
    <Box
      onClick={onClick}
      sx={{
        bgcolor: 'white', borderRadius: 3, p: 2.5,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(0,0,0,0.12)' },
        display: 'flex', flexDirection: 'column', gap: 1.5
      }}
    >
      {/* Cabecera */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1, mr: 1 }}>
          {project.name}
        </Typography>
        <Box>
          <Tooltip title="Editar">
            <IconButton size="small" color="primary" onClick={onEdit}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton size="small" color="error" onClick={onDelete}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Descripción */}
      {project.description && (
        <Typography variant="body2" color="text.secondary" sx={{
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {project.description}
        </Typography>
      )}

      {/* Estado + progreso */}
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
          <Chip label={config.label} color={config.color} size="small" />
          <Typography variant="caption" color="text.secondary">{config.progress}%</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={config.progress}
          color={config.color}
          sx={{ borderRadius: 1, height: 6 }}
        />
      </Box>

      {/* Grupo */}
      {project.groups && (
        <Box display="flex" alignItems="center" gap={0.5}>
          <Group sx={{ fontSize: 14, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">{project.groups.name}</Typography>
        </Box>
      )}

      {/* Fechas */}
      {(project.start_date || project.end_date) && (
        <Box display="flex" alignItems="center" gap={0.5}>
          <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            {formatDate(project.start_date)}{project.end_date && ` → ${formatDate(project.end_date)}`}
          </Typography>
        </Box>
      )}
    </Box>
  );
}