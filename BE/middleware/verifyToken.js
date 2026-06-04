const jwt = require('jsonwebtoken')

const verifyToken = (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers['authorization']

    if (!authHeader) {
      return res.status(401).json({ message: 'Không có token, vui lòng đăng nhập' })
    }

    // Token gửi lên dạng: "Bearer eyJhbGc..."
    const token = authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({ message: 'Token không hợp lệ' })
    }

    // Xác minh token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded

    next() // Cho phép đi tiếp vào controller
  } catch (err) {
    return res.status(401).json({ message: 'Token hết hạn hoặc sai' })
  }
}

module.exports = verifyToken