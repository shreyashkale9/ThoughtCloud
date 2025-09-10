const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

//Define routes
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const profileRoutes = require('./routes/profile');

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Register auth routes
app.use('/api/auth', authRoutes);

//Notes routes
app.use('/api/notes', notesRoutes);

//Profile routes
app.use('/api/profile', profileRoutes);

// Test root route
app.get('/', (req, res) => {
  res.send('Notes API is running!');
});

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Notes API is running on ${PORT}.`));