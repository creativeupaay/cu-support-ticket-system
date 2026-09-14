import rateLimit from 'express-rate-limit';

export const publicTicketRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 submissions per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many tickets submitted from this IP, please try again in 15 minutes',
    },
  },
});
