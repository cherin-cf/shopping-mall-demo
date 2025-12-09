const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const axios = require('axios');

// 포트원 결제 검증
const verifyPayment = async (impUid, merchantUid, expectedAmount) => {
  try {
    // 포트원 REST API 키 (환경변수에서 가져오기)
    const IAMPORT_REST_API_KEY = process.env.IAMPORT_REST_API_KEY;
    const IAMPORT_REST_API_SECRET = process.env.IAMPORT_REST_API_SECRET;

    if (!IAMPORT_REST_API_KEY || !IAMPORT_REST_API_SECRET) {
      console.warn('포트원 API 키가 설정되지 않았습니다. 결제 검증을 건너뜁니다.');
      return { success: true, verified: false }; // API 키가 없으면 검증 건너뛰기
    }

    // 포트원 Access Token 발급
    const tokenResponse = await axios.post('https://api.iamport.kr/users/getToken', {
      imp_key: IAMPORT_REST_API_KEY,
      imp_secret: IAMPORT_REST_API_SECRET,
    });

    const accessToken = tokenResponse.data.response.access_token;

    // 결제 정보 조회
    const paymentResponse = await axios.get(
      `https://api.iamport.kr/payments/${impUid}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const paymentData = paymentResponse.data.response;

    // 검증 항목
    if (paymentData.status !== 'paid') {
      return {
        success: false,
        message: '결제가 완료되지 않았습니다',
      };
    }

    if (paymentData.merchant_uid !== merchantUid) {
      return {
        success: false,
        message: '주문번호가 일치하지 않습니다',
      };
    }

    if (parseInt(paymentData.amount) !== expectedAmount) {
      return {
        success: false,
        message: `결제 금액이 일치하지 않습니다 (결제: ${paymentData.amount}, 주문: ${expectedAmount})`,
      };
    }

    return {
      success: true,
      verified: true,
      paymentData,
    };
  } catch (error) {
    console.error('결제 검증 에러:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || '결제 검증에 실패했습니다',
    };
  }
};

// 주문 중복 체크
const checkDuplicateOrder = async (merchantUid) => {
  if (!merchantUid) return null;

  const existingOrder = await Order.findOne({ merchantUid });
  return existingOrder;
};

// 주문 생성 (장바구니에서 주문)
exports.createOrder = async (req, res) => {
  try {
    const { shipping, paymentMethod, itemIds, impUid, merchantUid } = req.body;

    // 주문 중복 체크
    if (merchantUid) {
      const duplicateOrder = await checkDuplicateOrder(merchantUid);
      if (duplicateOrder) {
        return res.status(400).json({
          success: false,
          message: '이미 처리된 주문입니다',
          data: duplicateOrder,
        });
      }
    }

    // 장바구니 조회
    const cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product', 'name price image stock status');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: '장바구니가 비어있습니다',
      });
    }

    // 주문할 아이템 필터링 (itemIds가 있으면 선택된 것만, 없으면 전체)
    let orderItems = cart.items;
    if (itemIds && itemIds.length > 0) {
      orderItems = cart.items.filter(item => itemIds.includes(item._id.toString()));
    }

    if (orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: '주문할 상품을 선택해주세요',
      });
    }

    // 재고 확인 및 주문 아이템 생성
    const items = [];
    for (const cartItem of orderItems) {
      const product = cartItem.product;

      if (!product) {
        return res.status(400).json({
          success: false,
          message: '존재하지 않는 상품이 포함되어 있습니다',
        });
      }

      if (product.status === '품절' || product.stock < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `${product.name} 상품의 재고가 부족합니다`,
        });
      }

      items.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: cartItem.price,
        quantity: cartItem.quantity,
        selectedColor: cartItem.selectedColor,
        selectedSize: cartItem.selectedSize,
      });
    }

    // 금액 계산
    const totalProductAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingFee = totalProductAmount >= 30000 ? 0 : 3000;
    const discountAmount = 0; // 추후 쿠폰/포인트 기능 추가 시
    const totalAmount = totalProductAmount + shippingFee - discountAmount;

    // 결제 검증 (impUid가 있는 경우)
    if (impUid && merchantUid) {
      const verification = await verifyPayment(impUid, merchantUid, totalAmount);
      if (!verification.success) {
        return res.status(400).json({
          success: false,
          message: verification.message || '결제 검증에 실패했습니다',
        });
      }
      if (!verification.verified) {
        console.warn('결제 검증을 건너뛰었습니다 (API 키 미설정)');
      }
    }

    // 주문 생성
    const order = await Order.create({
      user: req.user.id,
      items,
      shipping,
      payment: {
        method: paymentMethod,
        status: impUid ? 'completed' : 'pending',
        paidAt: impUid ? new Date() : null,
      },
      totalProductAmount,
      shippingFee,
      discountAmount,
      totalAmount,
      status: impUid ? 'paid' : 'pending',
      impUid: impUid || '',
      merchantUid: merchantUid || '',
    });

    // 재고 차감
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    // 장바구니에서 주문한 아이템 제거
    const orderedItemIds = orderItems.map(item => item._id);
    cart.items = cart.items.filter(item => !orderedItemIds.includes(item._id));
    await cart.save();

    res.status(201).json({
      success: true,
      message: '주문이 완료되었습니다',
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 바로구매 주문 생성
exports.createBuyNowOrder = async (req, res) => {
  try {
    const { shipping, paymentMethod, productId, quantity, selectedColor, selectedSize, impUid, merchantUid } = req.body;

    // 주문 중복 체크
    if (merchantUid) {
      const duplicateOrder = await checkDuplicateOrder(merchantUid);
      if (duplicateOrder) {
        return res.status(400).json({
          success: false,
          message: '이미 처리된 주문입니다',
          data: duplicateOrder,
        });
      }
    }

    // 상품 조회
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다',
      });
    }

    // 재고 확인
    if (!product.isActive || product.status === '품절') {
      return res.status(400).json({
        success: false,
        message: '현재 구매할 수 없는 상품입니다',
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `재고가 부족합니다 (현재 재고: ${product.stock}개)`,
      });
    }

    // 주문 아이템 생성
    const items = [{
      product: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity,
      selectedColor: selectedColor || '',
      selectedSize: selectedSize || '',
    }];

    // 금액 계산
    const totalProductAmount = product.price * quantity;
    const shippingFee = totalProductAmount >= 30000 ? 0 : 3000;
    const discountAmount = 0;
    const totalAmount = totalProductAmount + shippingFee - discountAmount;

    // 결제 검증 (impUid가 있는 경우)
    if (impUid && merchantUid) {
      const verification = await verifyPayment(impUid, merchantUid, totalAmount);
      if (!verification.success) {
        return res.status(400).json({
          success: false,
          message: verification.message || '결제 검증에 실패했습니다',
        });
      }
      if (!verification.verified) {
        console.warn('결제 검증을 건너뛰었습니다 (API 키 미설정)');
      }
    }

    // 주문 생성
    const order = await Order.create({
      user: req.user.id,
      items,
      shipping,
      payment: {
        method: paymentMethod,
        status: impUid ? 'completed' : 'pending',
        paidAt: impUid ? new Date() : null,
      },
      totalProductAmount,
      shippingFee,
      discountAmount,
      totalAmount,
      status: impUid ? 'paid' : 'pending',
      impUid: impUid || '',
      merchantUid: merchantUid || '',
    });

    // 재고 차감
    await Product.findByIdAndUpdate(productId, {
      $inc: { stock: -quantity }
    });

    res.status(201).json({
      success: true,
      message: '주문이 완료되었습니다',
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 내 주문 목록 조회
exports.getMyOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const baseFilter = { user: req.user.id };
    const filter = { ...baseFilter };
    if (status) filter.status = status;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const totalCount = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limitNum);

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // 상태별 주문 개수 통계
    const statusCounts = {
      all: await Order.countDocuments(baseFilter),
      preparing: await Order.countDocuments({ ...baseFilter, status: 'preparing' }),
      shipped: await Order.countDocuments({ ...baseFilter, status: 'shipped' }),
      delivered: await Order.countDocuments({ ...baseFilter, status: 'delivered' }),
    };

    res.status(200).json({
      success: true,
      count: orders.length,
      totalCount,
      totalPages,
      currentPage: pageNum,
      statusCounts,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 주문 상세 조회
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate('items.product', 'name image');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 주문 취소 (사용자)
exports.cancelOrder = async (req, res) => {
  try {
    const { cancelReason } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다',
      });
    }

    // 취소 가능 상태 확인
    if (!['pending', 'paid'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: '취소할 수 없는 주문 상태입니다',
      });
    }

    // 재고 복구
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    // 주문 취소 처리
    await order.updateStatus('cancelled', { cancelReason });

    res.status(200).json({
      success: true,
      message: '주문이 취소되었습니다',
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===== 관리자 API =====

// 모든 주문 조회 (관리자)
exports.getAllOrders = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shipping.recipientName': { $regex: search, $options: 'i' } },
        { 'shipping.recipientPhone': { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const totalCount = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limitNum);

    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: orders.length,
      totalCount,
      totalPages,
      currentPage: pageNum,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 주문 상세 조회 (관리자)
exports.getOrderByIdAdmin = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name image sku');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 주문 상태 변경 (관리자)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, shippingCompany, trackingNumber, cancelReason, refundAmount } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다',
      });
    }

    // 취소/환불 시 재고 복구
    if (['cancelled', 'refunded'].includes(status) && !['cancelled', 'refunded'].includes(order.status)) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }
        });
      }
    }

    // 상태 업데이트
    await order.updateStatus(status, {
      shippingCompany,
      trackingNumber,
      cancelReason,
      refundAmount,
    });

    res.status(200).json({
      success: true,
      message: '주문 상태가 변경되었습니다',
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 배송 정보 업데이트 (관리자)
exports.updateShippingInfo = async (req, res) => {
  try {
    const { shippingCompany, trackingNumber } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다',
      });
    }

    if (shippingCompany) order.shippingCompany = shippingCompany;
    if (trackingNumber) order.trackingNumber = trackingNumber;

    await order.save();

    res.status(200).json({
      success: true,
      message: '배송 정보가 업데이트되었습니다',
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

