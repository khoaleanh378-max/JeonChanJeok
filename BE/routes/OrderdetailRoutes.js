const express = require('express')
const router = express.Router()
const { getOrderDetail, addToCart, removeFromCart, increaseQuantity, decreaseQuantity } = require('../controllers/OrderdetailController')
const verifyToken = require('../middleware/verifyToken')

router.get('/', verifyToken, getOrderDetail)
router.post('/add', verifyToken, addToCart)
router.delete('/remove/:book_id', verifyToken, removeFromCart) // Đổi thành :book_id
router.put('/increase', verifyToken, increaseQuantity)
router.put('/decrease', verifyToken, decreaseQuantity)

module.exports = router