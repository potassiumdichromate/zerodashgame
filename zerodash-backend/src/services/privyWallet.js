const { PrivyClient } = require('@privy-io/server-auth');

let cached;

const getPrivyClient = () => {
  if (cached) return cached;
  const appId = process.env.PRIVY_APP_ID || process.env.PRIVY_CLIENT_ID;
  const secret = process.env.PRIVY_APP_SECRET || process.env.PRIVY_SECRET_KEY;
  if (!appId || !secret) return null;
  const authorizationPrivateKey = process.env.PRIVY_WALLET_AUTHORIZATION_PRIVATE_KEY;
  if (authorizationPrivateKey) {
    cached = new PrivyClient(appId, secret, {
      walletApi: { authorizationPrivateKey },
    });
    return cached;
  }
  cached = new PrivyClient(appId, secret);
  return cached;
};

const extractEthWallet = (user) => {
  const accounts = user?.linkedAccounts || [];
  const ethPreferred = accounts.find(
    (a) =>
      a.type === 'wallet' &&
      a.address &&
      (a.chainType === 'ethereum' || a.chainType === 'eip155:1')
  );
  if (ethPreferred?.address) return ethPreferred.address;
  const any = accounts.find((a) => a.type === 'wallet' && a.address);
  return any?.address || null;
};

/**
 * Resolve an Ethereum wallet from a browser / identity JWT using Privy's recommended flows.
 */
async function walletFromBrowserJwt(jwt) {
  const privy = getPrivyClient();
  if (!privy) {
    throw new Error('privy_not_configured');
  }
  try {
    const userByToken = await privy.getUser({ idToken: jwt });
    const a = extractEthWallet(userByToken);
    if (a) return String(a).toLowerCase();
  } catch (_) {
    /* fall through */
  }

  try {
    const claims = await privy.verifyAuthToken(jwt);
    const uid = claims.userId || claims.sub;
    if (!uid) throw new Error('no_user_id_claim');
    const user =
      typeof privy.getUserById === 'function'
        ? await privy.getUserById(uid)
        : typeof privy.getUser === 'function'
          ? await privy.getUser({ userId: uid })
          : null;
    const a = user ? extractEthWallet(user) : null;
    if (a) return String(a).toLowerCase();
  } catch (e) {
    const msg = e?.message ? String(e.message) : String(e);
    throw new Error(`privy_resolve_failed:${msg}`);
  }

  throw new Error('wallet_not_found_on_privy_user');
}

module.exports = {
  getPrivyClient,
  walletFromBrowserJwt,
};
