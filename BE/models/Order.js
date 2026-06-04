const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  ngay_mua: { type: String, required: true },
  tong_tien: { type: Number, required: true }
})

module.exports = mongoose.model('Orders', orderSchema, 'Orders')