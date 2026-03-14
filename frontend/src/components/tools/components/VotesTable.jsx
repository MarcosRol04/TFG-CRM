// frontend/src/components/tools/components/VotesTable.jsx
import React from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, 
  TableCell, TableHead, TableRow, Avatar, Chip, Stack,
} from '@mui/material';
import { People as PeopleIcon } from '@mui/icons-material';
import { CHART_COLORS } from '../../../utils/pollConstants';

export default function VotesTable({ poll }) {
  if (poll.poll_votes?.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box textAlign="center" py={6}>
            <PeopleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">Nadie ha votado aún</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Agrupar votos por usuario
  const votesByUser = Object.values(
    (poll.poll_votes || []).reduce((acc, vote) => {
      const uid = vote.user_id;
      if (!acc[uid]) {
        acc[uid] = { 
          ...vote, 
          responses: [],
          user: vote.user 
        };
      }
      acc[uid].responses.push(vote.option_text || vote.text_response);
      return acc;
    }, {})
  );

  return (
    <Card>
      <CardContent sx={{ p: 0 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>Usuario</TableCell>
              <TableCell>Respuesta</TableCell>
              <TableCell>Fecha</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {votesByUser.map((vote, idx) => (
              <TableRow key={idx} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        fontSize: 14, 
                        bgcolor: CHART_COLORS[idx % CHART_COLORS.length] 
                      }}
                    >
                      {vote.user?.name?.[0]?.toUpperCase() || '?'}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {vote.user?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {vote.user?.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {vote.responses.map((r, i) => (
                      <Chip 
                        key={i} 
                        label={r} 
                        size="small" 
                        variant="outlined" 
                      />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(vote.voted_at).toLocaleString('es-ES', {
                      day: '2-digit', 
                      month: 'short', 
                      hour: '2-digit', 
                      minute: '2-digit',
                    })}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}