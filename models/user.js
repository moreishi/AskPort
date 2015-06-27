var restful = require('node-restful');
var mongoose = restful.mongoose;
var config = require('../config');

// Schema
var userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  facebook: { type: String },
  created_at: { type: Date, default: Date.now },
  following: [new mongoose.Schema({ id: String, name: String, facebook: String })],
  followers: [new mongoose.Schema({ id: String, name: String })],
  modified_at: { type: Date, default: Date.now }
})

module.exports = restful.model('User', userSchema);