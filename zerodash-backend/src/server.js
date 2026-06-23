require('dotenv').config();

const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const mongoose = require('mongoose');

const playerRoutes = require('./routes/player');
const nftRoutes = require('./routes/nft');
const zerogRoutes = require('./routes/zerog');
const kultPointsRoutes = require('./routes/kultPoints');
const zdashBlockchain = require('./services/zdashBlockchainService');

const PORT = Number(process.env.PORT || 8788);

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: true }));
app.use(express.json({ limit: '400kb' }));

app.get('/', (_req, res) => {
  res.json({ service: 'zerodash-backend', ok: true, paths: ['/player', '/nft', '/zerog'] });
});

app.use('/player', playerRoutes);
app.use('/nft', nftRoutes);
app.use('/zerog', zerogRoutes);
app.use('/kult-points', kultPointsRoutes);

async function bootstrap() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is required — set it in environment or .env');
    process.exit(1);
  }
  mongoose.set('strictQuery', false);
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME || undefined });
  console.log('[zd] mongo connected');

  zdashBlockchain.lazyInit().catch(() => {});

  app.listen(PORT, () => {
    console.log(`[zd] listening on ${PORT}`);
  });
}

bootstrap().catch((e) => {
  console.error('[zd] fatal', e);
  process.exit(1);
});
