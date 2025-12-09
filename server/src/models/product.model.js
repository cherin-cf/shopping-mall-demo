const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, 'SKU를 입력해주세요'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [
        /^[A-Z]{2}-[A-Z]{2}-\d{3}$/,
        'SKU 형식이 올바르지 않습니다 (예: KG-TS-001)'
      ],
    },
    name: {
      type: String,
      required: [true, '상품명을 입력해주세요'],
      trim: true,
      maxlength: [100, '상품명은 100자 이내로 입력해주세요'],
    },
    price: {
      type: Number,
      required: [true, '가격을 입력해주세요'],
      min: [0, '가격은 0 이상이어야 합니다'],
    },
    originalPrice: {
      type: Number,
      default: 0,
      min: [0, '정가는 0 이상이어야 합니다'],
    },
    category: {
      type: String,
      required: [true, '카테고리를 선택해주세요'],
      enum: {
        values: ['상의', '하의', '악세사리'],
        message: '카테고리는 상의, 하의, 악세사리 중 하나여야 합니다',
      },
    },
    image: {
      type: String,
      required: [true, '상품 이미지를 등록해주세요'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [1000, '상품 설명은 1000자 이내로 입력해주세요'],
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, '재고는 0 이상이어야 합니다'],
    },
    status: {
      type: String,
      enum: {
        values: ['판매중', '품절', '품절임박', '판매중지'],
        message: '올바른 상태값을 선택해주세요',
      },
      default: '판매중',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sizes: {
      type: [String],
      default: [],
    },
    colors: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// SKU 중복 체크를 위한 인덱스
productSchema.index({ sku: 1 }, { unique: true });

// 재고에 따른 상태 자동 업데이트 미들웨어
productSchema.pre('save', function(next) {
  if (this.stock === 0) {
    this.status = '품절';
  } else if (this.stock <= 10) {
    this.status = '품절임박';
  } else if (this.status === '품절' || this.status === '품절임박') {
    this.status = '판매중';
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
