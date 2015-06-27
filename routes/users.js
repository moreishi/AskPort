var express = require('express');
var router = express.Router();
var expressJwt = require('express-jwt');
var config = require('../config');
var jwt = require('jsonwebtoken');

var authenticate = expressJwt({ secret: config.jwtSecretKey});

// Model
var User = require('../models/user');
var Post = require('../models/user');

/* GET users listing. */
router.route('/').get(authenticate, function(req, res, next) {
  var user = User.find({}).select('-password');
  user.exec(function(err,a) {
    res.json(a);
  });
});

router.route('/profile').get(authenticate, function(req, res, next) {
  var token = tokenVerify(req,res,next);
  var _user = User.findOne({ facebook: token }).select('-password');
  // Get profile
  _user.exec(function(err,a) {
    // Get followers
    User.find({ 'following.id': token }, function(err,b) {
      a.followers = b;
      res.json(a);
    });
    
  });  
});

router.route('/profile/:d').get(authenticate, function(req, res, next) {
  var profileId = req.query['id'];
  var _user = User.findOne({ facebook: profileId }).select('-password');
  // Get profile
  _user.exec(function(err,a) {
    // Get followers
    User.find({ 'following.id': profileId }, function(err,b) {
      a.followers = b;
      res.json(a);
    });    
  });  
});

// Add who you follow
router.route('/follow').get(authenticate,function(req, res, next) {

  var token = tokenVerify(req,res,next);

  var myFacebookId = token;
  User.findOne({ facebook: myFacebookId, 'following.id': {$ne: req.query['id']} }, function(err,_user) {
    
    if(_user) {
        _user.following.push({name: req.query['name'], id: req.query['id']});
        _user.save(function(err,push_result) {
          res.json({data: push_result});
        });      
    } else {
      console.log(_user);
      res.json({success: true, message: 'You are already following'});
    }

  });
});

router.route('/unfollow').get(authenticate,function(req, res, next) {

  var token = tokenVerify(req,res,next);
  console.log(token);
  console.log(req.query['id']);
  User.findOneAndUpdate({ facebook: token }, 
    { "$pull": { following: { "user": req.query['id'] } } }, 
    function(err,a) {
    res.json({ success: true });
  });

});

// Add who you follow
router.route('/follow/checkall').get(authenticate,function(req, res, next) {

  var token = tokenVerify(req,res,next);

  var data = JSON.parse(req.query.data);

  User.findOne({facebook: token }, function(err,a) {
    
    var b = [];
    console.log(data.length);
    
    a.following.map(function(c) {
      if(data.indexOf(c.id) > -1) { b.push(c.id); }      
    });
    
    res.json({success: true, data: b});
  });

});

// VERIFY TOKEN AND RETURN DECODED TOKEN
function tokenVerify(req,res,next) {
  var token = req.headers.authorization.replace("Bearer ", "");
  return jwt.verify(token, config.jwtSecretKey);
}

module.exports = router;