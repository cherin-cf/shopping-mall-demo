const mongoose = require('mongoose');

// 장바구니 아이템 서브 스키마
const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, '상품을 선택해주세요'],
    },
    quantity: {
      type: Number,
      required: [true, '수량을 입력해주세요'],
      min: [1, '수량은 1개 이상이어야 합니다'],
      default: 1,
    },
    selectedColor: {
      type: String,
      default: '',
    },
    selectedSize: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: true,
      min: [0, '가격은 0 이상이어야 합니다'],
    },
  },
  {
    _id: true,
  }
);

// 장바구니 스키마
const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '사용자 정보가 필요합니다'],
      unique: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: [0, '총액은 0 이상이어야 합니다'],
    },
    totalItems: {
      type: Number,
      default: 0,
      min: [0, '총 수량은 0 이상이어야 합니다'],
    },
  },
  {
    timestamps: true,
  }
);

// 사용자별 장바구니 조회를 위한 인덱스
cartSchema.index({ user: 1 }, { unique: true });

// 장바구니 총액 및 총 수량 계산 미들웨어
cartSchema.pre('save', function(next) {
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.totalAmount = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  next();
});

// 장바구니 아이템 추가 메서드
cartSchema.methods.addItem = async function(productId, quantity, selectedColor, selectedSize, price) {
  const existingItemIndex = this.items.findIndex(
    item => 
      item.product.toString() === productId.toString() &&
      item.selectedColor === selectedColor &&
      item.selectedSize === selectedSize
  );

  if (existingItemIndex > -1) {
    // 이미 같은 옵션의 상품이 있으면 수량만 증가
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // 새 아이템 추가
    this.items.push({
      product: productId,
      quantity,
      selectedColor,
      selectedSize,
      price,
    });
  }

  return this.save();
};

// 장바구니 아이템 수량 변경 메서드
cartSchema.methods.updateItemQuantity = async function(itemId, quantity) {
  const item = this.items.id(itemId);
  if (!item) {
    throw new Error('장바구니에서 해당 상품을 찾을 수 없습니다');
  }
  
  if (quantity <= 0) {
    // 수량이 0 이하면 아이템 삭제
    this.items.pull(itemId);
  } else {
    item.quantity = quantity;
  }

  return this.save();
};

// 장바구니 아이템 삭제 메서드
cartSchema.methods.removeItem = async function(itemId) {
  this.items.pull(itemId);
  return this.save();
};

// 장바구니 비우기 메서드
cartSchema.methods.clearCart = async function() {
  this.items = [];
  return this.save();
};

module.exports = mongoose.model('Cart', cartSchema);

