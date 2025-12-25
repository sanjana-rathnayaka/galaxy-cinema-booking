const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  showTime: { type: String, required: true },
  description: { type: String }
});

module.exports = mongoose.model('Movie', movieSchema);