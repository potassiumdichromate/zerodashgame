import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing injected EIP-1193 wallet connections.
 */
export function useWallet() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState(null);

  /**
   * Helper to poll for provider injection.
   * Useful on mobile where injection may be delayed.
   */
  const waitForProvider = useCallback(async (maxRetries = 50, interval = 100) => {
    for (let i = 0; i < maxRetries; i++) {
      if (typeof window.ethereum !== 'undefined') {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    return false;
  }, []);

  /**
   * Select a usable EIP-1193 provider.
   */
  const findProvider = useCallback(() => {
    if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
      const providers = window.ethereum.providers.filter(p => typeof p?.request === 'function');
      if (providers.length > 0) {
        return providers[0];
      }
    }

    if (window.ethereum && typeof window.ethereum.request === 'function') {
      return window.ethereum;
    }

    return null;
  }, []);

  const truncateAddress = useCallback((address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  const handleAccountsChanged = useCallback((accounts) => {
    if (!accounts || accounts.length === 0) {
      setWalletAddress(null);
      setError('Wallet disconnected');
      return;
    }

    setWalletAddress(accounts[0]);
    setError(null);
  }, []);

  const handleChainChanged = useCallback(() => {
    window.location.reload();
  }, []);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      await waitForProvider();

      const selectedProvider = findProvider();
      if (!selectedProvider) {
        throw new Error('WALLET_NOT_INSTALLED');
      }

      setProvider(selectedProvider);

      const accounts = await selectedProvider.request({ method: 'eth_requestAccounts' });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet.');
      }

      const connectedAddress = accounts[0];
      setWalletAddress(connectedAddress);
      setError(null);

      selectedProvider.on?.('accountsChanged', handleAccountsChanged);
      selectedProvider.on?.('chainChanged', handleChainChanged);

      return connectedAddress;
    } catch (err) {
      if (err?.message === 'WALLET_NOT_INSTALLED') {
        setError('WALLET_NOT_INSTALLED');
      } else if (err?.code === 4001) {
        setError('Connection request rejected. Please approve in your wallet.');
      } else {
        setError(err?.message || 'Failed to connect wallet');
      }

      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [findProvider, handleAccountsChanged, handleChainChanged, waitForProvider]);

  const disconnectWallet = useCallback(() => {
    if (provider) {
      provider.removeListener?.('accountsChanged', handleAccountsChanged);
      provider.removeListener?.('chainChanged', handleChainChanged);
    }

    setWalletAddress(null);
    setProvider(null);
    setError(null);
  }, [provider, handleAccountsChanged, handleChainChanged]);

  useEffect(() => {
    let mounted = true;

    const checkConnection = async () => {
      await waitForProvider(30, 100);

      const selectedProvider = findProvider();
      if (!selectedProvider || !mounted) {
        return;
      }

      try {
        const accounts = await selectedProvider.request({ method: 'eth_accounts' });

        if (!mounted) {
          return;
        }

        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setProvider(selectedProvider);
          selectedProvider.on?.('accountsChanged', handleAccountsChanged);
          selectedProvider.on?.('chainChanged', handleChainChanged);
        }
      } catch {
        // Ignore background connection check failures.
      }
    };

    checkConnection();

    return () => {
      mounted = false;
      if (provider) {
        provider.removeListener?.('accountsChanged', handleAccountsChanged);
        provider.removeListener?.('chainChanged', handleChainChanged);
      }
    };
  }, [findProvider, handleAccountsChanged, handleChainChanged, provider, waitForProvider]);

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
