const mongoose = require('mongoose');

/**
 * @typedef {Object} UserService
 * @property {mongoose.Schema.Types.ObjectId} user_id - The ID of the user, referencing the User model. This field is required.
 * @property {mongoose.Schema.Types.ObjectId} service_id - The ID of the service, referencing the Service model. This field is required.
 * @property {Date} subscribedAt - The date and time when the user subscribed to the service. Defaults to the current date and time.
 */
const userServiceSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  service_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  subscribedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserService', userServiceSchema);