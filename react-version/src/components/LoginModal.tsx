import React, { useEffect, useRef, useState } from 'react'
import {
  useConnectWallet,
  useLoginWithEmail,
  useLoginWithOAuth,
  useLogin,
  usePrivy,
  useCreateWallet,
} from '@privy-io/react-auth'

import NetworkModal from './NetworkModal'
import { getAllowedChainFromEnv } from '../lib/chain'

type LoginModalProps = {
  open: boolean
  onClose: () => void
  onAuthenticated?: (walletAddress?: string) => void
}

/* ============================== Helpers ============================== */
function getPrimaryWalletAddress(user: any | undefined | null): string | undefined {
  if (!user) return undefined
  if (user.wallet?.address) return user.wallet.address
  if (Array.isArray(user.embeddedWallets) && user.embeddedWallets[0]?.address) {
    return user.embeddedWallets[0].address
  }
  if (Array.isArray(user.wallets) && user.wallets[0]?.address) {
    return user.wallets[0].address
  }
  if (Array.isArray(user.linkedAccounts)) {
    const w = user.linkedAccounts.find((a: any) => a?.type === 'wallet' && a?.address)
    if (w?.address) return w.address
  }
  return undefined
}

function deriveAuthMethodFromUser(user: any | undefined | null): 'email' | 'oauth' | null {
  if (!user) return null
  if (
    user.google?.email ||
    (Array.isArray(user.linkedAccounts) &&
      user.linkedAccounts.some((a: any) => a?.type === 'google' || a?.type === 'google_oauth'))
  ) {
    return 'oauth'
  }
  if (user.email?.address) return 'email'
  return null
}

function hasInjectedZerionWallet(): boolean {
  const w = window as any
  const eth = w?.ethereum
  if (!eth) return false

  if (eth.isZerion) return true
  if (w.zerionWallet || w.zerion) return true

  const providers = Array.isArray(eth.providers) ? eth.providers : []
  return providers.some((p: any) => Boolean(p?.isZerion))
}

/* ============================== Icons / Small UI ============================== */
const WalletIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M3.75 7.5h13.5a3 3 0 0 1 3 3v6.75a3 3 0 0 1-3 3H6.75a3 3 0 0 1-3-3V9.75a2.25 2.25 0 0 1 2.25-2.25Z" stroke="currentColor" strokeWidth="1.6" />
    <path d="M18.75 12.75h-2.25a1.5 1.5 0 1 0 0 3h2.25a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-.75-.75Z" fill="currentColor" />
    <path d="M17.25 5.25H6a2.25 2.25 0 0 0-2.25 2.25v1.5" stroke="currentColor" strokeWidth="1.6" />
  </svg>
)

const GoogleIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M23.6 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.6-1.3 3-2.7 3.9v3.2h4.4c2.6-2.3 4.1-5.6 4.1-9.2z" />
    <path fill="#34A853" d="M12 24c3.6 0 6.6-1.2 8.8-3.2l-4.4-3.2c-1.2.8-2.7 1.3-4.4 1.3-3.4 0-6.2-2.3-7.2-5.3H.2v3.3C2.3 21.3 6.8 24 12 24z" />
    <path fill="#FBBC05" d="M4.8 13.6c-.3-1-.3-2 0-3V7.3H.2C-1 9.6-1 12.4.2 14.7l4.6-1.1z" />
    <path fill="#EA4335" d="M12 4.7c1.9 0 3.6.7 4.9 1.9l3.7-3.7C18.6 1 15.6 0 12 0 6.8 0 2.3 2.7.2 7.3l4.6 3.3C5.8 7.1 8.6 4.7 12 4.7z" />
  </svg>
)

const MailIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M6.75 6.75h10.5A2.25 2.25 0 0 1 19.5 9v6A2.25 2.25 0 0 1 17.25 17.25H6.75A2.25 2.25 0 0 1 4.5 15V9A2.25 2.25 0 0 1 6.75 6.75Z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M5.25 8.25 12 12.75l6.75-4.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
)

type WalletId = 'zerion'

function DividerOr() {
  return (
    <div className="my-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[#9CB9D0]">
      <span className="h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <span className="text-xs">or</span>
      <span className="h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
    </div>
  )
}

function ErrorBanner({ error }: { error?: string }) {
  if (!error) return null
  return (
    <div className="my-2 rounded-lg bg-[#2a0e0e] px-3 py-2 text-sm text-[#ffd8d8]">
      {error}
    </div>
  )
}

function EmbeddedWalletBadge({ address }: { address?: string }) {
  if (!address) return null
  return (
    <div className="mb-3 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white/80 break-all">
      Wallet:{' '}
      <span className="font-mono text-[11px] text-white/95">
        {address}
      </span>
    </div>
  )
}

function EmailForm({
  email,
  setEmail,
  emailState,
  onEmailSubmit,
  setLoginMethod,
  disabled,
}: {
  email: string
  setEmail: (s: string) => void
  emailState: ReturnType<typeof useLoginWithEmail>['state']
  onEmailSubmit: React.FormEventHandler<HTMLFormElement>
  setLoginMethod: (m: 'email' | 'oauth' | null) => void
  disabled: boolean
}) {
  return (
    <form className="grid gap-4" onSubmit={onEmailSubmit}>
      <label className="grid gap-2">
        <span className="text-xs font-medium tracking-wide text-white/70">Email address</span>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/45">
            <MailIcon />
          </span>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full min-w-0 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 pl-11 text-base text-white/95 placeholder-white/40 outline-none transition focus:border-amber-300/60 focus:ring-2 focus:ring-amber-400/40 disabled:opacity-60"
            disabled={disabled}
          />
        </div>
        <span className="text-[11px] text-white/45">We’ll email you a 6‑digit code.</span>
      </label>

      <button
        type="submit"
        className="inline-flex w-full min-w-0 items-center justify-center rounded-2xl border border-amber-400/70 bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 px-5 py-3 font-bold text-white shadow-[0_10px_28px_rgba(251,146,60,0.45)] transition hover:shadow-[0_14px_34px_rgba(251,146,60,0.6)] active:scale-[.98] disabled:opacity-60"
        disabled={
          disabled || emailState.status === 'sending-code' || emailState.status === 'submitting-code'
        }
        onClick={() => setLoginMethod('email')}
      >
        {emailState.status === 'sending-code' ? 'Sending…' : 'Send code'}
      </button>
    </form>
  )
}

function CodeForm({
  code,
  setCode,
  onBack,
  onCodeSubmit,
  emailState,
}: {
  code: string
  setCode: (s: string) => void
  onBack: () => void
  onCodeSubmit: React.FormEventHandler<HTMLFormElement>
  emailState: ReturnType<typeof useLoginWithEmail>['state']
}) {
  return (
    <form className="grid gap-3" onSubmit={onCodeSubmit}>
      <label className="grid gap-2">
        <span className="text-sm text-[#9CB9D0]">Enter 6-digit code</span>
        <input
          type="text"
          pattern="[0-9]{6}"
          inputMode="numeric"
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full min-w-0 rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-center font-mono text-base tracking-[0.35em] text-[#EAF6FF] outline-none focus:ring-2 focus:ring-amber-400/60"
        />
      </label>
      <div className="mt-1 flex justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-transparent px-3 py-2.5 text-[#9CB9D0] hover:text-white"
        >
          Edit email
        </button>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-2xl border border-amber-400/70 bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 px-5 py-3 font-bold text-white shadow-[0_10px_28px_rgba(251,146,60,0.45)] hover:shadow-[0_14px_34px_rgba(251,146,60,0.6)] active:scale-[.98] disabled:opacity-60"
          disabled={emailState.status === 'submitting-code' || emailState.status === 'sending-code'}
        >
          {emailState.status === 'submitting-code' ? 'Verifying…' : 'Verify & continue'}
        </button>
      </div>
    </form>
  )
}

function WalletRow({
  label,
  hint,
  onClick,
}: { label: string; hint?: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full inline-flex items-center justify-between rounded-2xl border border-white/15 bg-gradient-to-r from-[#0b122a] via-[#111a39] to-[#0b122a] px-4 py-3 text-white/95 hover:bg-white/10"
    >
      <span className="inline-flex items-center gap-2">
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-white/10">
          <WalletIcon />
        </span>
        {label}
      </span>
      {hint ? <span className="text-xs opacity-70">{hint}</span> : null}
    </button>
  )
}

function WalletPickerScrollable({
  connectWith,
  onBack,
}: {
  connectWith: (w: WalletId) => Promise<void> | void
  onBack: () => void
}) {
  return (
    <div className="grid gap-2">
      <div className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
        Choose a wallet to continue
      </div>

      <div className="max-h-[48vh] overflow-y-auto pr-1">
        <style>{`
          .wallet-scroll::-webkit-scrollbar { width: 8px; }
          .wallet-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.06); border-radius: 9999px; }
          .wallet-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.25); border-radius: 9999px; }
          .wallet-scroll:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.35); }
        `}</style>
        <div className="wallet-scroll grid gap-2">
          <WalletRow label="Zerion" hint="App / Extension" onClick={() => connectWith('zerion')} />
        </div>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="mt-1 text-sm text-white/80 hover:text-white underline underline-offset-4"
      >
        Back
      </button>
    </div>
  )
}

function GoogleButton({
  onClick,
  disabled,
}: {
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      className="flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-4 py-3 font-semibold text-white/95 hover:bg-white/10 disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
      aria-label="Continue with Google"
    >
      <GoogleIcon />
      <span className="ml-2">Google</span>
    </button>
  )
}

function CreateWalletPanel({
  variant,
  creating,
  onCreate,
}: {
  variant: 'email' | 'oauth'
  creating: boolean
  onCreate: () => void
}) {
  const copy = variant === 'email' ? 'Continue with your email session.' : 'Continue with your Google session.'
  const color =
    variant === 'email'
      ? 'border-amber-400/70 bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500'
      : 'border-lime-400/60 bg-gradient-to-tr from-lime-400 via-emerald-500 to-amber-400'

  return (
    <div className="grid gap-4">
      <div className="rounded-xl bg-amber-500/10 border border-amber-400/30 px-4 py-3 text-sm text-amber-50/90">
        You don’t have a wallet address yet. We’ll create one now to continue.
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-white/80 mb-3">{copy}</div>
        <button
          onClick={onCreate}
          disabled={creating}
          className={`inline-flex w-full items-center justify-center rounded-2xl ${color} px-5 py-3 font-bold text-white shadow-[0_10px_28px_rgba(251,146,60,0.45)] active:scale-[.98] disabled:opacity-60`}
        >
          {creating ? 'Creating wallet…' : 'Create wallet'}
        </button>
      </div>

      <div className="grid gap-2 opacity-60">
        <div className="grid gap-2">
          <WalletRow label="Zerion" />
        </div>
        <GoogleButton onClick={() => { }} disabled />
      </div>
    </div>
  )
}

const LoginModal: React.FC<LoginModalProps> = ({ open, onClose, onAuthenticated }) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const { ready, authenticated, user, logout } = usePrivy()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [emailStep, setEmailStep] = useState<'enter-email' | 'enter-code'>('enter-email')
  const [error, setError] = useState('')

  const [loginMethod, setLoginMethod] = useState<'email' | 'oauth' | null>(deriveAuthMethodFromUser(user))
  const [walletMode, setWalletMode] = useState(false)
  const [creating, setCreating] = useState(false)

  const { createWallet } = useCreateWallet()
  const [existingAddress, setExistingAddress] = useState<string | undefined>(getPrimaryWalletAddress(user))
  const hasAnyWallet = Boolean(existingAddress)

  const { connectWallet } = useConnectWallet({
    onSuccess: () => onClose?.(),
    onError: (err: any) => setError((err?.message ?? err?.code ?? String(err)) || 'Failed to connect wallet'),
  })

  const { login } = useLogin()

  const { initOAuth, loading: oauthLoading } = useLoginWithOAuth({
    onComplete: async () => {
      setLoginMethod('oauth')
    },
    onError: (err: any) => setError((err?.message ?? err?.code ?? String(err)) || 'OAuth error'),
  })

  const { sendCode, loginWithCode, state: emailState } = useLoginWithEmail({
    onComplete: async () => {
      setLoginMethod('email')
    },
    onError: (err: any) => setError((err?.message ?? err?.code ?? String(err)) || 'Email login error'),
  })

  const [networkOpen, setNetworkOpen] = useState(false)
  const allowedChain = getAllowedChainFromEnv() || {
    caip2: 'eip155:16661',
    decimalChainId: 16661,
    hexChainId: '0x4115',
    chainName: '0G Mainnet',
    rpcUrls: ['https://evmrpc.0g.ai'],
    blockExplorerUrls: ['https://chainscan.0g.ai'],
  }

  const preflightEnsureAllowedNetwork = async (onAllowed: () => void) => {
    try {
      const eth = (window as any).ethereum
      if (!eth?.request) {
        onAllowed()
        return
      }
      const current = await eth.request({ method: 'eth_chainId' }).catch(() => undefined)
      if (typeof current === 'string' && current.toLowerCase() !== allowedChain.hexChainId.toLowerCase()) {
        setNetworkOpen(true)
        return
      }
      onAllowed()
    } catch {
      setNetworkOpen(true)
    }
  }

  const handleCreateEmbeddedWallet = async () => {
    setError('')
    setCreating(true)
    try {
      await createWallet()
    } catch (err: any) {
      setError(err?.message || 'Failed to create wallet')
    } finally {
      setCreating(false)
    }
  }

  const connectWith = async (wallet: WalletId) => {
    try {
      try { if (dialogRef.current?.open) dialogRef.current.close() } catch { }
      onClose?.()
      await connectWallet({ walletList: [wallet] })
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('connectWith error', err)
      setError(err?.message || 'Failed to connect wallet')
    }
  }

  useEffect(() => {
    setError('')
    setEmail('')
    setCode('')
    setEmailStep('enter-email')
    setWalletMode(false)
    setExistingAddress(getPrimaryWalletAddress(user))
    setLoginMethod(deriveAuthMethodFromUser(user))
  }, [open, user])

  useEffect(() => {
    if (open && dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal()
    if (!open && dialogRef.current?.open) dialogRef.current.close()
    return () => {
      try {
        if (dialogRef.current?.open) dialogRef.current.close()
      } catch {
        // ignore
      }
    }
  }, [open])

  useEffect(() => {
    setExistingAddress(getPrimaryWalletAddress(user))
    setLoginMethod((prev) => prev ?? deriveAuthMethodFromUser(user))
  }, [user])

  useEffect(() => {
    if (!ready || !authenticated) return
    const currentAddress = getPrimaryWalletAddress(user)
    if (currentAddress) {
      setExistingAddress(currentAddress)
      if (onAuthenticated) {
        onAuthenticated(currentAddress)
      }
      localStorage.setItem('walletAddress', currentAddress)
      onClose?.()
      return
    }
    setLoginMethod((prev) => prev ?? deriveAuthMethodFromUser(user) ?? 'email')
  }, [ready, authenticated, user, onClose, onAuthenticated])

  const handleClose = () => {
    try {
      if (dialogRef.current?.open) dialogRef.current.close()
    } catch {
      // ignore
    }
    onClose()
  }

  const handleLogout = () => {
    localStorage.removeItem('walletAddress')
    logout().catch(() => { })
  }

  const onEmailSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setError('')
    try {
      setLoginMethod('email')
      await sendCode({ email })
      setEmailStep('enter-code')
      setWalletMode(false)
    } catch (err: any) {
      setError(err?.message || 'Failed to send code')
    }
  }

  const onCodeSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await loginWithCode({ code })
    } catch (err: any) {
      setError(err?.message || 'Invalid code')
    }
  }

  const showCustomCreateUI = Boolean(authenticated && !hasAnyWallet)

  const requestClose = () => {
    if (showCustomCreateUI && authenticated) {
      logout().catch(() => { })
    }
    try { if (dialogRef.current?.open) dialogRef.current.close() } catch { }
    onClose?.()
  }

  if (!open) return null

  return (
    <dialog
      ref={dialogRef}
      onCancel={requestClose}
      style={{ minWidth: "100vw", minHeight: "100vh" }}
      className="fixed inset-0 z-50 m-0 flex items-center justify-center bg-black/40 p-4 sm:p-6"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-amber-400/60 bg-[rgba(24,16,8,0.96)] shadow-[0_30px_80px_rgba(0,0,0,0.70)]">
        <button
          type="button"
          onClick={requestClose}
          aria-label="Close"
          className="absolute right-3 top-2 text-2xl leading-none text-slate-300 hover:text-white bg-transparent p-0"
        >
          ×
        </button>

        <div className="p-6 pt-8 text-[#FFF7ED]">
          <div className="mb-4 text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-wider bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_2px_16px_rgba(251,146,60,0.45)]">
              CONNECT WALLET
            </h2>
            <p className="mt-2 text-xs text-amber-50/80">
              Login with Privy to start playing Zero Dash.
            </p>
          </div>

          <ErrorBanner error={error} />
          <EmbeddedWalletBadge address={authenticated ? existingAddress : undefined} />

          {showCustomCreateUI ? (
            <CreateWalletPanel
              variant={loginMethod === 'oauth' ? 'oauth' : 'email'}
              creating={creating}
              onCreate={handleCreateEmbeddedWallet}
            />
          ) : (
            <div className="mt-4 space-y-4">
              {!authenticated && (
                <>
                  {!walletMode ? (
                    <>
                      {emailStep === 'enter-email' ? (
                        <EmailForm
                          email={email}
                          setEmail={setEmail}
                          emailState={emailState}
                          onEmailSubmit={onEmailSubmit}
                          setLoginMethod={setLoginMethod}
                          disabled={!ready}
                        />
                      ) : (
                        <CodeForm
                          code={code}
                          setCode={setCode}
                          onBack={() => {
                            setError('')
                            setCode('')
                            setEmail('')
                            setLoginMethod(null)
                            setEmailStep('enter-email')
                          }}
                          onCodeSubmit={onCodeSubmit}
                          emailState={emailState}
                        />
                      )}

                      <DividerOr />

                      <button
                        type="button"
                        className="w-full inline-flex items-center justify-center rounded-2xl border border-emerald-400/50 bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-500 px-4 py-3 text-sm md:text-base font-bold text-white shadow-[0_10px_28px_rgba(16,185,129,0.35)] hover:shadow-[0_14px_34px_rgba(16,185,129,0.45)] active:scale-[.99] transition disabled:opacity-60"
                        onClick={() => {
                          if (emailStep === 'enter-code') return
                          preflightEnsureAllowedNetwork(() => {
                            try { if (dialogRef.current?.open) dialogRef.current.close() } catch { }
                            if (hasInjectedZerionWallet()) {
                              // `connectWallet` links an external wallet; it doesn't authenticate a new user.
                              // Use `login` so the connected wallet results in an authenticated Privy session.
                              login({ loginMethods: ['wallet'] })
                              return
                            }
                            login({ loginMethods: ['wallet'] })
                          })
                        }}
                        disabled={emailStep === 'enter-code' || !ready}
                      >
                        <span className="mr-2 inline-flex items-center">
                          <WalletIcon />
                        </span>
                        <span>Connect Wallet</span>
                      </button>

                      <GoogleButton
                        disabled={oauthLoading || emailStep === 'enter-code' || !ready}
                        onClick={() => {
                          if (emailStep === 'enter-code') return
                          setLoginMethod('oauth')
                          initOAuth({ provider: 'google' })
                        }}
                      />
                    </>
                  ) : (
                    <WalletPickerScrollable
                      connectWith={async (w) => {
                        await preflightEnsureAllowedNetwork(async () => {
                          await connectWith(w)
                        })
                      }}
                      onBack={() => setWalletMode(false)}
                    />
                  )}
                </>
              )}

              {authenticated && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs md:text-sm font-semibold text-white/90 hover:bg-white/10"
                >
                  Logout
                </button>
              )}

              {!ready && (
                <p className="text-[11px] text-amber-100/70 text-center">
                  Initializing Privy&hellip;
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <NetworkModal
        open={networkOpen}
        onClose={() => setNetworkOpen(false)}
        onSwitched={() => {
          setNetworkOpen(false)
        }}
      />
    </dialog>
  )
}

export default LoginModal