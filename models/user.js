var mongoose = require("mongoose");
var uniqueValidator = require('mongoose-unique-validator');

var userSchema = mongoose.Schema({
    email : {type: String, required: true},
    password : {type: String},
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    openId: String,
    isAdmin: Boolean
});

userSchema.plugin(uniqueValidator);
var User = mongoose.model("User", userSchema);

module.exports = User;