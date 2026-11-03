import { app } from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.PORT, () => {
  console.log('====================================================');
  console.log(`🚀 FitVision3D Auth Service running on port ${env.PORT}`);
  console.log(`📡 Base API URL: http://localhost:${env.PORT}/api/v1/auth`);
  console.log(`🧪 Test Client UI: http://localhost:${env.PORT}/test-auth.html`);
  console.log('====================================================');
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server gracefully.');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});

