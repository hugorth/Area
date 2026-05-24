const mongoose = require('mongoose');

/**
 * @typedef {Object} UserTokenSchema
 * @property {String} userId - The ID of the user associated with the token.
 * @property {String} service - The name of the service for which the token is used.
 * @property {String} accessToken - The access token provided by the service.
 * @property {String} refreshToken - The refresh token provided by the service.
 * @property {Date} expiresAt - The expiration date and time of the access token.
 */
const UserTokenSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  service: { type: String, required: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

module.exports = mongoose.model('UserToken', UserTokenSchema);
