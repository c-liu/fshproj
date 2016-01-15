var mongoose = require("mongoose");
var uniqueValidator = require('mongoose-unique-validator');

// var nameSchema = mongoose.Schema ({
// 	first: {
// 	    type: String, 
// 	    required: true
// 	},
// 	last: { 
// 	    type: String,
// 	    required: true
// 	},
// 	display: Boolean
// });

// var Name = mongoose.model("Name", nameSchema);

// var locationSchema = mongoose.Schema ({
// 	country: String,
// 	state: String,//if applicable?
// 	town: String,	
// 	display: Boolean, 
// });

// var Location = mongoose.model("Location", locationSchema);

// var dobSchema = mongoose.Schema({
// 	dateofbirth: Date,
// 	display: Boolean,
// });

// var DOB = mongoose.model("DOB", dobSchema);

var accountSchema = mongoose.Schema({
    email: {
		type: String, 
		display: Boolean,
		required: true,
		unique: true
    },
    password : {type: String},
    // Name
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    displayName: {type: Boolean, required: true},
    //Location
	country: String,
	state: String,//if applicable?
	town: String,	
	displayLocation: Boolean, 
	//DOB
	dob: Date,
	displayDOB: Boolean,

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
