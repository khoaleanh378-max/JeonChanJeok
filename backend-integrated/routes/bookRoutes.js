const express = require('express');
const router = express.Router();
const { getAllBooks, getBookDetail, searchBooks, getBooksByCategory } = require('../controllers/bookController');

router.get('/', getAllBooks);                        // Trang chủ - Lấy tất cả sách
router.get('/search', searchBooks);                 // Ô Tìm kiếm sách theo từ khóa tên
router.get('/category/:category', getBooksByCategory); // Thanh danh mục - Lọc theo thể loại
router.get('/:book_id', getBookDetail);             // Bấm vào ảnh/thẻ sách - Xem chi tiết 1 cuốn sách

module.exports = router;