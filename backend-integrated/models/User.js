const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: Number, required: true, default: 0 },
  loginname: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  datecreated: { type: Date, default: Date.now },
  dateupdated: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Users', userSchema)