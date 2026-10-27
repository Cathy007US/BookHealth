import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface JwtPayload {
  userId: number;
  openid?: string;
  phone?: string;
}

// 扩展 Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      adminUser?: { adminId: number; username: string; role: string };
    }
  }
}

// 用户认证中间件
export function authRequired(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录' });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ code: 401, message: '登录已过期' });
  }
}

// 可选认证（不强制，但有 token 就解析）
export function authOptional(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      req.user = decoded;
    } catch {
      // ignore
    }
  }
  next();
}

// 管理员认证中间件
export function adminAuthRequired(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '管理员未登录' });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, config.adminJwt.secret) as any;
    req.adminUser = decoded;
    next();
  } catch {
    return res.status(401).json({ code: 401, message: '管理员登录已过期' });
  }
}

// 仅超级管理员
export function adminSuperOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.adminUser || req.adminUser.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '无权限' });
  }
  next();
}
