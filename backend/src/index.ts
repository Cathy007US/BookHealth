import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import { config } from './config';
import { initSocket } from './config/socket';
import { pool } from './config/database';

// 路由
import authRoutes from './routes/auth';
import institutionRoutes from './routes/institution';
import packageRoutes from './routes/package';
import orderRoutes from './routes/order';
import reportRoutes from './routes/report';
import consultationRoutes from './routes/consultation';
import uploadRoutes from './routes/upload';
import adminRoutes from './routes/admin';

const app = express();
const httpServer = createServer(app);

// 中间件
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件（上传的文件）
app.use(`/${config.upload.dir}`, express.static(path.join(__dirname, '..', config.upload.dir)));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ code: 404, message: 'API not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error]', err.message);
  res.status(500).json({ code: 500, message: err.message || 'Internal server error' });
});

// Socket.IO
const io = initSocket(httpServer);

// 启动服务
httpServer.listen(config.port, () => {
  console.log(`[BookHealth] Server running on http://localhost:${config.port}`);
  console.log(`[BookHealth] Environment: ${config.nodeEnv}`);
});

// 测试数据库连接
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('[DB] Connection failed:', err.message);
  } else {
    console.log('[DB] Connected successfully at', result.rows[0].now);
  }
});

export { app, io };
