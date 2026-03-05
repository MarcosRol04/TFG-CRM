import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserForm from './components/users/UserForm';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Tools from './pages/Tools';
import Notes from './components/tools/Notes';
import Calculator from './components/tools/Calculator';
import Spreadsheet from './components/tools/Spreadsheet';



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
      <Route path="/groups" element={<Groups />} />
      <Route
  path="/groups/:id"
  element={
    <RutaProtegida>
      <GroupDetail />
    </RutaProtegida>
  }
/>
<Route
  path="/projects"
  element={
    <RutaProtegida>
      <Projects />
    </RutaProtegida>
  }
/>
<Route
  path="/projects/:id"
  element={
    <RutaProtegida>
      <ProjectDetail />
    </RutaProtegida>
  }
/>
<Route path="/tools" element={<RutaProtegida><Tools /></RutaProtegida>} />
<Route path="/tools/notes"      element={<Notes />} />
<Route path="/tools/calculator" element={<Calculator />} />
<Route path="/tools/spreadsheet" element={<RutaProtegida><Spreadsheet /></RutaProtegida>} />
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