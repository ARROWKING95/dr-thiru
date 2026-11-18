import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB, getDBStatus } from './config/db.js';
import { dbStore } from './services/dbStore.js';

import authRoutes from './routes/authRoutes.js';
import caseRoutes from './routes/caseRoutes.js';
import opdRoutes from './routes/opdRoutes.js';
import labRoutes from './routes/labRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import pharmacyRoutes from './routes/pharmacyRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';
import clinicalRoutes from './routes/clinicalRoutes.js';
import mrdRoutes from './routes/mrdRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// System Health & Diagnostics
app.get('/api/health', (req, res) => {
  const dbStatus = getDBStatus();
  res.json({
    status: 'online',
    system: 'MedGuard Healthcare System API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    mrdAdmin: 'dr.thirumalai'
  });
});

// Mount MERN API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/opd', opdRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/clinical', clinicalRoutes);
app.use('/api/mrd', mrdRoutes);

// In production, serve the React build
const distPath = path.join(rootDir, 'dist');
app.use(express.static(distPath));

// For any non-API route, serve index.html or fallback
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send(`
        <html>
          <body style="font-family:sans-serif;text-align:center;padding:50px;">
            <h2>MedGuard Healthcare API Server is Running!</h2>
            <p>Port: ${PORT}</p>
            <p>Run the Vite client on <a href="http://localhost:5173">http://localhost:5173</a> or run <code>npm run build</code> to produce production files.</p>
          </body>
        </html>
      `);
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[API Server Error]:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Initialize MongoDB & Start Server
const startServer = async () => {
  console.log('----------------------------------------------------');
  console.log('  🏥 MedGuard Healthcare Clinical System - MERN Stack');
  console.log('----------------------------------------------------');

  await connectDB();
  await dbStore.seedIfEmpty();

  app.listen(PORT, () => {
    console.log(`[Express] Backend server running at http://localhost:${PORT}`);
    console.log(`[Express] Health check: http://localhost:${PORT}/api/health`);
    console.log(`[Express] Frontend proxy configured to http://localhost:5173`);
    console.log('----------------------------------------------------');
  });
};

startServer();
