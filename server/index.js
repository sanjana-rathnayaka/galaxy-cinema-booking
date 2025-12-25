const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // .env ෆයිල් එකේ තියෙන දේවල් මෙතනින් Load කරනවා

// Models Import කිරීම
const Booking = require('./models/Booking');
const Movie = require('./models/Movie');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- MongoDB Connection (USING .ENV) ---
// අපි කෙලින්ම ලින්ක් එක ගහන්නේ නැතුව, .env එකේ තියෙන 'MONGO_URI' එක ගන්නවා.
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Atlas Connected Successfully!'))
  .catch(err => console.log('MongoDB Connection Error:', err));

// --- ROUTES ---

// 1. GET Movies
app.get('/api/movies', async (req, res) => {
  try {
    const movies = await Movie.find();
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. CREATE/UPDATE Movies (Slots)
app.post('/api/movies', async (req, res) => {
  try {
    const newMovie = new Movie(req.body);
    await newMovie.save();
    res.json(newMovie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/movies/:id', async (req, res) => {
  try {
    const updatedMovie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedMovie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET Bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ bookingDate: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. CREATE Booking
app.post('/api/bookings', async (req, res) => {
  try {
    const { movieTitle, seats, totalPrice, customerName, customerPhone, customerEmail } = req.body;

    const newBooking = new Booking({
      movieTitle,
      seats,
      totalPrice,
      customerName,
      customerPhone,
      customerEmail
    });

    await newBooking.save();
    res.status(201).json(newBooking);
  } catch (err) {
    console.error("Booking Error:", err);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// 5. DELETE ALL Bookings
app.delete('/api/bookings', async (req, res) => {
  try {
    await Booking.deleteMany({});
    res.json({ message: 'All bookings cleared successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear bookings' });
  }
});

// Server Start
// .env එකේ PORT එකක් නැත්නම් 5000 ගන්නවා
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));