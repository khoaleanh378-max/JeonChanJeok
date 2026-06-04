const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/userController');
const verifyToken = require('../middleware/verifyToken');

router.post('/register', register);        // Đăng ký tài khoản mới
router.post('/login', login);              // Đăng nhập hệ thống
router.get('/profile', verifyToken, getProfile);  // Lấy thông tin cá nhân hiện tại

module.exports = router;