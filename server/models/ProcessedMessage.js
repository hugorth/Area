const mongoose = require('mongoose');

/**
 * Mongoose schema for processed messages.
 * 
 * @typedef {Object} ProcessedMessageSchema
 * @property {String} messageId - Unique identifier for the message. Required.
 * @property {String} userId - Identifier for the user who processed the message. Required.
 * @property {Date} processedAt - Timestamp when the message was processed. Defaults to the current date and time.
 * 
 * @property {Function} index - Adds an index for the userId field to optimize query performance.
 */
const ProcessedMessageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: String,
    required: true,
  },
  processedAt: {
    type: Date,
    default: Date.now,
  },
});

// Add an index for userId for faster queries
ProcessedMessageSchema.index({ userId: 1 }); 

module.exports = mongoose.model('ProcessedMessage', ProcessedMessageSchema);