const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Đăng ký tài khoản
const register = async (req, res) => {
  try {
    const { id, name, loginname, password } = req.body;

    // Kiểm tra xem tên đăng nhập này đã có ai dùng chưa
    const existing = await User.findOne({ loginname });
    if (existing) {
      return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại trên hệ thống' });
    }

    const user = new User({
      id: id || "U_" + Date.now(),
      name,
      loginname,
      password, // Trong thực tế nên băm mật khẩu bằng bcrypt, nhưng để đồng bộ dữ liệu mẫu ta giữ nguyên chuỗi thô
      role: 0,
      datecreated: new Date(),
      dateupdated: new Date()
    });

    await user.save();
    res.status(201).json({ message: 'Đăng ký tài khoản thành công!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Đăng nhập
const login = async (req, res) => {
  try {
    const { loginname, password } = req.body;

    // Tìm user khớp cả tài khoản lẫn mật khẩu
    const user = await User.findOne({ loginname, password });
    if (!user) {
      return res.status(400).json({ message: 'Sai tên đăng nhập hoặc mật khẩu, vui lòng thử lại!' });
    }

    // Ký sinh mã Token JWT chứa thông tin định danh
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Trả Token và thông tin cơ bản về cho React lưu trữ
    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Xem thông tin cá nhân dựa vào Token
const getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, getProfile };