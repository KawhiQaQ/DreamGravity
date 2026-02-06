import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initDatabase, closeDatabase } from './database';
import { dreamRoutes, statisticsRoutes, followupRoutes, patternRoutes, exportRoutes, collectiveRoutes, weeklyReportRoutes } from './routes';
import elementGraphRoutes from './routes/elementGraphRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'http://localhost:5173'
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// 静态文件服务 - 提供本地保存的图片
app.use('/api/images', express.static(path.join(process.cwd(), 'data', 'images')));

// Initialize database
initDatabase();

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/dreams', dreamRoutes);
app.use('/api/dreams', followupRoutes);
app.use('/api/dreams', patternRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/element-graph', elementGraphRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/collective', collectiveRoutes);
app.use('/api/weekly-reports', weeklyReportRoutes);
app.use('/api', followupRoutes); // For /api/followups/:id routes
app.use('/api/patterns', patternRoutes); // For /api/patterns/summary

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'internal_error',
    message: err.message || 'An unexpected error occurred',
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  closeDatabase();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  closeDatabase();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
