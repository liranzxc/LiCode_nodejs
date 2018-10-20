var express = require('express');
var router = express.Router();
var format = require('format');
var mongoose  = require('mongoose');



router.get('/', function(req, res, next) {


    res.render('login', { title: 'login page'});

});



module.exports = router;
