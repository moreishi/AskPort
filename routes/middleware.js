'use strict';

var jwt = require('jsonwebtoken');
var config = require('../config');

module.exports = {
  auth: function(req,res,next) {

    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    if (token) {

    // verifies secret and checks exp
    jwt.verify(token,config.jwtSecretKey, function(err, decoded) {      
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });    
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;
        next();
      }
    });

    } else {

    return res.status(403).send({ 
        success: false, 
        message: 'No token provided.'
    });

    }

  }
}