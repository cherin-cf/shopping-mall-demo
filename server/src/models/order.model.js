const mongoose = require('mongoose');

// 주문 아이템 서브 스키마
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: [true, '상품명이 필요합니다'],
    },
    image: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: [true, '가격이 필요합니다'],
      min: [0, '가격은 0 이상이어야 합니다'],
    },
    quantity: {
      type: Number,
      required: [true, '수량이 필요합니다'],
      min: [1, '수량은 1개 이상이어야 합니다'],
    },
    selectedColor: {
      type: String,
      default: '',
    },
    selectedSize: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

// 배송 정보 서브 스키마
const shippingSchema = new mongoose.Schema(
  {
    recipientName: {
      type: String,
      required: [true, '수령인 이름이 필요합니다'],
    },
    recipientPhone: {
      type: String,
      required: [true, '연락처가 필요합니다'],
    },
    postalCode: {
      type: String,
      required: [true, '우편번호가 필요합니다'],
    },
    address: {
      type: String,
      required: [true, '주소가 필요합니다'],
    },
    addressDetail: {
      type: String,
      default: '',
    },
    deliveryMemo: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

// 결제 정보 서브 스키마
const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      required: [true, '결제 방법이 필요합니다'],
      enum: {
        values: ['card', 'bank', 'kakao', 'naver', 'toss'],
        message: '올바른 결제 방법을 선택해주세요',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'completed', 'cancelled', 'refunded'],
        message: '올바른 결제 상태를 선택해주세요',
      },
      default: 'pending',
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

// 주문 스키마
const orderSchema = new mongoose.Schema(
  {
    // 주문번호
    orderNumber: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },
    // 포트원 결제 정보
    impUid: {
      type: String,
      default: '',
    },
    merchantUid: {
      type: String,
      default: '',
    },
    // 주문자
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '주문자 정보가 필요합니다'],
    },
    // 주문 상품 목록
    items: {
      type: [orderItemSchema],
      required: [true, '주문 상품이 필요합니다'],
      validate: {
        validator: function(items) {
          return items && items.length > 0;
        },
        message: '최소 1개 이상의 상품이 필요합니다',
      },
    },
    // 배송 정보
    shipping: {
      type: shippingSchema,
      required: [true, '배송 정보가 필요합니다'],
    },
    // 결제 정보
    payment: {
      type: paymentSchema,
      required: [true, '결제 정보가 필요합니다'],
    },
    // 금액 정보
    totalProductAmount: {
      type: Number,
      required: true,
      min: [0, '상품 금액은 0 이상이어야 합니다'],
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: [0, '배송비는 0 이상이어야 합니다'],
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, '할인 금액은 0 이상이어야 합니다'],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, '결제 금액은 0 이상이어야 합니다'],
    },
    // 주문 상태
    status: {
      type: String,
      enum: {
        values: ['pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded'],
        message: '올바른 주문 상태를 선택해주세요',
      },
      default: 'pending',
    },
    // 배송 추적 정보
    shippingCompany: {
      type: String,
      default: '',
    },
    trackingNumber: {
      type: String,
      default: '',
    },
    shippedAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    // 취소/환불 정보
    cancelReason: {
      type: String,
      default: '',
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: [0, '환불 금액은 0 이상이어야 합니다'],
    },
    refundedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// 주문번호 인덱스
orderSchema.index({ orderNumber: 1 }, { unique: true });

// 사용자별 주문 조회를 위한 인덱스
orderSchema.index({ user: 1, createdAt: -1 });

// 주문 상태별 조회를 위한 인덱스
orderSchema.index({ status: 1 });

// 주문번호 자동 생성 (저장 전)
orderSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.orderNumber) {
      // merchantUid가 있으면 그것을 orderNumber로 사용
      if (this.merchantUid) {
        this.orderNumber = this.merchantUid;
      } else {
        // 없으면 자동 생성
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        
        // 오늘 날짜의 마지막 주문번호 찾기
        const lastOrder = await this.constructor.findOne({
          orderNumber: new RegExp(`^ORD-${dateStr}-`)
        }).sort({ orderNumber: -1 });
        
        let sequence = 1;
        if (lastOrder) {
          const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2], 10);
          if (!isNaN(lastSequence)) {
            sequence = lastSequence + 1;
          }
        }
        
        this.orderNumber = `ORD-${dateStr}-${sequence.toString().padStart(4, '0')}`;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// 주문 상태 변경 메서드
orderSchema.methods.updateStatus = async function(newStatus, additionalData = {}) {
  const validTransitions = {
    pending: ['paid', 'cancelled'],
    paid: ['preparing', 'cancelled', 'refunded'],
    preparing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: ['refunded'],
    cancelled: [],
    refunded: [],
  };

  if (!validTransitions[this.status]?.includes(newStatus)) {
    throw new Error(`${this.status} 상태에서 ${newStatus} 상태로 변경할 수 없습니다`);
  }

  this.status = newStatus;

  // 상태별 추가 처리
  switch (newStatus) {
    case 'paid':
      this.payment.status = 'completed';
      this.payment.paidAt = new Date();
      break;
    case 'shipped':
      this.shippedAt = new Date();
      if (additionalData.shippingCompany) this.shippingCompany = additionalData.shippingCompany;
      if (additionalData.trackingNumber) this.trackingNumber = additionalData.trackingNumber;
      break;
    case 'delivered':
      this.deliveredAt = new Date();
      break;
    case 'cancelled':
      this.cancelledAt = new Date();
      this.payment.status = 'cancelled';
      if (additionalData.cancelReason) this.cancelReason = additionalData.cancelReason;
      break;
    case 'refunded':
      this.refundedAt = new Date();
      this.payment.status = 'refunded';
      this.refundAmount = additionalData.refundAmount || this.totalAmount;
      break;
  }

  return this.save();
};

// 가상 필드: 총 상품 수량
orderSchema.virtual('totalQuantity').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// JSON 변환 시 가상 필드 포함
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);

