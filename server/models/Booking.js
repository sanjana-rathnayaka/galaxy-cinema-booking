const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  movieTitle: { type: String, required: true },
  seats: { type: [String], required: true },
  totalPrice: { type: Number, required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: {type: String, required: true},
  bookingDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);