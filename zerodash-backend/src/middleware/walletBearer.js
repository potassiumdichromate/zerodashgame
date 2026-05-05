const ETH_ADDR = /^0x[a-fA-F0-9]{40}$/;

function walletBearerOptional(req, res, next) {
  const raw = req.headers.authorization || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7).trim() : '';
  if (ETH_ADDR.test(token)) {
    req.walletAddress = token.toLowerCase();
  } else {
    req.walletAddress = null;
  }
  next();
}

function walletBearerRequired(req, res, next) {
  walletBearerOptional(req, res, () => {
    if (!req.walletAddress) {
      return res.status(401).json({ message: 'Bearer wallet address required' });
    }
    return next();
  });
}

module.exports = { walletBearerOptional, walletBearerRequired };
