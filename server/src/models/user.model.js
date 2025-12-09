const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, '이메일을 입력해주세요'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        '올바른 이메일 형식을 입력해주세요'
      ],
    },
    name: {
      type: String,
      required: [true, '이름을 입력해주세요'],
      trim: true,
    },
    password: {
      type: String,
      required: [true, '비밀번호를 입력해주세요'],
      minlength: [6, '비밀번호는 최소 6자 이상이어야 합니다'],
    },
    user_type: {
      type: String,
      required: [true, '사용자 유형을 선택해주세요'],
      enum: {
        values: ['customer', 'admin'],
        message: '사용자 유형은 customer 또는 admin이어야 합니다',
      },
      default: 'customer',
    },
    address: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);

