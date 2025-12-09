const Product = require('../models/product.model');

// 모든 상품 조회 (활성 상품만)
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 모든 상품 조회 (관리자용 - 비활성 포함, 페이지네이션)
exports.getAllProductsAdmin = async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 2 } = req.query;
    
    // 페이지네이션 계산
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 2;
    const skip = (pageNum - 1) * limitNum;

    // 필터 조건 생성
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    // 전체 개수 조회
    const totalCount = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limitNum);

    // 페이지네이션된 상품 조회
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: products.length,
      totalCount,
      totalPages,
      currentPage: pageNum,
      limit: limitNum,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 단일 상품 조회
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다',
      });
    }
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// SKU로 상품 조회
exports.getProductBySku = async (req, res) => {
  try {
    const product = await Product.findOne({ sku: req.params.sku.toUpperCase() });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다',
      });
    }
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// SKU 중복 체크
exports.checkSkuDuplicate = async (req, res) => {
  try {
    const { sku } = req.params;
    const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
    
    res.status(200).json({
      success: true,
      isDuplicate: !!existingProduct,
      message: existingProduct ? '이미 사용 중인 SKU입니다' : '사용 가능한 SKU입니다',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 상품 생성
exports.createProduct = async (req, res) => {
  try {
    const { sku, name, price, originalPrice, category, image, description, stock, status, sizes, colors } = req.body;

    // SKU 중복 체크
    const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: '이미 사용 중인 SKU입니다',
      });
    }

    // sizes, colors 문자열을 배열로 변환
    const sizesArray = sizes ? sizes.split(',').map(s => s.trim()).filter(Boolean) : [];
    const colorsArray = colors ? colors.split(',').map(c => c.trim()).filter(Boolean) : [];

    const product = await Product.create({
      sku: sku.toUpperCase(),
      name,
      price,
      originalPrice: originalPrice || 0,
      category,
      image,
      description: description || '',
      stock: stock || 0,
      status: status || '판매중',
      sizes: sizesArray,
      colors: colorsArray,
    });

    res.status(201).json({
      success: true,
      message: '상품이 등록되었습니다',
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// 상품 수정
exports.updateProduct = async (req, res) => {
  try {
    const { sku } = req.body;
    
    // SKU 변경 시 중복 체크
    if (sku) {
      const existingProduct = await Product.findOne({ 
        sku: sku.toUpperCase(),
        _id: { $ne: req.params.id }
      });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: '이미 사용 중인 SKU입니다',
        });
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, sku: sku ? sku.toUpperCase() : undefined },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다',
      });
    }

    res.status(200).json({
      success: true,
      message: '상품이 수정되었습니다',
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// 상품 삭제
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다',
      });
    }
    res.status(200).json({
      success: true,
      message: '상품이 삭제되었습니다',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 상품 상태 변경 (판매중/판매중지)
exports.toggleProductStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다',
      });
    }

    product.isActive = !product.isActive;
    if (!product.isActive) {
      product.status = '판매중지';
    } else {
      // 재고에 따른 상태 설정
      if (product.stock === 0) {
        product.status = '품절';
      } else if (product.stock <= 10) {
        product.status = '품절임박';
      } else {
        product.status = '판매중';
      }
    }
    await product.save();

    res.status(200).json({
      success: true,
      message: product.isActive ? '상품이 활성화되었습니다' : '상품이 비활성화되었습니다',
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
