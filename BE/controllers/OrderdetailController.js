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

// Thêm sách vào giỏ hàng — kiểm tra tồn kho
const addToCart = async (req, res) => {
  try {
    const { book_id, quantity } = req.body
    const targetQty = quantity || 1

    const book = await Book.findOne({ book_id })
    if (!book) {
      return res.status(404).json({ message: 'Không tìm thấy sách' })
    }
    if (book.stock <= 0) {
      return res.status(400).json({ message: 'Sách đã hết hàng' })
    }

    let detail = await OrderDetail.findOne({ userId: req.user.id })

    // Tính số lượng sách này đang có trong giỏ
    const existingQty = detail
      ? (detail.chi_tiet.find(i => i.book_id === book_id)?.quantity || 0)
      : 0

    // Kiểm tra tổng số lượng (giỏ + thêm mới) không vượt tồn kho
    if (existingQty + targetQty > book.stock) {
      return res.status(400).json({
        message: `Chỉ còn ${book.stock} cuốn trong kho, bạn đang có ${existingQty} trong giỏ`
      })
    }

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

    // Trừ tồn kho
    await Book.updateOne({ book_id }, { $inc: { stock: -targetQty } })
    await detail.save()
    res.json({ message: 'Thêm vào giỏ hàng thành công', detail })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Tăng số lượng — kiểm tra tồn kho
const increaseQuantity = async (req, res) => {
  try {
    const { book_id } = req.body
    const order = await OrderDetail.findOne({ userId: req.user.id })
    if (!order) return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' })

    const bookInCart = order.chi_tiet.find(item => item.book_id === book_id)
    if (!bookInCart) return res.status(404).json({ message: 'Không tìm thấy sách trong giỏ' })

    const book = await Book.findOne({ book_id })
    if (!book) return res.status(404).json({ message: 'Không tìm thấy sách' })

    if (book.stock <= 0) {
      return res.status(400).json({ message: `Không thể thêm, chỉ còn ${bookInCart.quantity} cuốn trong kho` })
    }

    bookInCart.quantity += 1
    order.tong_tien = order.chi_tiet.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    await Book.updateOne({ book_id }, { $inc: { stock: -1 } })
    await order.save()
    res.json({ message: 'Tăng số lượng thành công', order })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Giảm số lượng — hoàn lại tồn kho
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
      // Xóa hẳn khỏi giỏ nếu qty = 1
      order.chi_tiet = order.chi_tiet.filter(item => item.book_id !== book_id)
    }

    order.tong_tien = order.chi_tiet.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // Hoàn 1 cuốn về kho
    await Book.updateOne({ book_id }, { $inc: { stock: 1 } })
    await order.save()
    res.json({ message: 'Giảm số lượng thành công', order })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Xóa sản phẩm khỏi giỏ — hoàn toàn bộ số lượng về kho
const removeFromCart = async (req, res) => {
  try {
    const { book_id } = req.params
    const detail = await OrderDetail.findOne({ userId: req.user.id })
    if (!detail) return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' })

    const itemInCart = detail.chi_tiet.find(item => item.book_id === book_id)
    const qtyToRestore = itemInCart ? itemInCart.quantity : 0

    detail.chi_tiet = detail.chi_tiet.filter(item => item.book_id !== book_id)
    detail.tong_tien = detail.chi_tiet.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // Hoàn toàn bộ số lượng về kho
    if (qtyToRestore > 0) {
      await Book.updateOne({ book_id }, { $inc: { stock: qtyToRestore } })
    }

    await detail.save()
    res.json({ message: 'Xóa sản phẩm thành công', detail })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { getOrderDetail, addToCart, increaseQuantity, decreaseQuantity, removeFromCart }
