import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" fontWeight="bold">
        👋 Bienvenido, {usuario?.name}
      </Typography>
      <Typography variant="body1" color="text.secondary" mt={1}>
        Rol: {usuario?.role}
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate('/users')}
        sx={{ mt: 3, mr: 2 }}
      >
        Gestionar Usuarios
      </Button>
      <Button
        variant="outlined"
        color="error"
        onClick={logout}
        sx={{ mt: 3 }}  
      >
        Cerrar Sesión
      </Button>
    </Box>
  );
}