import { useState, useEffect } from 'react';

function App() {
  const [estadoServidor, setEstadoServidor] = useState('Comprobando...');

  useEffect(() => {
    fetch('http://localhost:5000/api/health')
      .then(res => res.json())
      .then(data => setEstadoServidor(data.mensaje))
      .catch(() => setEstadoServidor('❌ No conecta con el servidor'));
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial' }}>
      <h1>🎯 TFG - CRM</h1>
      <p>Estado del servidor: <strong>{estadoServidor}</strong></p>
      <hr />
      <h2>Módulos a desarrollar:</h2>
      <ul>
        <li>✅ Servidor funcionando</li>
        <li>🔲 Gestión de Usuarios</li>
        <li>🔲 Grupos y Proyectos</li>
        <li>🔲 Correo integrado</li>
        <li>🔲 Planificación (Kanban)</li>
      </ul>
    </div>
  );
}

export default App;