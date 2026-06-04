const express = require('express');
const router = express.Router();
const { getOrders, getOrderById, createOrder, deleteOrder } = require('../controllers/OrderController');
const verifyToken = require('../middleware/verifyToken');

router.get('/', verifyToken, getOrders);            // Lấy toàn bộ lịch sử đơn hàng của User
router.get('/:id', verifyToken, getOrderById);      // Xem chi tiết 1 đơn hàng cụ thể
router.post('/', verifyToken, createOrder);         // Bấm nút "Thanh toán" -> Tạo đơn hàng mới
router.delete('/:id', verifyToken, deleteOrder);    // Hủy/Xóa đơn hàng

module.exports = router;