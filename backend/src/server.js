require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const { startCronJobs } = require('./utils/cron');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// API routes
app.use('/api', routes);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 LocaTech API running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.EVOLUTION_API_URL) {
    startCronJobs();
    console.log(`📱 WhatsApp: ${process.env.EVOLUTION_API_URL}`);
  } else {
    console.log(`📱 WhatsApp: desativado (configure EVOLUTION_API_URL no .env)`);
  }
});

module.exports = app;
