var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({

  firstname : { type:String},
  lastname : { type:String},
  email: {type:String},
  password:  { type: String },
  grouppublish : [String],
  photos : [{file_image: {type:String},path:  { type: String },caption: { type: String }}]
  
});

module.exports = mongoose.model('Users', UserSchema);