const { ethers } = require('ethers');

const NFT_ABI = [
  'function mint(bytes32[] proofs) payable',
  'event Minted(address indexed to, uint256 indexed tokenId)',
  'event Transfer(address indexed from,address indexed to,uint256 indexed tokenId)',
];

function getContractSpec() {
  const raw = process.env.NFT_CONTRACT_ADDRESS || '';
  const address = raw.trim().replace(/^['"]+|['"]+$/g, '');
  return address && ethers.isAddress(address) ? address : null;
}

function getSigner() {
  const pk = (process.env.NFT_RELAYER_PRIVATE_KEY || '').trim();
  const rpc = (
    process.env.OG_RPC_URL ||
    process.env.ZERO_G_RPC_URL ||
    process.env.ZERO_G_RPC ||
    'https://evmrpc.0g.ai'
  ).trim();
  if (!pk || !/^0x[0-9a-fA-F]{64}$/.test(pk)) return null;
  const provider = new ethers.JsonRpcProvider(rpc);
  return new ethers.Wallet(pk, provider);
}

const expectedSignMessage = (walletAddress) => {
  const prefix = process.env.NFT_MINT_MESSAGE_PREFIX || 'Mint Zero Dash Pass NFT to';
  return `${prefix} ${walletAddress}`;
};

/**
 * Relay gasless-style mint — user proves control with a personal_sign over the canonical message.
 */
async function relayMint({ walletAddress, merkleProof, signature }) {
  const signer = getSigner();
  const contractAddr = getContractSpec();
  if (!signer || !contractAddr) {
    const err = new Error('NFT relayer not configured (NFT_RELAYER_PRIVATE_KEY / NFT_CONTRACT_ADDRESS)');
    err.code = 'RELAYER_UNAVAILABLE';
    throw err;
  }

  const expected = expectedSignMessage(walletAddress);
  const recovered = ethers.verifyMessage(expected, signature);
  if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
    const err = new Error('Signature does not match wallet');
    err.code = 'BAD_SIGNATURE';
    throw err;
  }

  const contract = new ethers.Contract(contractAddr, NFT_ABI, signer);
  const proof = Array.isArray(merkleProof) ? merkleProof.map((x) => String(x)) : [];

  let value = 0n;
  if (process.env.NFT_MINT_VALUE_WEI && /^\d+$/.test(process.env.NFT_MINT_VALUE_WEI)) {
    value = BigInt(process.env.NFT_MINT_VALUE_WEI);
  }

  const tx = await contract.mint(proof, { value });
  const receipt = await tx.wait();
  let tokenId = null;

  for (const log of receipt.logs || []) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === 'Minted') {
        tokenId = parsed.args.tokenId?.toString();
        break;
      }
      if (parsed?.name === 'Transfer' && parsed.args.from === ethers.ZeroAddress) {
        tokenId = parsed.args.tokenId?.toString();
        break;
      }
    } catch (_) {
      /* not this contract fragment */
    }
  }

  return {
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    tokenId: tokenId || '1',
    gasPaidByDeployer: true,
  };
}

module.exports = {
  relayMint,
  getContractSpec,
  expectedSignMessage,
};
