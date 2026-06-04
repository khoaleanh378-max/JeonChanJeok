const Order = require('../models/Order');

// Lấy toàn bộ danh sách đơn hàng đã mua của User hiện tại
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Lấy chi tiết thông tin của một hóa đơn theo ID đơn hàng
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng yêu cầu' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Bấm thanh toán đơn hàng thành công -> Lưu hóa đơn tổng
const createOrder = async (req, res) => {
  try {
    const { tong_tien } = req.body;

    const order = new Order({
      userId: req.user.id, // Lấy trực tiếp ID từ token giải mã được để chống giả mạo dữ liệu
      ngay_mua: new Date().toISOString().split('T')[0],
      tong_tien: tong_tien
    });

    await order.save();
    res.status(201).json({ message: 'Tạo đơn hàng thành công!', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Hủy đơn hàng hoặc Xóa lịch sử đơn hàng
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại hoặc đã bị xóa trước đó' });
    }
    res.json({ message: 'Xóa đơn hàng thành công!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getOrders, getOrderById, createOrder, deleteOrder };