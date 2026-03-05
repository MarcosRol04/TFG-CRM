// frontend/src/components/projects/ProjectCard.jsx
import { Box, Typography, Chip, IconButton, Tooltip, LinearProgress } from '@mui/material';
import { Edit, Delete, CalendarToday, Group } from '@mui/icons-material';

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
        bgcolor: 'white',
        borderRadius: 3,
        p: 2.5,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 16px rgba(0,0,0,0.12)'
        },
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        width: '100%',
        maxWidth: 320,
        minWidth: 280,
        height: 250,              // ← ALTURA FIJA para TODAS las tarjetas
        mx: 'auto',
      }}
    >
      {/* Cabecera - altura fija */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="flex-start"
        sx={{ height: 48 }}        // ← Altura fija para la cabecera
      >
        <Typography 
          variant="subtitle1" 
          fontWeight={700} 
          sx={{ 
            flex: 1, 
            mr: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,      // ← Máximo 2 líneas
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.3
          }}
        >
          {project.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
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

      {/* Descripción - altura fija de 40px (2 líneas) */}
      <Box sx={{ height: 40 }}>      {/* ← Contenedor con altura fija */}
        {project.description ? (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              height: '100%',         // ← Ocupa toda la altura del contenedor
            }}
          >
            {project.description}
          </Typography>
        ) : (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              color: 'transparent'     // ← Invisible pero mantiene la altura
            }}
          >
            -
          </Typography>
        )}
      </Box>

      {/* Estado + progreso - altura fija */}
      <Box sx={{ height: 52 }}>        {/* ← Contenedor con altura fija */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
          <Chip 
            label={config.label} 
            color={config.color} 
            size="small"
            sx={{ minWidth: 100 }}
          />
          <Typography variant="caption" color="text.secondary">
            {config.progress}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={config.progress}
          color={config.color}
          sx={{ borderRadius: 1, height: 6 }}
        />
      </Box>

      {/* Grupo - altura fija */}
      <Box sx={{ height: 24 }}>        {/* ← Contenedor con altura fija */}
        {project.groups ? (
          <Box display="flex" alignItems="center" gap={0.5} sx={{ height: '100%' }}>
            <Group sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }} />
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {project.groups.name}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ height: '100%' }} /> // ← Espacio vacío
        )}
      </Box>

      {/* Fechas - altura fija */}
      <Box sx={{ height: 24 }}>        {/* ← Contenedor con altura fija */}
        {(project.start_date || project.end_date) ? (
          <Box display="flex" alignItems="center" gap={0.5} sx={{ height: '100%' }}>
            <CalendarToday sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }} />
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {formatDate(project.start_date)}
              {project.end_date && ` → ${formatDate(project.end_date)}`}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ height: '100%' }} /> // ← Espacio vacío
        )}
      </Box>
    </Box>
  );
}