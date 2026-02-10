import { Box, Typography, Button } from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { usuario, logout } = useAuth();

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" fontWeight="bold">
        👋 Bienvenido, {usuario?.name}
      </Typography>
      <Typography variant="body1" color="text.secondary" mt={1}>
        Rol: {usuario?.role}
      </Typography>
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