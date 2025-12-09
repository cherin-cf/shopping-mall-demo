const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { protect, adminOnly } = require('../middlewares/auth.middleware');

// ===== Public Routes =====

// GET /api/products - 모든 상품 조회 (활성 상품만)
router.get('/', productController.getAllProducts);

// GET /api/products/:id - 단일 상품 조회
router.get('/:id', productController.getProductById);

// ===== Admin Routes =====

// GET /api/products/admin/all - 모든 상품 조회 (관리자용 - 비활성 포함)
router.get('/admin/all', protect, adminOnly, productController.getAllProductsAdmin);

// GET /api/products/sku/:sku - SKU로 상품 조회
router.get('/sku/:sku', productController.getProductBySku);

// GET /api/products/check-sku/:sku - SKU 중복 체크
router.get('/check-sku/:sku', protect, adminOnly, productController.checkSkuDuplicate);

// POST /api/products - 상품 생성 (관리자만)
router.post('/', protect, adminOnly, productController.createProduct);

// PUT /api/products/:id - 상품 수정 (관리자만)
router.put('/:id', protect, adminOnly, productController.updateProduct);

// PATCH /api/products/:id/toggle - 상품 상태 토글 (관리자만)
router.patch('/:id/toggle', protect, adminOnly, productController.toggleProductStatus);

// DELETE /api/products/:id - 상품 삭제 (관리자만)
router.delete('/:id', protect, adminOnly, productController.deleteProduct);

module.exports = router;
