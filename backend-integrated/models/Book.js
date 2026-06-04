const mongoose = require('mongoose')

const bookSchema = new mongoose.Schema({
  book_id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  author: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  price: { type: Number, required: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' }
})

module.exports = mongoose.model('Books', bookSchema)