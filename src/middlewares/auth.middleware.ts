import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/express';

//Check JWT token
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <TOKEN>

  if (!token) {
    return res.status(401).json({ error: 'Yêu cầu Token xác thực (Unauthorized).' });
  }
  const secret = process.env.JWT_SECRET || 'secret';
  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
    }

    req.user = decoded as JwtPayload;
    next();
  });
}

// Check for role
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Chưa xác thực người dùng.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Chỉ có tài khoản Admin mới có quyền thực hiện thao tác xóa.' });
  }

  next();
}