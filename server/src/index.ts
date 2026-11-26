import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './auth.js';
import { catalogRouter } from './catalog.js';
import { warehouseRouter } from './warehouse.js';
import { salesRouter } from './sales.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api', catalogRouter);
app.use('/api', warehouseRouter);
app.use('/api', salesRouter);

const port = 3000;
app.listen(port, () => {
  console.log(`Server jalan di http://localhost:${port}`);
});