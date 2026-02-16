import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserForm from './components/users/UserForm';

// Ruta protegida
const RutaProtegida = ({ children }) => {
  const { usuario } = useAuth();
  return usuario ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  const { usuario } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={usuario ? <Navigate to="/dashboard" /> : <Login />} 
      />
      <Route
        path="/dashboard"
        element={
          <RutaProtegida>
            <Dashboard />
          </RutaProtegida>
        }
      />
      <Route
        path="/users"
        element={
          <RutaProtegida>
            <Users />
          </RutaProtegida>
        }
      />
      <Route
        path="/users/new"
        element={
          <RutaProtegida>
            <UserForm />
          </RutaProtegida>
        }
      />
      <Route
        path="/users/edit/:id"
        element={
          <RutaProtegida>
            <UserForm />
          </RutaProtegida>
        }
      />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;