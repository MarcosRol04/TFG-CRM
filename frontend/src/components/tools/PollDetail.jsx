// frontend/src/components/tools/PollDetail.jsx
import React, { useState, useEffect, useCallback } from 'react'; // 👈 IMPORTANTE: Importar React y hooks
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../Layout'; // 👈 Importar Layout
import {
  Box, Typography, Button, Card, CardContent, Chip, IconButton,
  RadioGroup, FormControlLabel, Radio, Checkbox, TextField,
  Alert, CircularProgress, Stack, Tabs, Tab, Tooltip, Paper,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  HowToVote as VoteIcon,
  CheckCircle as DoneIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  Share as ShareIcon,
  BarChart as ChartIcon,
} from '@mui/icons-material';
import { usePolls } from '../../hooks/usePolls'; // 👈 Importar el hook

const POLL_TYPES = {
  single: { label: 'Opción única', color: 'primary' },
  multiple: { label: 'Opción múltiple', color: 'secondary' },
  text: { label: 'Texto libre', color: 'success' },
};

const isClosed = (poll) => !poll?.is_active || (poll?.deadline && new Date(poll.deadline) < new Date());

export default function PollDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, error, setError, user, fetchPoll, vote } = usePolls(); // 👈 Eliminado exportPoll si no se usa
  
  const [poll, setPoll] = useState(null);
  const [voting, setVoting] = useState(false);
  const [success, setSuccess] = useState('');
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [textResponse, setTextResponse] = useState('');
  const [tab, setTab] = useState(0);

  const loadPoll = useCallback(async () => {
    const data = await fetchPoll(id);
    setPoll(data);
  }, [id, fetchPoll]);

  useEffect(() => { loadPoll(); }, [loadPoll]);

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/tools/polls/${poll?.id}`);
    setSuccess('¡Enlace copiado!');
    setTimeout(() => setSuccess(''), 2000);
  };

  if (!poll && !loading) {
    return (
      <Layout>
        <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5">Encuesta no encontrada</Typography>
            <Button variant="contained" onClick={() => navigate('/tools/polls')} sx={{ mt: 2 }}>Volver</Button>
          </Paper>
        </Box>
      </Layout>
    );
  }

  if (loading || !poll) {
    return (
      <Layout>
        <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  const closed = isClosed(poll);
  const canVote = !poll.user_has_voted && !closed;

  const handleVote = async () => {
    if (poll.type !== 'text' && selectedOptions.length === 0) {
      return setError('Selecciona una opción');
    }
    if (poll.type === 'text' && !textResponse.trim()) {
      return setError('Escribe una respuesta');
    }

    setVoting(true);
    const result = await vote(id, { option_ids: selectedOptions, text_response: textResponse });
    if (result.success) {
      setSuccess('¡Voto registrado!');
      setTimeout(() => { setSuccess(''); loadPoll(); setSelectedOptions([]); setTextResponse(''); }, 1500);
    }
    setVoting(false);
  };

  return (
    <Layout>
      <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
        <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton onClick={() => navigate('/tools/polls')}><BackIcon /></IconButton>
            <Typography variant="body2" color="text.secondary">Encuestas</Typography>
            <Typography variant="body2" color="text.secondary">/</Typography>
            <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 300 }}>{poll.title}</Typography>
          </Box>
          <Box>
            <Tooltip title="Compartir"><IconButton onClick={handleShare}><ShareIcon /></IconButton></Tooltip>
            <Tooltip title="Actualizar"><IconButton onClick={loadPoll}><RefreshIcon /></IconButton></Tooltip>
          </Box>
        </Paper>

        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Stack direction="row" spacing={1} mb={2}>
            <Chip label={POLL_TYPES[poll.type]?.label || poll.type} color={POLL_TYPES[poll.type]?.color} size="small" />
            {poll.user_has_voted && <Chip icon={<DoneIcon />} label="Votado" color="success" size="small" />}
            {closed && <Chip label={poll.deadline && new Date(poll.deadline) < new Date() ? 'Expirada' : 'Cerrada'} size="small" />}
          </Stack>

          <Typography variant="h4" fontWeight={700} gutterBottom>{poll.title}</Typography>
          {poll.description && <Typography color="text.secondary" sx={{ mb: 2 }}>{poll.description}</Typography>}

          <Stack direction="row" spacing={3}>
            <Box><Typography variant="caption">Participantes</Typography><Typography variant="body2" fontWeight={600}>{poll.total_voters || 0}</Typography></Box>
            {poll.deadline && <Box><Typography variant="caption">{closed ? 'Expiró' : 'Cierra'}</Typography><Typography variant="body2" fontWeight={600}>{new Date(poll.deadline).toLocaleDateString()}</Typography></Box>}
          </Stack>
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {canVote && (
          <Card sx={{ mb: 3, border: '2px solid', borderColor: 'primary.main' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom><VoteIcon sx={{ mr: 1 }} />Tu voto</Typography>

              {poll.type === 'single' && (
                <RadioGroup value={selectedOptions[0] || ''} onChange={(e) => setSelectedOptions([e.target.value])}>
                  {poll.poll_options?.map(opt => <FormControlLabel key={opt.id} value={opt.id} control={<Radio />} label={opt.option_text} />)}
                </RadioGroup>
              )}

              {poll.type === 'multiple' && poll.poll_options?.map(opt => (
                <FormControlLabel key={opt.id} control={<Checkbox checked={selectedOptions.includes(opt.id)} onChange={() => setSelectedOptions(prev => prev.includes(opt.id) ? prev.filter(i => i !== opt.id) : [...prev, opt.id])} />} label={opt.option_text} />
              ))}

              {poll.type === 'text' && <TextField fullWidth multiline rows={3} value={textResponse} onChange={(e) => setTextResponse(e.target.value)} placeholder="Escribe tu respuesta" />}

              <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={handleVote} disabled={voting}>
                {voting ? <CircularProgress size={24} /> : 'Votar'}
              </Button>
            </CardContent>
          </Card>
        )}

        {(poll.user_has_voted || closed || user?.role === 'admin') && (
          <>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, bgcolor: 'white', borderRadius: 2 }}>
              <Tab icon={<ChartIcon />} label="Resultados" />
              <Tab icon={<PeopleIcon />} label={`Votos (${poll.total_voters})`} />
            </Tabs>

            {tab === 0 && (
              <Card>
                <CardContent>
                  {poll.type === 'text' ? (
                    poll.poll_votes?.map((v, i) => <Paper key={i} sx={{ p: 2, mb: 1 }}>{v.text_response}</Paper>)
                  ) : (
                    poll.poll_options?.map(opt => (
                      <Box key={opt.id} sx={{ mb: 2 }}>
                        <Typography>{opt.option_text} - {opt.vote_count || 0} votos ({opt.percentage || 0}%)</Typography>
                      </Box>
                    ))
                  )}
                </CardContent>
              </Card>
            )}

            {tab === 1 && (
              <Card>
                <CardContent>
                  {poll.poll_votes?.length ? poll.poll_votes.map((v, i) => (
                    <Paper key={i} sx={{ p: 2, mb: 1 }}>{v.user?.name}: {v.option_text || v.text_response}</Paper>
                  )) : <Typography>Sin votos</Typography>}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Box>
    </Layout>
  );
}