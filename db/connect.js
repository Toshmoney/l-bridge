require('dotenv').config()
const mongoose = require('mongoose')
const connect_string = process.env.MONGO_URI


const connectDB = async()=>{
    try {
        await mongoose.connect(connect_string)
        return console.log("db connected")
    } catch (error) {
        console.log(error);
    }
}

module.exports = connectDB