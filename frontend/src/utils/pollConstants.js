// frontend/src/utils/pollConstants.js
export const POLL_TYPES = [
  { 
    value: 'single', 
    label: '🔘 Opción única (radio)', 
    shortLabel: 'Opción única',
    desc: 'El usuario elige solo una respuesta',
    color: 'primary'
  },
  { 
    value: 'multiple', 
    label: '☑️ Opción múltiple (checkbox)', 
    shortLabel: 'Opción múltiple',
    desc: 'El usuario puede elegir varias',
    color: 'secondary'
  },
  { 
    value: 'text', 
    label: '✍️ Texto libre', 
    shortLabel: 'Texto libre',
    desc: 'El usuario escribe su respuesta',
    color: 'success'
  },
];

export const SHARE_TYPES = [
  { value: 'all', label: '🌐 Todos los usuarios', icon: 'Public' },
  { value: 'group', label: '👥 Grupo específico', icon: 'Group' },
  { value: 'project', label: '📁 Proyecto específico', icon: 'Folder' },
];

export const CHART_COLORS = [
  '#1976d2', '#9c27b0', '#2e7d32', '#ed6c02', 
  '#d32f2f', '#0288d1', '#7b1fa2', '#388e3c',
  '#f57c00', '#c2185b', '#00796b', '#5d4037'
];

export const getPollStatus = (poll) => {
  if (!poll) return { isExpired: false, isClosed: false };
  const isExpired = poll.deadline && new Date(poll.deadline) < new Date();
  const isClosed = !poll.is_active || isExpired;
  return { isExpired, isClosed };
};