import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export function initSocket(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  // 认证中间件
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string;
    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwt.secret) as any;
        (socket as any).userId = decoded.userId;
      } catch {
        // 未认证也能连接，只是没有 userId
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    const userId = (socket as any).userId;
    if (userId) {
      socket.join(`user:${userId}`);
    }

    // 加入咨询房间
    socket.on('join:consultation', (consultationId: number) => {
      socket.join(`consultation:${consultationId}`);
    });

    // 发送咨询消息
    socket.on('message:consultation', (data: { consultationId: number; content: string; sender: 'user' | 'doctor' }) => {
      io.to(`consultation:${data.consultationId}`).emit('message:consultation', {
        ...data,
        timestamp: new Date().toISOString(),
      });
    });

    // 订单状态变更通知
    socket.on('order:status-change', (data: { orderId: number; status: number }) => {
      if (userId) {
        io.to(`user:${userId}`).emit('order:updated', data);
      }
    });

    socket.on('disconnect', () => {
      // cleanup
    });
  });

  return io;
}
