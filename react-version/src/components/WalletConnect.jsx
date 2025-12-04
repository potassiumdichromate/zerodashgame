import React, { useState, useEffect} from 'react';

/**
 * WalletConnect Component - PERMISSIVE VERSION
 * Now accepts connections even if wallet identifies as MetaMask
 * (Zerion sometimes sets isMetaMask=true for compatibility)
 */
export default function WalletConnect({
  onConnect,
  isConnecting,
  error,
  onPrivyConnect,
}) {
  const ZERION_DOWNLOAD_URL = 'https://zerion.io/download';
  
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState(null);

  // Only show "not installed" error now
  const isZerionNotInstalled = error === 'ZERION_NOT_INSTALLED';

  /**
   * Run diagnostic check
   */
  const runDiagnostics = () => {
    const results = {
      hasEthereum: typeof window.ethereum !== 'undefined',
      isZerion: window.ethereum?.isZerion || false,
      isMetaMask: window.ethereum?.isMetaMask || false,
      isCoinbase: window.ethereum?.isCoinbaseWallet || false,
      hasProviders: !!window.ethereum?.providers,
      providerCount: window.ethereum?.providers?.length || 0,
      hasZerionWindow: !!window.zerion,
      zerionInProviders: window.ethereum?.providers?.some(p => p.isZerion) || false,
    };

    setDiagnosticResults(results);
    setShowDiagnostics(true);

    console.log('=== 🔍 DIAGNOSTIC RESULTS ===');
    console.log('Has ethereum:', results.hasEthereum);
    console.log('Is Zerion:', results.isZerion);
    console.log('Is MetaMask:', results.isMetaMask);
    console.log('Is Coinbase:', results.isCoinbase);
    console.log('Has providers array:', results.hasProviders);
    console.log('Provider count:', results.providerCount);
    console.log('Zerion in providers:', results.zerionInProviders);
    console.log('window.zerion exists:', results.hasZerionWindow);
    console.log('============================');
  };

  useEffect(() => {
    // Auto-run diagnostics on component mount
    console.log("running ");
    console.log(onConnect, isConnecting, error, onPrivyConnect);
    console.log("+++++++")
  }, []);

  /**
   * Get troubleshooting advice based on diagnostics
   */
  const getTroubleshootingAdvice = () => {
    if (!diagnosticResults) return null;

    // No wallet installed
    if (!diagnosticResults.hasEthereum && !diagnosticResults.hasZerionWindow) {
      return {
        type: 'error',
        title: 'No Wallet Detected',
        message: 'No Ethereum wallet extension found.',
        solution: 'Install Zerion wallet from the link below.',
      };
    }

    // Wallet detected (could be Zerion identifying as MetaMask)
    if (diagnosticResults.hasEthereum) {
      return {
        type: 'info',
        title: 'Wallet Detected',
        message: 'A wallet extension is installed and active.',
        solution: 'Click "Connect Wallet" to proceed. If you have multiple wallets, make sure Zerion is your active wallet.',
      };
    }

    return null;
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-5 overflow-y-auto">
      <div className="max-w-2xl w-full text-center fade-in py-10">
        {/* Game Logo */}
        <h1 
          className="text-4xl md:text-6xl lg:text-7xl font-pixel text-zerion-yellow mb-10 animate-logo-float"
          style={{
            textShadow: `
              4px 4px 0 #f59e0b,
              8px 8px 0 rgba(0, 0, 0, 0.4),
              0 0 20px rgba(255, 215, 0, 0.8),
              0 0 40px rgba(255, 215, 0, 0.4)
            `,
            letterSpacing: '2px',
          }}
        >
          ZERO DASH
        </h1>

        {/* Game Subtitle */}
        <p 
          className="text-xs md:text-sm font-pixel text-zerion-blue-light mb-16"
          style={{ textShadow: '2px 2px 0 rgba(0, 0, 0, 0.8)' }}
        >
          Zerion 🤝 Kult Games
        </p>

        {/* Zerion Not Installed Message */}
        {isZerionNotInstalled && (
          <div className="mb-8 p-6 bg-zerion-blue-dark/90 border-4 border-zerion-yellow rounded-lg animate-pulse-slow">
            <div className="mb-4">
              <svg 
                className="w-16 h-16 mx-auto mb-4 text-zerion-yellow"
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <h3 className="text-lg font-pixel text-zerion-yellow mb-2">
                Wallet Required
              </h3>
              <p className="text-sm text-zerion-light mb-4">
                Please install Zerion wallet to play this game.
              </p>
            </div>
            <a
              href={ZERION_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block pixel-button-primary mb-2"
            >
              Download Zerion
            </a>
            <p className="text-xs text-zerion-light/60 mt-2">
              After installing, refresh this page (Ctrl+Shift+R)
            </p>
          </div>
        )}

        {/* Connect Wallet Button */}
        <div className="flex flex-col items-center gap-3 mb-4">
          <button
            onClick={onConnect}
            disabled={isConnecting}
            className="pixel-button-primary w-full max-w-xs"
          >
            {isConnecting ? (
              <>
                Connecting
                <span className="loading-spinner ml-2" />
              </>
            ) : (
              'Connect Wallet'
            )}
          </button>

          {typeof onPrivyConnect === 'function' && (
            <button
              onClick={onPrivyConnect}
              type="button"
              className="pixel-button-secondary w-full max-w-xs"
            >
              Connect with Privy
            </button>
          )}
        </div>

        {/* General Error Message */}
        {error && !isZerionNotInstalled && (
          <div 
            className="mt-6 p-5 bg-red-900/90 border-4 border-red-500 text-sm animate-shake rounded"
            style={{ textShadow: '1px 1px 0 rgba(0, 0, 0, 0.8)' }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Diagnostic Tool Button */}
        <div className="mt-8">
          <button
            onClick={runDiagnostics}
            className="text-xs text-zerion-blue-light hover:text-zerion-yellow underline mb-4 transition-colors"
          >
            🔍 Not working? Run Diagnostics
          </button>
        </div>

        {/* Diagnostic Results */}
        {showDiagnostics && diagnosticResults && (
          <div className="mt-6 p-6 bg-black/80 border-2 border-zerion-blue-light rounded-lg text-left">
            <h4 className="text-sm font-pixel text-zerion-yellow mb-4">
              🔍 Diagnostic Results
            </h4>
            
            {/* Status Checks */}
            <div className="space-y-2 text-xs mb-4 font-mono">
              <div className="flex items-center justify-between">
                <span>Ethereum Provider:</span>
                <span className={diagnosticResults.hasEthereum ? 'text-green-400' : 'text-red-400'}>
                  {diagnosticResults.hasEthereum ? '✅ YES' : '❌ NO'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Zerion Flag:</span>
                <span className={diagnosticResults.isZerion ? 'text-green-400' : 'text-yellow-400'}>
                  {diagnosticResults.isZerion ? '✅ YES' : '⚠️ Not set (OK)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>MetaMask Flag:</span>
                <span className="text-gray-400">
                  {diagnosticResults.isMetaMask ? '⚠️ Set (for compatibility)' : 'Not set'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Wallets:</span>
                <span className="text-gray-400">
                  {diagnosticResults.providerCount || '1'}
                </span>
              </div>
            </div>

            {/* Troubleshooting Advice */}
            {getTroubleshootingAdvice() && (
              <div className={`p-4 rounded mb-4 ${
                getTroubleshootingAdvice().type === 'error' ? 'bg-red-900/50 border-2 border-red-500' :
                getTroubleshootingAdvice().type === 'warning' ? 'bg-orange-900/50 border-2 border-orange-500' :
                getTroubleshootingAdvice().type === 'info' ? 'bg-blue-900/50 border-2 border-blue-500' :
                'bg-green-900/50 border-2 border-green-500'
              }`}>
                <h5 className="font-bold text-sm mb-2">
                  {getTroubleshootingAdvice().title}
                </h5>
                <p className="text-xs mb-2">{getTroubleshootingAdvice().message}</p>
                <p className="text-xs font-mono bg-black/50 p-2 rounded">
                  💡 {getTroubleshootingAdvice().solution}
                </p>
              </div>
            )}

            <button
              onClick={() => setShowDiagnostics(false)}
              className="text-xs text-zerion-blue-light hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {/* Instructions */}
        {!error && !showDiagnostics && (
          <div className="mt-8">
            <p className="text-xs opacity-60 text-zerion-light mb-3">
              Connect your Zerion wallet to start playing
            </p>
            <p className="text-xs opacity-40 text-zerion-light mb-3">
              (Best experienced with Zerion Wallet)
            </p>
            <a
              href={ZERION_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zerion-yellow hover:text-zerion-yellow-glow underline"
            >
              Don't have Zerion? Download here
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
