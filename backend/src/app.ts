import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { authRouter } from './modules/auth/auth.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { env } from './config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// 1. Cấu hình CORS (Cho phép truyền nhận Cookie HttpOnly với Frontend)
app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép mọi localhost trong quá trình phát triển
      if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        callback(null, true);
      } else if (origin === env.CLIENT_ORIGIN) {
        callback(null, true);
      } else {
        callback(null, true); // Dev mode: Cho phép mọi origin
      }
    },
    credentials: true, // BẮT BUỘC để nhận/gửi Cookie HttpOnly
  })
);

// 2. Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 3. Phục vụ thư mục tĩnh (Dùng cho Giao diện Test public/test-auth.html)
app.use(express.static(path.resolve(__dirname, '../../public')));
app.use(express.static(path.resolve(__dirname, '../public')));

// 4. Mount API Routes
app.use('/api/v1/auth', authRouter);

// 5. Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'FitVision3D Auth Service',
    time: new Date().toISOString(),
  });
});

// 6. Central Error Handler (Bọc response theo ApiResponse envelope)
app.use(errorHandler);

