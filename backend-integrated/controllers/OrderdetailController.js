const OrderDetail = require('../models/OrderDetail')
const Book = require('../models/Book')

// Xem giỏ hàng
const getOrderDetail = async (req, res) => {
  try {
    const detail = await OrderDetail.findOne({ userId: req.user.id })
    res.json(detail || { chi_tiet: [] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Thêm sách vào giỏ hàng
const addToCart = async (req, res) => {
  try {
    const { book_id, quantity } = req.body
    const targetQty = quantity || 1

    const book = await Book.findOne({ book_id })
    if (!book) {
      return res.status(404).json({ message: 'Không tìm thấy sách' })
    }

    let detail = await OrderDetail.findOne({ userId: req.user.id })

    if (!detail) {
      detail = new OrderDetail({
        userId: req.user.id,
        ngay_mua: new Date().toISOString().split('T')[0],
        tong_tien: book.price * targetQty,
        chi_tiet: [{ book_id, quantity: targetQty, price: book.price }]
      })
    } else {
      const itemIndex = detail.chi_tiet.findIndex(item => item.book_id === book_id)
      if (itemIndex > -1) {
        detail.chi_tiet[itemIndex].quantity += targetQty
      } else {
        detail.chi_tiet.push({ book_id, quantity: targetQty, price: book.price })
      }
      detail.tong_tien = detail.chi_tiet.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    }

    await detail.save()
    res.json({ message: 'Thêm vào giỏ hàng thành công', detail })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Tăng số lượng
const increaseQuantity = async (req, res) => {
  try {
    const { book_id } = req.body
    const order = await OrderDetail.findOne({ userId: req.user.id })

    if (!order) return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' })

    const bookInCart = order.chi_tiet.find(item => item.book_id === book_id)
    if (!bookInCart) return res.status(404).json({ message: 'Không tìm thấy sách trong giỏ' })

    bookInCart.quantity += 1
    order.tong_tien = order.chi_tiet.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    
    await order.save()
    res.json({ message: 'Tăng số lượng thành công', order })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Giảm số lượng
const decreaseQuantity = async (req, res) => {
  try {
    const { book_id } = req.body
    const order = await OrderDetail.findOne({ userId: req.user.id })

    if (!order) return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' })

    const bookInCart = order.chi_tiet.find(item => item.book_id === book_id)
    if (!bookInCart) return res.status(404).json({ message: 'Không tìm thấy sách' })

    if (bookInCart.quantity > 1) {
      bookInCart.quantity -= 1
    } else {
      order.chi_tiet = order.chi_tiet.filter(item => item.book_id !== book_id)
    }
    
    order.tong_tien = order.chi_tiet.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    await order.save()
    res.json({ message: 'Giảm số lượng thành công', order })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Xóa sản phẩm khỏi giỏ
const removeFromCart = async (req, res) => {
  try {
    const { book_id } = req.params
    const detail = await OrderDetail.findOne({ userId: req.user.id })

    if (!detail) return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' })

    detail.chi_tiet = detail.chi_tiet.filter(item => item.book_id !== book_id)
    detail.tong_tien = detail.chi_tiet.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    
    await detail.save()
    res.json({ message: 'Xóa sản phẩm thành công', detail })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { getOrderDetail, addToCart, increaseQuantity, decreaseQuantity, removeFromCart }