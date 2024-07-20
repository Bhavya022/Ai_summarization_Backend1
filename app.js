const express = require('express');
const connectDB = require('./config/dbConfig');
const uploadRoutes = require('./routes/upload');
// Add other routes and configurations as needed

const app = express();
connectDB();

app.use(express.json());  // For parsing application/json
app.use('/api', uploadRoutes);  // Mount upload routes

module.exports = app;
