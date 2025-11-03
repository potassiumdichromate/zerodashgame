import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing Zerion wallet connection (EXCLUSIVE)
 * This hook ONLY supports Zerion wallet - other wallets are rejected
 * Handles wallet connection, disconnection, and account changes
 */
export function useWallet() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState(null);

  /**
   * Truncate wallet address for display
   * @param {string} address - Full wallet address
   * @returns {string} Truncated address (0x1234...abcd)
   */
  const truncateAddress = useCallback((address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  /**
   * Handle account changes from wallet
   */
  const handleAccountsChanged = useCallback((accounts) => {
    if (accounts.length === 0) {
      // User disconnected wallet
      setWalletAddress(null);
      setError('Wallet disconnected');
    } else {
      // Account changed
      setWalletAddress(accounts[0]);
      setError(null);
    }
  }, []);

  /**
   * Handle chain/network changes
   */
  const handleChainChanged = useCallback(() => {
    // Reload the page when chain changes (recommended by MetaMask)
    window.location.reload();
  }, []);

  /**
   * Connect to wallet - ZERION ONLY
   */
  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Check if any Ethereum provider exists
      if (typeof window.ethereum === 'undefined') {
        throw new Error(
          'ZERION_NOT_INSTALLED'
        );
      }

      // Check specifically for Zerion wallet
      const provider = window.ethereum;
      
      // Zerion detection - Check for Zerion-specific properties
      const isZerion = provider.isZerion || 
                       (provider.providers && provider.providers.some(p => p.isZerion));

      if (!isZerion) {
        throw new Error(
          'ONLY_ZERION_ALLOWED'
        );
      }

      setProvider(provider);

      // Request account access
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setError(null);

        // Listen for account changes
        provider.on('accountsChanged', handleAccountsChanged);
        provider.on('chainChanged', handleChainChanged);

        return accounts[0];
      } else {
        throw new Error('No accounts found. Please unlock your Zerion wallet.');
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
      
      // Handle specific error cases
      if (err.message === 'ZERION_NOT_INSTALLED') {
        setError('ZERION_NOT_INSTALLED');
      } else if (err.message === 'ONLY_ZERION_ALLOWED') {
        setError('ONLY_ZERION_ALLOWED');
      } else if (err.code === 4001) {
        // User rejected the connection
        setError('Connection request rejected. Please approve in Zerion wallet.');
      } else {
        setError(err.message || 'Failed to connect to Zerion wallet');
      }
      
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [handleAccountsChanged, handleChainChanged]);

  /**
   * Disconnect wallet
   */
  const disconnectWallet = useCallback(() => {
    if (provider) {
      // Remove event listeners
      provider.removeListener('accountsChanged', handleAccountsChanged);
      provider.removeListener('chainChanged', handleChainChanged);
    }
    setWalletAddress(null);
    setProvider(null);
    setError(null);
  }, [provider, handleAccountsChanged, handleChainChanged]);

  /**
   * Check if wallet is already connected on mount - ZERION ONLY
   */
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          // Check if it's Zerion wallet
          const provider = window.ethereum;
          const isZerion = provider.isZerion || 
                           (provider.providers && provider.providers.some(p => p.isZerion));
          
          if (!isZerion) {
            console.log('Non-Zerion wallet detected, ignoring auto-connect');
            return;
          }

          const accounts = await provider.request({
            method: 'eth_accounts',
          });
          
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setProvider(provider);
            
            // Set up listeners
            provider.on('accountsChanged', handleAccountsChanged);
            provider.on('chainChanged', handleChainChanged);
          }
        } catch (err) {
          console.error('Error checking wallet connection:', err);
        }
      }
    };

    checkConnection();

    // Cleanup listeners on unmount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [handleAccountsChanged, handleChainChanged]);

  return {
    walletAddress,
    truncatedAddress: truncateAddress(walletAddress),
    isConnecting,
    isConnected: !!walletAddress,
    error,
    provider,
    connectWallet,
    disconnectWallet,
  };
}