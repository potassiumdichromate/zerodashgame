const ETH_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

let inflightJwtPromise = null;

function normalizeWallet(value) {
  const wallet = String(value || "").trim();
  return ETH_ADDRESS_RE.test(wallet) ? wallet.toLowerCase() : null;
}

function backendNeedsJwt(backendUrl) {
  const url = String(backendUrl || "").toLowerCase();
  return url.includes("zerog-zerodash.onrender.com");
}

export function getStoredPlayerAuthToken() {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("zgJwt") ||
    localStorage.getItem("zgBrowserJwt") ||
    null
  );
}

export function storeBrowserPlayerAuthToken(token) {
  if (typeof window === "undefined" || !token) return;
  localStorage.setItem("zgBrowserJwt", token);
}

export async function ensurePlayerAuthToken(walletAddress) {
  const cachedToken = getStoredPlayerAuthToken();
  if (cachedToken) return cachedToken;

  const wallet = normalizeWallet(walletAddress || localStorage.getItem("walletAddress"));
  if (!wallet || typeof window?.zeroDashDoJwtAuth !== "function") {
    return null;
  }

  if (!inflightJwtPromise) {
    inflightJwtPromise = Promise.resolve(window.zeroDashDoJwtAuth(wallet))
      .finally(() => {
        inflightJwtPromise = null;
      });
  }

  return inflightJwtPromise;
}

export async function buildPlayerAuthHeaders({
  walletAddress,
  backendUrl,
  headers = {},
} = {}) {
  const wallet = normalizeWallet(walletAddress || localStorage.getItem("walletAddress"));

  if (!backendNeedsJwt(backendUrl) && wallet) {
    return {
      ...headers,
      Authorization: `Bearer ${wallet}`,
    };
  }

  const token = await ensurePlayerAuthToken(wallet);
  if (!token) {
    throw new Error("Player authentication required");
  }

  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
}
