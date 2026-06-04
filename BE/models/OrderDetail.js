const mongoose = require('mongoose')

const orderDetailSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  ngay_mua: { type: String, required: true },
  tong_tien: { type: Number, required: true },
  chi_tiet: [
    {
      book_id: { type: String, required: true },  // Đổi từ ma_sach -> book_id
      quantity: { type: Number, required: true }, // Đổi từ so_luong -> quantity
      price: { type: Number, required: true }     // Đổi từ gia_tien -> price để đồng bộ luôn
    }
  ]
})

module.exports = mongoose.model('OrderDetails', orderDetailSchema, 'OrderDetails')