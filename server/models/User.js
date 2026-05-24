const mongoose = require('mongoose');

/**
 * @typedef {Object} User
 * @property {string} email - The email of the user. This field is required and must be unique.
 * @property {string} [password] - The password of the user. This field is optional.
 * @property {string} [firstName] - The first name of the user. This field is optional.
 * @property {string} [lastName] - The last name of the user. This field is optional.
 * @property {Date} [birthday] - The birthday of the user. This field is optional.
 * @property {('Male'|'Female'|'Other')} [identity] - The gender identity of the user. This field is optional and must be one of 'Male', 'Female', or 'Other'.
 * @property {string} - The profile picture URL of the user. This field is optional and defaults to '/uploads/default-profile-pic.jpg'.
 */
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    birthday: { type: Date, required: false },
    identity: { type: String, enum: ['Male', 'Female', 'Other'], required: false },
    profilePic: { type: String, default: '/uploads/default-profile-pic.jpg' }
});

const User = mongoose.model('User', userSchema);

module.exports = User;