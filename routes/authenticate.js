var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var config = require('../config');

// Model
var User = require('../models/user');

/* GET users listing. */
router.post('/', function(req, res, next) {  

  if(typeof req.body.email == "undefined"
    && typeof req.body.password == "undefined") {
    res.json({success: false, message: 'Missing required fields'});
  } else {
    User.findOne({ email: req.body.email, password: req.body.password })
    .select('-password').exec(function(err,user) {
      if(!user) { res.sendStatus(422); }
      else {
        var token = jwt.sign(user, config.jwtSecretKey, { expiresInMinutes: 60 * 5 });
        res.json({user: user, token: token});
      }
    });
  }

});

router.post('/signup', function(req, res, next) {  

  if((typeof req.body.name == "undefined") 
    && (typeof req.body.email == "undefined") 
    && (typeof req.body.password == "undefined")) {
    res.json({success: false, message: 'Missing required fields'});
  } else {

    var user = User.find({email: req.body.email});
    user.exec(function(err,result) {
      
      if(result.length !== 0) {
        res.json({success: false, message: 'That email is already in used'});
      } else {
        new User({
          name: req.body.name,
          email: req.body.email,
          password: req.body.password
        }).save(function(err,result){     
          var token = jwt.sign(user, config.jwtSecretKey, { expiresInMinutes: 60 * 5 });
          res.json({success: true, message: 'Your account has been created', token: token});
        });
      }

    });

  }

});

// Facebook Authenticate
router.post('/facebook', function(req, res, next) {

  console.log(req.body);

  if(typeof req.body.id != "undefined") {
    User.findOne({facebook: req.body.id}, function(err,_user) {
      console.log(_user);
      if(err) { throw err; }
      if(!_user) {
        console.log('create new profile');
        var data = {};
        if(typeof req.body.name != "undefined") { data.name = req.body.name }
        if(typeof req.body.email != "undefined") { data.email = req.body.email }
        if(typeof req.body.id != "undefined") { data.facebook = req.body.id }

          console.log(data);

        new User(data).save(function(err,_data) {
          console.log('ceated profile');
          console.log(err);
          console.log(_data);
          var token = jwt.sign(req.body.id, config.jwtSecretKey, { expiresInMinutes: 60 * 5 });
          res.json({success: true, token: token});
        });

      } else {
        console.log('success');
        var token = jwt.sign(req.body.id, config.jwtSecretKey, { expiresInMinutes: 60 * 5 });
        res.json({success: true, token: token});
      }

    });
  }

  
});

module.exports = router;