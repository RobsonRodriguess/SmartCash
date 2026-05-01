require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const transactionRoutes = require('./routes/transactions');
const insightRoutes = require('./routes/insights');
const authRoutes = require('./routes/auth');

connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10kb' })); // Previne ataques de payload gigante

// Middlewares de Segurança
app.use(helmet()); // Set HTTP headers de segurança
app.use(mongoSanitize()); // Previne injeção de NoSQL substituindo $ e . no body/query/params

// Custom XSS Sanitizer Middleware usando DOMPurify
const xssSanitizer = (req, res, next) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = DOMPurify.sanitize(req.body[key]);
      }
    }
  }
  next();
};
app.use(xssSanitizer);

// Rate Limiting para evitar força bruta
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requests por IP a cada 15 min
  message: 'Muitas requisições deste IP, tente novamente em 15 minutos.',
});
app.use('/api/', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/insights', insightRoutes);

app.get('/', (req, res) => {
  res.json({ message: '🚀 Smart Cash Monitor API is running!' });
});

// erro genérico pra não vazar stack trace pro cliente
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, error: 'O arquivo/dados enviados são muito grandes.' });
  }
  
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Erro interno no servidor' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
