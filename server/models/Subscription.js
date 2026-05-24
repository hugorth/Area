const mongoose = require('mongoose');

/**
 * @typedef {Object} Subscription
 * @property {String} userId - The ID of the user who owns the subscription.
 * @property {String} actionName - The name of the action associated with the subscription.
 * @property {Boolean} isActive - Indicates whether the subscription is active. Defaults to false.
 * @property {Object} filters - The filters applied to the subscription.
 * @property {String} filters.from - The sender's email address to filter by. Defaults to an empty string.
 * @property {String} filters.subject - The subject to filter by. Defaults to an empty string.
 * @property {String[]} filters.keywords - The keywords to filter by. Defaults to an empty array.
 * @property {String} playlistName - The name of the playlist for action 5.
 */
const subscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  actionName: { type: String, required: true },
  isActive: { type: Boolean, default: false },
  filters: {
    from: { type: String, default: '' },
    subject: { type: String, default: '' },
    keywords: { type: [String], default: [] },
  },
  playlistName: { type: String, default: '' },
  singerName: { type: String, default: '' },
});

module.exports = mongoose.model('Subscription', subscriptionSchema);