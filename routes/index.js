var upload  = require('./upload');
var express = require('express');
var router = express.Router();
var fs = require('fs');
var mongoose  = require('mongoose');

var Photo  = mongoose.model('Photos');


/* GET home page. */
router.get('/', function(req, res, next) {

  Photo.find({}, ['path','caption'], {sort:{ _id: -1} }, function(err, photos) {

    
    if(err) throw err;

    res.render('index', { title: 'NodeJS file upload tutorial', msg:req.query.msg, photolist : photos });
  
});
});

router.post('/upload', function(req, res) { 

  upload(req, res,(error) => {
    if(error){
       res.redirect('/?msg=3');
    }else{
      if(req.file == undefined){
        
        res.redirect('/?msg=2');

      }else{
           
          /**
           * Create new record in mongoDB
           */
          var fullPath = "files/"+req.file.filename;

          var document = {
            path:     fullPath, 
            caption:   req.body.caption
          };

        var photo = new Photo(document); 
        photo.save(function(error){
          if(error){ 
            throw error;
          } 
          res.redirect("/?msg=1");
       });
    }
  }
});
});

router.post("/deletephoto",function(req,res){

 var path_img =req.body.path;
 Photo.deleteOne({path:path_img},function(err){
  if(err)
  {
    res.redirect('/?msg=5'); // error
  }

 });

 fs.unlink("./public/"+path_img, (err) => {
  if (err) {
      console.log("************");
      console.log("failed to delete local image:"+err);
      console.log(path_img);
      res.redirect('/?msg=5');

  } else {
    console.log("************");
    console.log('successfully deleted local image');   
    console.log(path_img);   
    res.redirect('/?msg=1');
  }

});

});



module.exports = router;
