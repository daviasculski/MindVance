import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import dbPool from './config/database';

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/health/db', async (req, res) => {
  try {
    const client = await dbPool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    return res.status(200).json({ status: 'ok', dbTime: result.rows[0].now });
  } catch (error) {
    console.error('Database connection failed:', error);
    return res.status(500).json({ status: 'error', message: 'Database connection failed.' });
  }
});

// Aqui você importará e usará suas rotas no futuro
// Ex: import ideaRoutes from './routes/ideaRoutes';
// app.use('/api/ideas', ideaRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});