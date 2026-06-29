import React from 'react';
import './Toast.css';

export function Toast({ notification, onClose, isRemoving }) {
  const typeClass = notification.type || 'info';
  
  return (
    <div 
      className={`toast toast-${typeClass} ${isRemoving ? 'removing' : ''}`} 
      onClick={onClose}
      role="alert"
      aria-live="polite"
    >
      {notification.message}
    </div>
  );
}

export function ToastContainer({ notifications, onRemove }) {
  // Safety limit: only show max 5 notifications (store should already limit, but double-check)
  const visibleNotifications = notifications.slice(0, 5);
  
  return (
    <div className="toast-container">
      {visibleNotifications.map(notification => (
        <Toast
          key={notification.id}
          notification={notification}
          onClose={() => onRemove(notification.id)}
        />
      ))}
    </div>
  );
}

