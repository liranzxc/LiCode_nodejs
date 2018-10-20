var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var photoSchema = new Schema({

  file_image: {type:String},
  path:  { type: String },
  caption: { type: String }
  
});

module.exports = mongoose.model('Photos', photoSchema);