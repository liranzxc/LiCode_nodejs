var express = require('express');
var router = express.Router();
var format = require('format');
var fs = require('fs');
var mongoose  = require('mongoose');
const Multer = require('multer');
const { Storage } = require('@google-cloud/storage');

var Photo  = mongoose.model('Photos');
const bucketName = "staging.medicalhackthon.appspot.com";

const storage = new Storage({
  keyFilename: './key.json'
});



/* GET home page. */
router.get('/', function(req, res, next) {

  Photo.find({}, ['path','caption','file_image'], {sort:{ _id: -1} }, function(err, photos) {

    
    if(err) throw err;

    res.render('index', { title: 'NodeJS file upload tutorial', msg:req.query.msg, photolist : photos });
  
});
});

const multer = Multer({
  storage: Multer.MemoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // no larger than 5mb
  }
});

router.post('/upload',multer.single('photo'), function(req, res,next) {   
  if (!req.file) {
    res.status(400).send('No file uploaded.');
    return;
  }
  // Create a new blob in the bucket and upload the file data.
  const bucket = storage.bucket(bucketName);
  var name_file = (new Date().getTime().toString()+req.file.originalname);
  const blob = bucket.file(name_file);
  const blobStream = blob.createWriteStream({public:true});

  blobStream.on('error', (err) => {
    next(err);
  });

  blobStream.on('finish', () => {
    // The public URL can be used to directly access the file via HTTP.
    const publicUrl = format(`https://storage.googleapis.com/${bucket.name}/${blob.name}`);
          /**
           * Create new record in mongoDB
           */
          var document = {
            file_image: name_file,
            path:     publicUrl, 
            caption:   req.body.caption

          };

        var photo = new Photo(document); 
        photo.save(function(error){
          if(error){ 
            throw error;
          } 
          res.redirect("/?msg=1");
       });


   // res.status(200).send(publicUrl);
  })

  

  blobStream.end(req.file.buffer);

});
  
        

router.post("/deletephoto",function(req,res){

 var file_name = req.body.file_image;
 Photo.deleteOne({file_image:file_name},function(err){
  if(err)
  {
    res.redirect('/?msg=5'); // error
  }
  else
  {

    
  const bucket = storage.bucket(bucketName);
  const blob = bucket.file(file_name);
  blob.delete(function (err, apiResponse) {
    if (err) {
      console.log(err);
      res.redirect('/?msg=5'); // error

    }
    else {
      console.log("Deleted successfully");
      res.redirect('/?msg=4'); // error

    }
  });

  }


 });

});



module.exports = router;
