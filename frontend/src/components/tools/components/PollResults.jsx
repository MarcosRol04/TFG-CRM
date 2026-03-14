// frontend/src/components/tools/components/PollResults.jsx
import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Stack, LinearProgress,
  Table, TableBody, TableCell, TableHead, TableRow, Avatar,
} from '@mui/material';
import {
  People as PeopleIcon,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { CHART_COLORS } from '../../../utils/pollConstants';

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text 
      x={x} y={y} 
      fill="white" 
      textAnchor="middle" 
      dominantBaseline="central" 
      fontSize={13} 
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function PollResults({ poll }) {
  const [chartType, setChartType] = useState('bar');

  if (poll.type === 'text') {
    return (
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} mb={3}>
            Respuestas de texto — {poll.total_voters} {poll.total_voters === 1 ? 'participante' : 'participantes'}
          </Typography>
          
          {poll.poll_votes?.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={3}>
              Aún no hay respuestas
            </Typography>
          ) : (
            poll.poll_votes?.map((vote, idx) => (
              <Box 
                key={idx} 
                sx={{ 
                  p: 1.5, mb: 1, 
                  bgcolor: 'grey.50', 
                  borderRadius: 1, 
                  borderLeft: '3px solid', 
                  borderLeftColor: 'primary.main' 
                }}
              >
                <Typography variant="body2">{vote.text_response}</Typography>
                <Typography variant="caption" color="text.secondary">
                  — {vote.user?.name} · {new Date(vote.voted_at).toLocaleString('es-ES')}
                </Typography>
              </Box>
            ))
          )}
        </CardContent>
      </Card>
    );
  }

  const chartData = (poll.poll_options || []).map(opt => ({
    name: opt.option_text.length > 20 ? opt.option_text.slice(0, 20) + '…' : opt.option_text,
    fullName: opt.option_text,
    votos: opt.vote_count || 0,
    porcentaje: opt.percentage || 0,
  }));

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="subtitle1" fontWeight={600}>
            Resultados — {poll.total_voters} {poll.total_voters === 1 ? 'participante' : 'participantes'}
          </Typography>
          
          <Stack direction="row" spacing={1}>
            <Chip 
              label="Barras" 
              size="small" 
              clickable
              color={chartType === 'bar' ? 'primary' : 'default'}
              onClick={() => setChartType('bar')} 
            />
            <Chip 
              label="Pastel" 
              size="small" 
              clickable
              color={chartType === 'pie' ? 'primary' : 'default'}
              onClick={() => setChartType('pie')} 
            />
          </Stack>
        </Box>

        <Box mb={3}>
          {poll.poll_options?.map((opt, idx) => (
            <Box key={opt.id} mb={2}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" fontWeight={500}>{opt.option_text}</Typography>
                <Typography variant="body2" color="primary" fontWeight={600}>
                  {opt.vote_count} {opt.vote_count === 1 ? 'voto' : 'votos'} · {opt.percentage}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate" 
                value={opt.percentage}
                sx={{
                  height: 10, 
                  borderRadius: 5,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': { bgcolor: CHART_COLORS[idx % CHART_COLORS.length] },
                }}
              />
            </Box>
          ))}
        </Box>

        {poll.total_voters > 0 && (
          <Box height={280}>
            {chartType === 'bar' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-25} 
                    textAnchor="end" 
                    interval={0} 
                    fontSize={12} 
                  />
                  <YAxis allowDecimals={false} />
                  <ReTooltip
                    formatter={(value, name, props) => [
                      `${value} votos (${props.payload.porcentaje}%)`,
                      props.payload.fullName,
                    ]}
                  />
                  <Bar dataKey="votos" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData} 
                    dataKey="votos" 
                    nameKey="fullName"
                    cx="50%" 
                    cy="50%" 
                    outerRadius={100}
                    labelLine={false} 
                    label={CustomPieLabel}
                  >
                    {chartData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip formatter={(value, name) => [`${value} votos`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}