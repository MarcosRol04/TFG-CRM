import { Box, Typography, Paper, Grid } from '@mui/material';
import { People, Group } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const StatCard = ({ icon, label, color, path, onClick }) => (
  <Paper
    elevation={2}
    onClick={onClick}
    sx={{
      p: 3, borderRadius: 3, cursor: 'pointer', display: 'flex',
      alignItems: 'center', gap: 2,
      transition: 'transform 0.15s, box-shadow 0.15s',
      '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
    }}
  >
    <Box sx={{ bgcolor: `${color}.lighter`, p: 1.5, borderRadius: 2, color: `${color}.main` }}>
      {icon}
    </Box>
    <Typography variant="h6" fontWeight={600}>{label}</Typography>
  </Paper>
);

export default function Dashboard() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  return (
    <Layout>
      <Typography variant="h4" fontWeight="bold" mb={1}>
        👋 Bienvenido, {usuario?.name}
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Desde aquí puedes gestionar todos los módulos del CRM.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<People />}
            label="Usuarios"
            color="primary"
            onClick={() => navigate('/users')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<Group />}
            label="Grupos"
            color="secondary"
            onClick={() => navigate('/groups')}
          />
        </Grid>
      </Grid>
    </Layout>
  );
}