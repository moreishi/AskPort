var express = require('express');
var router = express.Router();
var expressJwt = require('express-jwt');
var config = require('../config');
var jwt = require('jsonwebtoken');

// Auth
var authenticate = expressJwt({ secret: config.jwtSecretKey});
var question = require('../models/questions.json');
// Model
var Post = require('../models/post');
var User = require('../models/user');

// GET ALL POST BY FOLLOWING AND MY POST
router.route('/').get(authenticate, function(req, res, next) {  
  
  var token = req.headers.authorization.replace("Bearer ", ""); // VERIFY TOKEN
  token = jwt.verify(token, config.jwtSecretKey); // RETURNS FACEBOOK ID

  User.findOne({ facebook: token }, function(err,a) {
    // a = RESULT OF CURRENT USER 

    initFollowing(function(following) {
      Post.find({ user: { $in: following } }, function(errb, b) {
        res.json(b);
      });
    });

    function initFollowing(cb) {
      var following = [];
      following.push(token);
      a.following.map(function(val) {
        following.push(val.id);
      });
      cb(following);
    }

  });
});

/* Generate new question */
router.route('/generate/').post(authenticate,function(req, res, next) {  
  if(typeof req.body.id == "undefined") { res.sendStatus(422); }
  try {

    var qtion = question.data[Math.floor((Math.random() * question.data.length) + 1)];
    var token = req.headers.authorization.replace("Bearer ", "");
    token = jwt.verify(token, config.jwtSecretKey);

    new Post({
      post: qtion,
      user: token,
      userFrom: "1000000000001"
    }).save(function(err,result){
      if (err) throw err;
      console.log(result);
      res.json({success: true, data: result});
    });

  } catch(e) {
    throw e;
  }
});

router.route('/user').get(authenticate,function(req, res, next) {
  if(typeof req.params['id'] == "undefined") { res.sendStatus(422); }
});

router.route('/:id').get(authenticate,function(req, res, next) {
  Post.find({user: req.params.id}, function(err,posts) {
    if (typeof posts == "undefined") { posts = [] };
    // res.json({success: true, data: posts});
    res.json(posts);
  });
});

router.route('/').post(authenticate, function(req, res, next) {

  if(typeof req.body.userTo == "undefined") { res.sendStatus(422); }

  try {

    var token = req.headers.authorization.replace("Bearer ", "");
    token = jwt.verify(token, config.jwtSecretKey);

    new Post({
      post: req.body.post,
      user: token,
      userTo: req.body.userTo
    }).save(function(err,result){
      if (err) throw err;
      res.json(result);
    });

  } catch(e) {
    throw e;
  }

});

router.route('/:id/answer').post(authenticate, function(req, res, next) {

  var token = req.headers.authorization.replace("Bearer ", "");
  token = jwt.verify(token, config.jwtSecretKey);
  
  console.log(req.body._id);

  Post.findOne({_id: req.body._id}, function(err,post) {
    // console.log(post);
    post.comments.push({
      user: token,
      comment: req.body.answerField
    });
    post.save(function(err,comment) {
      console.log(err);
      console.log(comment);
      res.json({success:true, data: comment});
    });    
  });

});

// DELETE
router.route('/:id').delete(authenticate, function(req, res, next) {

  var model = Post.remove({ _id: req.params.id });
  model.exec(function(err,result) {
    res.json({success: true, message: 'Post deleted'})
  });

});

module.exports = router;