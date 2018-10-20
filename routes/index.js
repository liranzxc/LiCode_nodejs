var express = require('express');
var router = express.Router();
var format = require('format');
var fs = require('fs');
var mongoose  = require('mongoose');
const Multer = require('multer');
const { Storage } = require('@google-cloud/storage');
var request = require("request");
var cookieParser = require("cookie-parser");

var Email_account;
var Password_account;

var Photo  = mongoose.model('Photos');
var Users =  mongoose.model('Users');

const bucketName = "staging.medicalhackthon.appspot.com";

const storage = new Storage({
  keyFilename: './key.json'
});



/* GET home page. */
router.get('/', function(req, res, next) {

  var context = req.cookies["context"];
  //res.clearCookie("context", { httpOnly: true });

  Email_account = context['email'];
  Password_account = context['password'];

  Users.findOne({email:Email_account , password:Password_account} , function(err, user) {

    if(err) throw err;
    
    var photojson =JSON.parse(JSON.stringify(user.photos)) ;
    res.render('index', { title: 'My Gallary', msg:req.query.msg, photolist : photojson });
  
});
});

router.get("/myaccount",function(req,res,next){

  Users.findOne({email:Email_account , password:Password_account} , function(err, user) {

    if(err) throw err;
    res.render('myaccount', { title: 'Account information', msg:req.query.msg, myuser : user });

  });

});
function CheckIfValid(email_text , password_text,callback)
{
 Users.findOne({email : email_text ,password : password_text},['email','password'],function(err , user){

  if(err) throw err;
    if(user == null )  {
      callback(404);
    }  
    else
    {
      return callback(user);
    }
  });
}

function AddUser(email_text,password_text,firstname_text,lastname_text)
{
  var document = {email : email_text ,
     password : password_text,
     firstname : firstname_text,
     lastname : lastname_text,
     photos : [] ,
     grouppublish : []

    
    };

  var user = new Users(document); 
  user.save(function(error){
    if(error){ 
      throw error;
    } 
   
 });
}

// multer 
const multer = Multer({
  storage: Multer.MemoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // no larger than 5mb
  }
});


// upload photo on gallery

router.post('/upload',multer.single('photo'), function(req, res,next) {   

  if (!req.file) {
    res.status(400).send('No file uploaded.');
    return;
  }
  // Create a new blob in the bucket and upload the file data.
  const bucket = storage.bucket(bucketName);
  var name_file = Email_account.split("@")[0]+"/"+(new Date().getTime().toString()+req.file.originalname);
  const blob = bucket.file(name_file);
  const blobStream = blob.createWriteStream({public:true});

  blobStream.on('error', (err) => {
    next(err);
  });

  blobStream.on('finish', () => {
    // The public URL can be used to directly access the file via HTTP.
    const publicUrl = format(`https://storage.googleapis.com/${bucket.name}/${blob.name}`);
          
          // Create new record in mongoDB
           
           var document = {
            file_image: name_file,
            path:     publicUrl, 
            caption:   req.body.caption

         };

        Users.updateOne({email:Email_account , password : Password_account},{$push : { photos:{$each : [document]}}},function(error){

          if(error) throw error;
          else
          res.cookie("context", {email: Email_account,password:Password_account}, { httpOnly: true });
          res.redirect("/");

        });  


        

   // res.status(200).send(publicUrl);
  });


  blobStream.end(req.file.buffer);

});
  
        

router.post("/deletephoto",function(req,res){

 var file_name = req.body.file_image;
//
var q = {email:Email_account};
 
Users.updateOne({email:Email_account , password : Password_account},{$pull : { photos: {file_image:file_name}}},function(err){

  if(err)
  {
    console.log(err);
    res.cookie("context", {email: Email_account,password:Password_account}, { httpOnly: true });
    res.redirect('/'); // error
  }
  else
  {
    const bucket = storage.bucket(bucketName);
    const blob = bucket.file(file_name);
    blob.delete(function (err, apiResponse) {
    if (err) {
       console.log(err);

       res.cookie("context", {email: Email_account,password:Password_account}, { httpOnly: true });
       res.redirect('/'); // error

    }
     else {
     console.log("Deleted successfully");
     res.cookie("context", {email: Email_account,password:Password_account}, { httpOnly: true });
      res.redirect('/'); // error

    }
     });
  }

});

});
//
  
router.post("/deletegroup",function(req,res){

  Users.updateOne({email:Email_account , password : Password_account},
    {$pull : { grouppublish: {$in : [req.body.group] }}},{multi:true},function(err){

      if(err) throw error;

      res.redirect("/myaccount");

}); 
}); 

function IsGroupValid(group_name ,callback)
{
  var request_post = {email : Email_account , password : Password_account , groupname: group_name }; 


  request({
   url: "http://localhost:8080/group_valid ",
   method: "POST",
   json: true,   // <--Very important!!!
   body: request_post
  }, function (error, response, body){

  callback(body["code"]);
   
  });

}

router.post("/addgroup",function(req,res){

  IsGroupValid(req.body.name_group,function(code){

    if(code!= 200)
    { 
    res.redirect("/myaccount"); // bad
    }
    else
    {
    Users.updateOne({email:Email_account , password : Password_account},
      {$push : { grouppublish: {$each : [req.body.name_group] }}},function(err){
  
        if(err) throw error;
        res.redirect("/myaccount"); // good
  
  }); 
}

  });

 
}); 




router.post('/testpost', function(req, res) {   

     // send upload 
     Photo.findOne({},function(err,record){

      if(err)
      {
        throw err;
      }
      else
      {

      var request_post = {email : "lirannh@gmail.com" , password : "liranzxc1234" ,
       url : record['path'] , text : record['caption'] , groupsname : [] }; 


       request({
        url: "http://localhost:8080/send",
        method: "POST",
        json: true,   // <--Very important!!!
        body: request_post
       }, function (error, response, body){


        if(body["code"] == 200)
        { 
          
          res.redirect("/?msg=1");
        }
        else
        {
          res.redirect("/?msg=6");

        }
       });
      }
     });
     
  
  });


router.post("/login",function(req,res){

  var email = req.body.email;
  var password = req.body.password;
  CheckIfValid(email,password,function callback(params) {

    if(params == 404)
    {
      console.log("fail");
      res.render("login",{msg : 2});


    }
    else
    {
      console.log("good");
      res.cookie("context", {email: email,password:password}, { httpOnly: true });
      res.redirect("/");

    }
    
  });
});

function CheckValidCredit(credit,callback)
{
  
  request({
    url: "http://localhost:8080/login_valid",
    method: "POST",
    json: true,   // <--Very important!!!
    body: credit
   }, function (error, response, body){


    if(body["code"] == 200)
    { 
      
      callback(200);
    }
    else
    {
      callback(404);
    }
   });

}
router.post("/register",function(req,res){

  var email_c = req.body.email;
  var password_c = req.body.password;

  var credit = {email : email_c , password:password_c}
  // check if valid
  CheckValidCredit(credit,function callback(code){

      if(code == 200)
      {
        AddUser(req.body.email , req.body.password,req.body.firstname , req.body.lastname);
        console.log("valid succefully");
        res.redirect("/login");

      }
      else
      {
        console.log("valid fail");
        res.render("register",{msg:2});
      }

  });
  // is valid 






});
module.exports = router;
