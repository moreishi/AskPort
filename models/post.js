var restful = require('node-restful');
var mongoose = restful.mongoose;

// Schema
var commentSchema = new mongoose.Schema({
  user: { type: String },
  comment: String,
  created_at: { type: Date, default: Date.now },
  modified_at: { type: Date, default: Date.now }
});

var postSchema = new mongoose.Schema({
  post: String,
  comments: [commentSchema],
  user: { type: String },
  userFrom: { type: String },
  created_at: { type: Date, default: Date.now },
  modified_at: { type: Date, default: Date.now }
});

module.exports = restful.model('Post', postSchema);