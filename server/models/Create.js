const mongoose = require('mongoose');

const createSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  action: {
    services: String,
    description: String,
    logo1: String,
    actionName: String,
  },
  reaction: {
    services: String,
    description: String,
    logo1: String,
    reactionName: String,
  },
  isActive: { type: Boolean, default: false },
  subscribed: { type: Boolean, default: false }
});

module.exports = mongoose.model('Create', createSchema);