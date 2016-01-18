var mongoose = require("mongoose");
var uniqueValidator = require('mongoose-unique-validator');

var accountSchema = mongoose.Schema({
    email: {
		type: String,
		required: true,
		unique: true
    },
    password : {type: String},
    // Name
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    displayName: {type: Boolean, required: true},
    //Location, lat/long vs address?
	country: String,
	state: String,//if applicable?
	town: String,	
	displayLocation: Boolean,
	//DOB
	dob: {type: Date, required: true}
	displayDOB: {type: Boolean, required: true}
    // Deleted boolean: to determine whether to hide their info or not.
    deleted: {tyep: Boolean, required: true},
    image: String,	//URL to the image
    impairment: String,
    sex: String,
    hobbies: String,
    description: String,
    approval: { 
		type: Boolean, 
	    default: false 
    },
    isAdmin: {
		type: Boolean,
	    default: false 
    }
});

accountSchema.plugin(uniqueValidator);
var Account = mongoose.model("Account", accountSchema);

module.exports = Account;
