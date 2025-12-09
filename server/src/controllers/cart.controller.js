const Cart = require('../models/cart.model');
const Product = require('../models/product.model');

// 장바구니 조회
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product', 'name price image status stock sizes colors');
    
    if (!cart) {
      // 장바구니가 없으면 빈 장바구니 생성
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 장바구니에 상품 추가
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity, selectedColor, selectedSize } = req.body;

    // 상품 존재 여부 및 재고 확인
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다',
      });
    }

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

    // 장바구니 찾기 또는 생성
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    // 아이템 추가
    await cart.addItem(productId, quantity, selectedColor || '', selectedSize || '', product.price);

    // populate하여 반환
    cart = await Cart.findById(cart._id)
      .populate('items.product', 'name price image status stock sizes colors');

    res.status(200).json({
      success: true,
      message: '장바구니에 상품이 추가되었습니다',
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 장바구니 아이템 수량 변경
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다',
      });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: '장바구니에서 해당 상품을 찾을 수 없습니다',
      });
    }

    // 재고 확인
    const product = await Product.findById(item.product);
    if (product && quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `재고가 부족합니다 (현재 재고: ${product.stock}개)`,
      });
    }

    await cart.updateItemQuantity(itemId, quantity);

    // populate하여 반환
    cart = await Cart.findById(cart._id)
      .populate('items.product', 'name price image status stock sizes colors');

    res.status(200).json({
      success: true,
      message: quantity <= 0 ? '상품이 장바구니에서 삭제되었습니다' : '수량이 변경되었습니다',
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 장바구니 아이템 삭제
exports.removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다',
      });
    }

    await cart.removeItem(itemId);

    // populate하여 반환
    cart = await Cart.findById(cart._id)
      .populate('items.product', 'name price image status stock sizes colors');

    res.status(200).json({
      success: true,
      message: '상품이 장바구니에서 삭제되었습니다',
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 장바구니 비우기
exports.clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다',
      });
    }

    await cart.clearCart();

    res.status(200).json({
      success: true,
      message: '장바구니가 비워졌습니다',
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 선택한 아이템만 삭제
exports.removeSelectedItems = async (req, res) => {
  try {
    const { itemIds } = req.body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '삭제할 상품을 선택해주세요',
      });
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다',
      });
    }

    // 선택한 아이템들 삭제
    for (const itemId of itemIds) {
      cart.items.pull(itemId);
    }
    await cart.save();

    // populate하여 반환
    cart = await Cart.findById(cart._id)
      .populate('items.product', 'name price image status stock sizes colors');

    res.status(200).json({
      success: true,
      message: `${itemIds.length}개의 상품이 삭제되었습니다`,
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

