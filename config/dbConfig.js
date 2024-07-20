const mongoose = require('mongoose'); 
const dotenv = require('dotenv');
dotenv.config();
const MONGO_URI  = process.env.MONGO_URI || 'mongodb+srv://bhavya:bhavya@cluster0.kin5ecd.mongodb.net/content-AIsummarizedb?retryWrites=true&w=majority';
console.log(MONGO_URI)
const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI); 
        console.log('MongoDB connected');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1); 
    }
};

module.exports = connectDB;
