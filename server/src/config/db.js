const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // MONGODB_ATLAS_URL을 우선 사용, 없으면 로컬 주소 사용
    let mongoURI = process.env.MONGODB_ATLAS_URL || 'mongodb://localhost:27017/shopping-mall';
    
    // 이미 인코딩된 비밀번호인지 확인 (%가 포함되어 있으면 이미 인코딩된 것)
    const isAlreadyEncoded = mongoURI.includes('%');
    
    // 특수문자가 포함된 비밀번호를 URL 인코딩 처리 (이미 인코딩되지 않은 경우만)
    if (!isAlreadyEncoded && mongoURI.includes('@')) {
      const parts = mongoURI.split('@');
      if (parts.length === 2) {
        const authPart = parts[0];
        const restPart = parts[1];
        
        // mongodb+srv://username:password 형식인 경우
        if (authPart.includes('://') && authPart.includes(':')) {
          const protocolPart = authPart.split('://')[0] + '://';
          const credentialsPart = authPart.split('://')[1];
          
          if (credentialsPart.includes(':')) {
            const [username, password] = credentialsPart.split(':');
            // 비밀번호만 인코딩 (특수문자 처리)
            const encodedPassword = encodeURIComponent(password);
            mongoURI = `${protocolPart}${username}:${encodedPassword}@${restPart}`;
          }
        }
      }
    }
    
    console.log('[MongoDB 연결 시도]');
    console.log(`MongoDB URI: ${mongoURI ? mongoURI.substring(0, 50) + '...' : '없음'}`);
    console.log(`이미 인코딩됨: ${isAlreadyEncoded ? '예' : '아니오'}`);
    
    const conn = await mongoose.connect(mongoURI, {
      // 연결 옵션 추가
      serverSelectionTimeoutMS: 10000, // 10초 타임아웃 (Atlas는 조금 더 시간 필요)
    });
    
    console.log('✅ MongoDB 연결 성공!');
    console.log(`Host: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    console.log(`Ready State: ${conn.connection.readyState} (1=connected)`);
  } catch (error) {
    console.error('❌ MongoDB 연결 실패!');
    console.error('에러 메시지:', error.message);
    console.error('에러 상세:', error);
    process.exit(1);
  }
};

module.exports = connectDB;

