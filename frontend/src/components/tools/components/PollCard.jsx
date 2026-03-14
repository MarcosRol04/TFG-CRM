// frontend/src/components/tools/components/PollCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, CardContent, CardActions, Chip, Box, Typography,
  IconButton, Tooltip, Button, Stack,
} from '@mui/material';
import {
  HowToVote as VoteIcon,
  BarChart as ChartIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as DoneIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Folder as ProjectIcon,
  Public as AllIcon,
} from '@mui/icons-material';
import { POLL_TYPES, SHARE_TYPES, getPollStatus } from '../../../utils/pollConstants';

const SharedIcon = ({ type }) => {
  const icons = {
    group: GroupIcon,
    project: ProjectIcon,
    all: AllIcon,
  };
  const Icon = icons[type] || AllIcon;
  return <Icon fontSize="small" />;
};

const SharedLabel = ({ type }) => {
  const shareType = SHARE_TYPES.find(t => t.value === type);
  return shareType?.label.split(' ')[1] || 'Todos';
};

export default function PollCard({ poll, user, onDelete, onView, onEdit }) {
  const navigate = useNavigate();
  const { isExpired, isClosed } = getPollStatus(poll);
  const pollType = POLL_TYPES.find(t => t.value === poll.type);

  const handleCardClick = () => onView(poll.id);
  
  const handleActionClick = (e, action) => {
    e.stopPropagation();
    action();
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
        border: poll.user_has_voted ? '2px solid' : '1px solid',
        borderColor: poll.user_has_voted ? 'success.light' : 'divider',
      }}
      onClick={handleCardClick}
    >
      <CardContent sx={{ flex: 1 }}>
        <Stack direction="row" spacing={1} mb={1.5} flexWrap="wrap" useFlexGap>
          <Chip
            size="small"
            label={pollType?.shortLabel || poll.type}
            color={pollType?.color || 'primary'}
            variant="outlined"
          />
          <Chip
            size="small"
            icon={<SharedIcon type={poll.shared_with_type} />}
            label={<SharedLabel type={poll.shared_with_type} />}
            variant="outlined"
          />
          {poll.user_has_voted && (
            <Chip size="small" icon={<DoneIcon />} label="Votado" color="success" />
          )}
          {isClosed && (
            <Chip size="small" label="Cerrada" color="default" />
          )}
        </Stack>

        <Typography variant="h6" fontSize={15} fontWeight={600} mb={0.5} noWrap>
          {poll.title}
        </Typography>
        
        {poll.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            mb={1.5}
            sx={{ 
              overflow: 'hidden', 
              display: '-webkit-box', 
              WebkitLineClamp: 2, 
              WebkitBoxOrient: 'vertical' 
            }}
          >
            {poll.description}
          </Typography>
        )}

        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <VoteIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            {poll.total_votes} {poll.total_votes === 1 ? 'voto' : 'votos'}
          </Typography>
          {poll.poll_options?.length > 0 && (
            <>
              <Typography color="text.disabled">•</Typography>
              <Typography variant="body2" color="text.secondary">
                {poll.poll_options.length} opciones
              </Typography>
            </>
          )}
        </Box>

        {poll.deadline && (
          <Box display="flex" alignItems="center" gap={0.5}>
            <ScheduleIcon fontSize="small" color={isExpired ? 'error' : 'warning'} />
            <Typography variant="caption" color={isExpired ? 'error' : 'text.secondary'}>
              {isExpired ? 'Expiró: ' : 'Hasta: '}
              {new Date(poll.deadline).toLocaleDateString('es-ES', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </Typography>
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ px: 2, pt: 0, pb: 1.5, justifyContent: 'space-between' }}>
        <Button
          size="small"
          variant={poll.user_has_voted || isClosed ? 'outlined' : 'contained'}
          startIcon={poll.user_has_voted || isClosed ? <ChartIcon /> : <VoteIcon />}
          color={poll.user_has_voted ? 'success' : 'primary'}
          onClick={(e) => handleActionClick(e, () => onView(poll.id))}
        >
          {poll.user_has_voted ? 'Ver resultados' : isClosed ? 'Ver resultados' : 'Votar'}
        </Button>

        {['admin', 'manager'].includes(user.role) && poll.created_by === user.id && (
          <Box>
            <Tooltip title="Editar">
              <IconButton 
                size="small" 
                onClick={(e) => handleActionClick(e, () => onEdit(poll.id))}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar">
              <IconButton 
                size="small" 
                color="error" 
                onClick={(e) => handleActionClick(e, () => onDelete(poll.id))}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </CardActions>
    </Card>
  );
}