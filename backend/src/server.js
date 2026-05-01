require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const transactionRoutes = require('./routes/transactions');
const insightRoutes = require('./routes/insights');
const authRoutes = require('./routes/auth');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/insights', insightRoutes);

app.get('/', (req, res) => {
  res.json({ message: '🚀 Smart Cash Monitor API is running!' });
});

// erro genérico pra não vazar stack trace pro cliente
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Erro interno no servidor' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
