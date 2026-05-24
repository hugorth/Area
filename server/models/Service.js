const mongoose = require('mongoose');

/**
 * @typedef {Object} Service
 * @property {string} name - The name of the service. This field is required.
 * @property {string} description - A brief description of the service. This field is required.
 */
const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
});

module.exports = mongoose.model('Service', serviceSchema);
