import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Zap, AlertCircle } from 'lucide-react';
import './BlockchainToast.css';

const BLOCK_EXPLORER = 'https://chainscan.0g.ai/tx/';

export default function BlockchainToast({ toast, onClose, style }) {
  if (!toast) return null;

  const handleTxClick = () => {
    if (toast.txHash) {
      window.open(`${BLOCK_EXPLORER}${toast.txHash}`, '_blank');
    }
  };

  // Auto-dismiss
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        onClose();
      }, toast.duration);
      
      return () => clearTimeout(timer);
    }
  }, [toast.duration, onClose]);

  // Determine if this is an error/warning toast
  const isError = toast.title.includes('❌') || toast.title.includes('Failed');
  const isWarning = !toast.txHash && !isError;

  return (
    <AnimatePresence>
      <motion.div
        className={`blockchain-toast ${isError ? 'toast-error' : isWarning ? 'toast-warning' : ''}`}
        style={style}
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {/* Icon */}
        <div className={`toast-icon ${isError ? 'icon-error' : isWarning ? 'icon-warning' : ''}`}>
          {isError ? <AlertCircle size={24} /> : <Zap size={24} />}
        </div>

        {/* Content */}
        <div className="toast-content">
          <div className="toast-header">
            <h4>{toast.title}</h4>
            <button className="toast-close" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
          
          <p className="toast-description">{toast.description}</p>
          
          {toast.txHash ? (
            <button className="toast-tx-link" onClick={handleTxClick}>
              <span className="tx-hash">
                {toast.txHash.slice(0, 10)}...{toast.txHash.slice(-8)}
              </span>
              <ExternalLink size={14} />
            </button>
          ) : isWarning ? (
            <div className="toast-warning-text">
              <AlertCircle size={14} />
              <span>Blockchain recording pending</span>
            </div>
          ) : null}
        </div>

        {/* Progress bar */}
        <motion.div
          className="toast-progress"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
