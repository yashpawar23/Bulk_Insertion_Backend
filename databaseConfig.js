const mongoose = require('mongoose');

const URL = 'mongodb://localhost:27017/MyDataBase';

console.log("Attempting to connect to MongoDB...");

mongoose.connect(URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
  });

const cardNumberSchema = new mongoose.Schema({
  // CardNumber: {
  //   type: String,
  //   required: true
  // },
  firstfivedigit: { type: String, required: true },
  lastfourdigit: { type: String, required: true }
});

const cardNum = mongoose.model('cardNumbers', cardNumberSchema);

module.exports = {cardNum}
