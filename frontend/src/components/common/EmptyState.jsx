// frontend/src/components/common/EmptyState.jsx
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import {
  HowToVote as VoteIcon,
  Poll as PollIcon,
  BarChart as ChartIcon,
  Group as GroupIcon,
} from '@mui/icons-material';

const iconMap = {
  VoteIcon,
  PollIcon,
  ChartIcon,
  GroupIcon,
  HowToVoteIcon: VoteIcon,
};

export default function EmptyState({ 
  icon = 'VoteIcon', 
  title = 'No hay elementos', 
  subtitle,
  action,
}) {
  const IconComponent = iconMap[icon] || VoteIcon;

  return (
    <Box textAlign="center" py={8}>
      <IconComponent sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
      <Typography color="text.secondary" variant="h6" gutterBottom>
        {title}
      </Typography>
      {subtitle && (
        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
          {subtitle}
        </Typography>
      )}
      {action && (
        <Button 
          variant="outlined" 
          startIcon={<IconComponent />} 
          sx={{ mt: 2 }}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </Box>
  );
}