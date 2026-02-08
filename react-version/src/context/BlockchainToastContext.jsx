import React, { createContext, useContext, useState, useCallback } from 'react';
import BlockchainToast from '../components/BlockchainToast';

const BlockchainToastContext = createContext();

export const useBlockchainToast = () => {
  const context = useContext(BlockchainToastContext);
  if (!context) {
    throw new Error('useBlockchainToast must be used within BlockchainToastProvider');
  }
  return context;
};

export const BlockchainToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(({ title, description, txHash, duration = 6000 }) => {
    console.log('🔔 Showing blockchain toast:', { title, txHash });
    
    const id = Date.now();
    const newToast = {
      title,
      description,
      txHash,
      duration,
      id
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const hideToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <BlockchainToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {/* Render all toasts */}
      <div className="toast-container">
        {toasts.map((toast, index) => (
          <BlockchainToast 
            key={toast.id} 
            toast={toast} 
            onClose={() => hideToast(toast.id)}
            style={{ top: `${80 + index * 120}px` }}
          />
        ))}
      </div>
    </BlockchainToastContext.Provider>
  );
};