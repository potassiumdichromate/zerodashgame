import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing Zerion wallet connection
 * UPDATED VERSION: Now accepts Zerion even when it identifies as MetaMask
 * 
 * Some Zerion versions set isMetaMask=true for compatibility
 * We now check multiple ways to identify Zerion
 */
export function useWallet() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState(null);

  /**
   * Helper to poll for provider injection
   * Critical for mobile where injection might be delayed
   */
  const waitForProvider = useCallback(async (maxRetries = 20, interval = 100) => {
    for (let i = 0; i < maxRetries; i++) {
      if (typeof window.ethereum !== 'undefined' || window.zerion) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    return false;
  }, []);

  /**
   * Truncate wallet address for display
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
      setWalletAddress(null);
      setError('Wallet disconnected');
    } else {
      setWalletAddress(accounts[0]);
      setError(null);
    }
  }, []);

  /**
   * Handle chain/network changes
   */
  const handleChainChanged = useCallback(() => {
    window.location.reload();
  }, []);

  /**
   * Enhanced Zerion detection - checks multiple indicators
   * Returns true if this is likely Zerion wallet
   */
  const isLikelyZerion = useCallback((provider) => {
    if (!provider) return false;

    // Method 1: Direct isZerion flag (most reliable)
    if (provider.isZerion) {
      console.log('✅ Confirmed Zerion via isZerion flag');
      return true;
    }

    // Method 2: Check provider name/branding
    if (provider.isZerion === true || 
        provider._zerion || 
        provider.zerion) {
      console.log('✅ Confirmed Zerion via naming');
      return true;
    }

    // Method 3: Check wallet name in provider info
    try {
      const providerInfo = provider.providerInfo || provider.wallet || {};
      const name = (providerInfo.name || '').toLowerCase();
      if (name.includes('zerion')) {
        console.log('✅ Confirmed Zerion via provider name');
        return true;
      }
    } catch (e) {
      // Ignore errors
    }

    // Method 4: If only one wallet is installed and it's ethereum
    // Let's just try to connect and see what happens
    if (provider === window.ethereum && !window.ethereum?.providers) {
      console.log('⚠️ Single wallet detected - assuming it might be Zerion');
      return true; // Let user try to connect
    }

    return false;
  }, []);

  /**
   * Find Zerion provider in multi-wallet setup
   */
  const findZerionProvider = useCallback(() => {
    console.log('🔍 Searching for Zerion wallet...');

    // Method 1: Direct window.ethereum.isZerion
    if (window.ethereum?.isZerion) {
      console.log('✅ Zerion detected via isZerion property');
      return window.ethereum;
    }

    // Method 2: Check providers array (multi-wallet setup)
    if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
      console.log('🔍 Checking providers array...');
      const zerionProvider = window.ethereum.providers.find(p => 
        p.isZerion || isLikelyZerion(p)
      );
      if (zerionProvider) {
        console.log('✅ Zerion detected in providers array');
        return zerionProvider;
      }
    }

    // Method 3: Check window.zerion
    if (window.zerion) {
      console.log('✅ Zerion detected at window.zerion');
      return window.zerion;
    }

    // Method 4: Single wallet - might be Zerion
    if (window.ethereum && isLikelyZerion(window.ethereum)) {
      console.log('✅ Detected potential Zerion wallet');
      return window.ethereum;
    }

    console.log('❌ Zerion wallet not detected');
    return null;
  }, [isLikelyZerion]);

  /**
   * Verify if connected wallet is actually Zerion
   * This runs AFTER connection to double-check
   */
  const verifyIsZerion = useCallback(async (provider, connectedAddress) => {
    console.log('🔍 Verifying if connected wallet is Zerion...');

    // If it has isZerion flag, definitely Zerion
    if (provider.isZerion) {
      console.log('✅ Verified: isZerion flag present');
      return true;
    }

    // Check if user has Zerion extension installed
    // by trying to access Zerion-specific features
    try {
      // Zerion has specific RPC endpoints and features
      // We can't definitively verify without user confirmation
      // So we'll be permissive here
      console.log('⚠️ Could not definitively verify Zerion, but allowing connection');
      console.log('💡 Connected address:', connectedAddress);
      return true; // Allow connection
    } catch (e) {
      console.log('⚠️ Verification uncertain, allowing connection');
      return true; // Be permissive
    }
  }, []);

  /**
   * Connect to wallet - ZERION PREFERRED (now more permissive)
   */
  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    // Log current wallet state for debugging
    console.log('=== 🔍 Wallet Detection Debug ===');
    console.log('window.ethereum exists:', !!window.ethereum);
    console.log('window.ethereum.isZerion:', window.ethereum?.isZerion);
    console.log('window.ethereum.isMetaMask:', window.ethereum?.isMetaMask);
    console.log('window.ethereum.isCoinbaseWallet:', window.ethereum?.isCoinbaseWallet);
    console.log('window.ethereum.providers:', window.ethereum?.providers);
    console.log('window.zerion exists:', !!window.zerion);
    console.log('==============================');

    try {
      // Wait for wallet injection
      // Wait for wallet injection - using polling instead of fixed timeout
      console.log('⏳ Waiting for wallet injection...');
      await waitForProvider();

      // Check if any Ethereum provider exists
      if (typeof window.ethereum === 'undefined' && !window.zerion) {
        console.error('❌ No Ethereum provider detected');
        console.error('💡 Please install Zerion wallet extension');
        throw new Error('ZERION_NOT_INSTALLED');
      }

      // Find potential Zerion provider
      const potentialProvider = findZerionProvider();

      if (!potentialProvider) {
        console.error('❌ No wallet detected that could be Zerion');
        throw new Error('ZERION_NOT_INSTALLED');
      }

      console.log('✅ Found wallet provider, attempting connection...');
      setProvider(potentialProvider);

      // Request account access
      const accounts = await potentialProvider.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        const connectedAddress = accounts[0];
        console.log('✅ Connected to wallet:', connectedAddress);

        // Verify it's Zerion (permissive check)
        const isVerifiedZerion = await verifyIsZerion(potentialProvider, connectedAddress);
        
        if (!isVerifiedZerion) {
          console.warn('⚠️ Could not verify this is Zerion wallet');
          // Still allow connection but warn user
        }

        setWalletAddress(connectedAddress);
        setError(null);

        // Listen for account changes
        potentialProvider.on('accountsChanged', handleAccountsChanged);
        potentialProvider.on('chainChanged', handleChainChanged);

        return connectedAddress;
      } else {
        throw new Error('No accounts found. Please unlock your wallet.');
      }
    } catch (err) {
      console.error('❌ Wallet connection error:', err);
      
      // Handle specific error cases
      if (err.message === 'ZERION_NOT_INSTALLED') {
        setError('ZERION_NOT_INSTALLED');
      } else if (err.code === 4001) {
        setError('Connection request rejected. Please approve in your wallet.');
      } else if (err.message === 'ONLY_ZERION_ALLOWED') {
        setError('ONLY_ZERION_ALLOWED');
      } else {
        setError(err.message || 'Failed to connect wallet');
      }
      
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [handleAccountsChanged, handleChainChanged, findZerionProvider, verifyIsZerion]);

  /**
   * Disconnect wallet
   */
  const disconnectWallet = useCallback(() => {
    if (provider) {
      provider.removeListener('accountsChanged', handleAccountsChanged);
      provider.removeListener('chainChanged', handleChainChanged);
    }
    setWalletAddress(null);
    setProvider(null);
    setError(null);
  }, [provider, handleAccountsChanged, handleChainChanged]);

  /**
   * Check if wallet is already connected on mount
   */
  useEffect(() => {
    const checkConnection = async () => {
      // Wait for potential wallet injection
      await waitForProvider(5, 100); // Shorter wait for auto-check

      if (typeof window.ethereum !== 'undefined' || window.zerion) {
        try {
          console.log('🔍 Checking for existing wallet connection...');
          
          // Find provider
          const potentialProvider = findZerionProvider();
          
          if (!potentialProvider) {
            console.log('ℹ️ No wallet detected on mount');
            return;
          }

          const accounts = await potentialProvider.request({
            method: 'eth_accounts',
          });
          
          if (accounts && accounts.length > 0) {
            console.log('✅ Found existing wallet connection:', accounts[0]);
            setWalletAddress(accounts[0]);
            setProvider(potentialProvider);
            
            // Set up listeners
            potentialProvider.on('accountsChanged', handleAccountsChanged);
            potentialProvider.on('chainChanged', handleChainChanged);
          } else {
            console.log('ℹ️ No existing connection found');
          }
        } catch (err) {
          console.error('Error checking wallet connection:', err);
        }
      }
    };

    checkConnection();

    // Cleanup listeners on unmount
    return () => {
      if (provider) {
        provider.removeListener('accountsChanged', handleAccountsChanged);
        provider.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [handleAccountsChanged, handleChainChanged, findZerionProvider]);

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