const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // MONGODB_ATLAS_URL을 우선 사용, 없으면 로컬 주소 사용
    const mongoURI = process.env.MONGODB_ATLAS_URL || 'mongodb://localhost:27017/shopping-mall';
    const conn = await mongoose.connect(mongoURI);
    console.log('MongoDB 연결 성공!');
    console.log(`Host: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('MongoDB 연결 실패:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

