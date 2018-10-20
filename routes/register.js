var express = require('express');
var router = express.Router();
var format = require('format');
var mongoose  = require('mongoose');



router.get('/', function(req, res, next) {


    res.render('register', { title: 'register page'});

});



module.exports = router;
