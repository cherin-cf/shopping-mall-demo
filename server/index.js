const dotenv = require('dotenv');
// 환경 변수 설정 (가장 먼저 실행되어야 함!)
dotenv.config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const connectDB = require('./src/config/db');

// Express 앱 생성
const app = express();

// MongoDB 연결
connectDB();

// 미들웨어
// CORS 설정: 환경 변수로 클라이언트 URL 지정, 없으면 모든 origin 허용
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 요청 로깅 (디버깅용)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// 라우트
app.use('/api/products', require('./src/routes/product.routes'));
app.use('/api/users', require('./src/routes/user.routes'));
app.use('/api/cart', require('./src/routes/cart.routes'));
app.use('/api/orders', require('./src/routes/order.routes'));

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: 'Shopping Mall API Server is running!' });
});

// 404 에러 핸들러
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// 포트를 사용 중인 프로세스 종료 함수 (Windows)
const killProcessOnPort = async (port) => {
  if (process.platform !== 'win32') {
    return; // Windows가 아니면 스킵
  }

  try {
    // 포트를 사용 중인 프로세스 찾기
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    const lines = stdout.trim().split('\n');
    
    if (lines.length === 0 || lines[0] === '') {
      return; // 포트를 사용 중인 프로세스 없음
    }

    // PID 추출 (마지막 컬럼)
    const pids = new Set();
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length > 0) {
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid) && pid !== '0') {
          pids.add(pid);
        }
      }
    });

    // 각 PID 종료
    for (const pid of pids) {
      try {
        await execAsync(`taskkill /F /PID ${pid}`);
        console.log(`포트 ${port}를 사용하던 프로세스(PID: ${pid})를 종료했습니다.`);
      } catch (err) {
        // 프로세스가 이미 종료되었거나 권한 문제일 수 있음
        // 무시하고 계속 진행
      }
    }

    // 프로세스 종료 후 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (err) {
    // netstat에서 아무것도 찾지 못한 경우 (포트가 비어있음)
    // 정상적인 상황이므로 무시
  }
};

// 서버 시작
const PORT = process.env.PORT || 5000;
let server;

// 서버 시작 함수
const startServer = async () => {
  // 서버 시작 전에 포트를 사용 중인 프로세스 종료
  await killProcessOnPort(PORT);

  return new Promise((resolve, reject) => {
    try {
      server = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        resolve(server);
      });

      // 서버 시작 에러 처리
      server.on('error', async (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`\n포트 ${PORT}가 사용 중입니다. 기존 프로세스를 종료합니다...`);
          await killProcessOnPort(PORT);
          
          // 다시 시도
          setTimeout(() => {
            try {
              server = app.listen(PORT, () => {
                console.log(`Server is running on port ${PORT}`);
                resolve(server);
              });
            } catch (retryErr) {
              console.error(`\n포트 ${PORT}를 사용할 수 없습니다.`);
              console.error('다른 포트를 사용하거나 수동으로 프로세스를 종료하세요.\n');
              reject(retryErr);
            }
          }, 1000);
        } else {
          reject(err);
        }
      });
    } catch (err) {
      if (err.code === 'EADDRINUSE') {
        console.log(`\n포트 ${PORT}가 사용 중입니다. 기존 프로세스를 종료합니다...`);
        killProcessOnPort(PORT).then(() => {
          // 다시 시도
          setTimeout(() => {
            try {
              server = app.listen(PORT, () => {
                console.log(`Server is running on port ${PORT}`);
                resolve(server);
              });
            } catch (retryErr) {
              console.error(`\n포트 ${PORT}를 사용할 수 없습니다.`);
              console.error('다른 포트를 사용하거나 수동으로 프로세스를 종료하세요.\n');
              reject(retryErr);
            }
          }, 1000);
        });
      } else {
        reject(err);
      }
    }
  });
};

// 서버 시작
startServer().catch((err) => {
  console.error('서버 시작 중 오류:', err);
  process.exit(1);
});

// Graceful Shutdown 처리
let isShuttingDown = false;

const gracefulShutdown = (signal) => {
  if (isShuttingDown) {
    console.log('이미 종료 중입니다...');
    return;
  }
  isShuttingDown = true;
  
  console.log(`\n${signal} 신호를 받았습니다. 서버를 종료합니다...`);
  
  // 서버가 시작되지 않았으면 바로 종료
  if (!server || !server.listening) {
    console.log('서버가 실행 중이 아닙니다.');
    mongoose.connection.close()
      .then(() => {
        console.log('MongoDB 연결이 종료되었습니다.');
        process.exit(0);
      })
      .catch(() => {
        process.exit(0);
      });
    return;
  }
  
  // 서버 종료
  server.close(() => {
    console.log('HTTP 서버가 종료되었습니다.');
    
    // MongoDB 연결 종료
    mongoose.connection.close()
      .then(() => {
        console.log('MongoDB 연결이 종료되었습니다.');
        process.exit(0);
      })
      .catch((err) => {
        console.error('MongoDB 종료 중 오류:', err);
        process.exit(1);
      });
  });
  
  // 5초 후 강제 종료 (타임아웃)
  setTimeout(() => {
    console.error('강제 종료합니다.');
    if (mongoose.connection.readyState === 1) {
      mongoose.connection.close().catch(() => {});
    }
    process.exit(1);
  }, 5000);
};

// Windows에서도 작동하도록 readline 인터페이스 설정
if (process.platform === 'win32') {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('SIGINT', () => {
    rl.close();
    gracefulShutdown('SIGINT (Ctrl+C)');
  });
}

// 종료 신호 처리
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 예상치 못한 에러 처리
process.on('uncaughtException', (err) => {
  // 포트 충돌 에러는 즉시 종료
  if (err.code === 'EADDRINUSE') {
    console.error(`\n포트 ${PORT}가 이미 사용 중입니다.`);
    console.error('다른 프로세스가 포트를 사용하고 있습니다.');
    console.error('기존 프로세스를 종료하거나 다른 포트를 사용하세요.\n');
    mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
  
  console.error('예상치 못한 에러:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (err) => {
  console.error('처리되지 않은 Promise 거부:', err);
  gracefulShutdown('unhandledRejection');
});

module.exports = app;

