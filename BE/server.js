const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const app = express()

// Đang để cors() cho phép tất cả - tiện khi dev
// Sau này nếu muốn giới hạn thì sửa lại thành:
// app.use(cors({ origin: 'http://IP_MÁY_BẠN_BÈ:3000' }))
// Ví dụ: app.use(cors({ origin: 'http://192.168.1.15:3000' }))
app.use(cors())

app.use(express.json())

console.log("URI:", process.env.MONGO_URI)
mongoose.connect(process.env.MONGO_URI, { family: 4 })
.then(() => {
    console.log("Kết nối MongoDB thành công");
    console.log("Connected DB:", mongoose.connection.name);
})
.catch((err) => {
    console.error("Lỗi kết nối MongoDB:", err);
});


app.use('/api/auth', require('./routes/userRoutes'))
app.use('/api/books', require('./routes/bookRoutes'))
app.use('/api/orders', require('./routes/OrderRoutes'))
app.use('/api/orderdetails', require('./routes/OrderdetailRoutes'))


const PORT = process.env.PORT || 8080
app.listen(PORT, () => console.log(` Server chạy tại port ${PORT}`))