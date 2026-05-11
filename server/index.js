const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dns = require('dns');

//Force Google DNS to bypass Node.js local network bugs on Windows
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

//Middleware
app.use(cors());
app.use(express.json());

//Serve uploaded photos as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//Routes
const contactsRouter = require('./routes/contacts');
const authRouter = require('./routes/auth');

app.use('/api/contacts', contactsRouter);
app.use('/api/auth', authRouter);

// Basic test route
app.get('/', (req, res) => {
  res.send('PhoneBook API is running...');
});

//Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');

    //Start server after successful DB connection
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });
