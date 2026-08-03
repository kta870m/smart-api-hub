import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory Map lưu vết IP
const ipStore = new Map<string, RateLimitRecord>();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 100;  

export function customRateLimiter(req: Request, res: Response, next: NextFunction) {
  // Lấy IP của Client (Hỗ trợ cả trường hợp chạy sau Reverse Proxy/Docker)
  const clientIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    'unknown_ip';

  const currentTime = Date.now();
  const record = ipStore.get(clientIp);

  if (!record || currentTime > record.resetTime) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: currentTime + WINDOW_MS,
    };
    ipStore.set(clientIp, newRecord);

    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS.toString());
    res.setHeader('X-RateLimit-Remaining', (MAX_REQUESTS - 1).toString());
    return next();
  }

  if (record.count >= MAX_REQUESTS) {
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS.toString());
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('Retry-After', Math.ceil((record.resetTime - currentTime) / 1000).toString());

    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Bạn đã vượt quá giới hạn 100 requests/phút. Vui lòng thử lại sau.',
    });
  }

  record.count += 1;
  ipStore.set(clientIp, record);

  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS.toString());
  res.setHeader('X-RateLimit-Remaining', (MAX_REQUESTS - record.count).toString());

  next();
}