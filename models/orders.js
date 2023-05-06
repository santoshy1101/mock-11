const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  id:mongoose.Schema.Types.ObjectId,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  books: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model('Order', OrderSchema);