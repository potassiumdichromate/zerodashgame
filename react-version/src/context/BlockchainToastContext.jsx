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
    console.log('🔔 [TOAST] showToast called with:', { title, description, txHash, duration });
    
    const id = Date.now();
    const newToast = {
      title,
      description,
      txHash,
      duration,
      id
    };

    console.log('🔔 [TOAST] Creating toast with id:', id);
    setToasts(prev => {
      console.log('🔔 [TOAST] Previous toasts:', prev);
      console.log('🔔 [TOAST] Adding new toast:', newToast);
      return [...prev, newToast];
    });

    // Auto-dismiss after duration
    setTimeout(() => {
      console.log('🔔 [TOAST] Auto-dismissing toast:', id);
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const hideToast = useCallback((id) => {
    console.log('🔔 [TOAST] Manually hiding toast:', id);
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  console.log('🔔 [TOAST] Current toasts in state:', toasts);

  return (
    <BlockchainToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {/* Render all toasts */}
      <div className="toast-container" style={{ position: 'fixed', top: 0, right: 0, zIndex: 99999 }}>
        {console.log('🔔 [TOAST] Rendering toast container with', toasts.length, 'toasts')}
        {toasts.map((toast, index) => {
          console.log('🔔 [TOAST] Rendering toast:', toast.id, toast);
          return (
            <BlockchainToast 
              key={toast.id} 
              toast={toast} 
              onClose={() => hideToast(toast.id)}
              style={{ top: `${80 + index * 120}px` }}
            />
          );
        })}
      </div>
    </BlockchainToastContext.Provider>
  );
};
