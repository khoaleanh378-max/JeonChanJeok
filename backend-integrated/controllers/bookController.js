const Book = require('../models/Book');

// Lấy tất cả sách đổ ra trang chủ
const getAllBooks = async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Bấm vào ảnh/tiêu đề sách để xem chi tiết
const getBookDetail = async (req, res) => {
  try {
    const book = await Book.findOne({ book_id: req.params.book_id });
    if (!book) {
      return res.status(404).json({ message: 'Không tìm thấy cuốn sách này' });
    }
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Tìm kiếm sách theo tên (Không phân biệt chữ hoa, chữ thường)
const searchBooks = async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword) {
      const books = await Book.find();
      return res.json(books);
    }
    const books = await Book.find({
      title: { $regex: keyword, $options: 'i' }
    });
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Lọc sách dựa theo Thể loại (Category) từ thanh menu điều hướng
const getBooksByCategory = async (req, res) => {
  try {
    const books = await Book.find({ category: req.params.category });
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllBooks, getBookDetail, searchBooks, getBooksByCategory };