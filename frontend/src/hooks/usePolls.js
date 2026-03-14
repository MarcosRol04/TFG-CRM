// frontend/src/hooks/usePolls.js
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ⚠️ MODO DESARROLLO: Cambia a false cuando el backend acepte tokens
const DEV_MODE = false;

export const usePolls = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Headers condicionales
  const getHeaders = () => {
    if (DEV_MODE) {
      return {
        'Content-Type': 'application/json'
      };
    } else {
      const token = localStorage.getItem('token');
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    }
  };

  const fetchPolls = useCallback(async (status = 'active') => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API}/api/polls?status=${status}`, {
        headers: getHeaders()
      });

      if (response.status === 401 && !DEV_MODE) {
        setError('Sesión expirada. Por favor, inicia sesión de nuevo.');
        return;
      }

      if (!response.ok && !DEV_MODE) throw new Error('Error al cargar');
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = { data: [] };
      }
      
      setPolls(data.data || []);
      setError('');
    } catch (err) {
      if (!DEV_MODE) {
        setError('Error al cargar las encuestas');
      }
      // En DEV_MODE, no mostramos error
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPoll = useCallback(async (id) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API}/api/polls/${id}`, {
        headers: getHeaders()
      });

      if (response.status === 401 && !DEV_MODE) {
        navigate('/login');
        return null;
      }

      if (!response.ok && !DEV_MODE) throw new Error('Error al cargar');
      
      const data = await response.json();
      return data.data;
    } catch (err) {
      if (!DEV_MODE) {
        setError('Error al cargar la encuesta');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const createPoll = async (pollData) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API}/api/polls`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(pollData)
      });
      
      // En DEV_MODE, simulamos éxito aunque el backend falle
      if (DEV_MODE) {
        console.log('🔧 MODO DESARROLLO: Encuesta creada (simulada)', pollData);
        setTimeout(() => {
          navigate('/tools/polls');
        }, 500);
        return { success: true };
      }
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Error al crear');
      
      navigate('/tools/polls');
      return { success: true };
    } catch (err) {
      if (DEV_MODE) {
        // En desarrollo, simulamos éxito aunque haya error
        console.log('🔧 MODO DESARROLLO: Error ignorado, simulando éxito');
        navigate('/tools/polls');
        return { success: true };
      }
      setError(err.message || 'Error al crear la encuesta');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updatePoll = async (id, pollData) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API}/api/polls/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(pollData)
      });
      
      if (DEV_MODE) {
        console.log('🔧 MODO DESARROLLO: Encuesta actualizada (simulada)', { id, pollData });
        setTimeout(() => {
          navigate('/tools/polls');
        }, 500);
        return { success: true };
      }
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Error al actualizar');
      
      navigate('/tools/polls');
      return { success: true };
    } catch (err) {
      if (DEV_MODE) {
        console.log('🔧 MODO DESARROLLO: Error ignorado, simulando éxito');
        navigate('/tools/polls');
        return { success: true };
      }
      setError(err.message || 'Error al actualizar la encuesta');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deletePoll = async (id) => {
    if (!window.confirm('¿Eliminar esta encuesta y todos sus votos?')) return false;
    
    try {
      setLoading(true);
      
      const response = await fetch(`${API}/api/polls/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      
      if (DEV_MODE) {
        console.log('🔧 MODO DESARROLLO: Encuesta eliminada (simulada)', id);
        return true;
      }
      
      if (!response.ok) throw new Error('Error al eliminar');
      
      return true;
    } catch (err) {
      if (DEV_MODE) {
        console.log('🔧 MODO DESARROLLO: Error ignorado, simulando éxito');
        return true;
      }
      setError('Error al eliminar la encuesta');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const vote = async (id, voteData) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API}/api/polls/${id}/vote`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(voteData)
      });
      
      if (DEV_MODE) {
        console.log('🔧 MODO DESARROLLO: Voto registrado (simulado)', { id, voteData });
        return { success: true };
      }
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Error al votar');
      
      return { success: true };
    } catch (err) {
      if (DEV_MODE) {
        console.log('🔧 MODO DESARROLLO: Error ignorado, simulando éxito');
        return { success: true };
      }
      setError(err.message || 'Error al votar');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const exportPoll = async (id, title) => {
    try {
      const response = await fetch(`${API}/api/polls/${id}/export`, {
        headers: getHeaders()
      });
      
      if (DEV_MODE) {
        console.log('🔧 MODO DESARROLLO: Exportación simulada', id);
        alert('🔧 Modo desarrollo: Exportación simulada');
        return { success: true };
      }
      
      if (!response.ok) throw new Error('Error al exportar');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `encuesta-${title.replace(/\s+/g, '-')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (err) {
      if (DEV_MODE) {
        console.log('🔧 MODO DESARROLLO: Error ignorado');
        return { success: true };
      }
      setError('Error al exportar');
      return { success: false };
    }
  };

  return {
    polls,
    loading,
    error,
    setError,
    user: DEV_MODE ? { role: 'admin', id: 1, name: 'Usuario Desarrollo' } : JSON.parse(localStorage.getItem('user') || '{}'),
    fetchPolls,
    fetchPoll,
    createPoll,
    updatePoll,
    deletePoll,
    vote,
    exportPoll,
  };
};