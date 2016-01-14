var mongoose = require("mongoose");
var uniqueValidator = require('mongoose-unique-validator');

var nameSchema = mongoose.Schema ({
	first: {
	    type: String, 
	    required: true
	},
	last: { 
	    type: String,
	    required: true
	},
	display: Boolean
});

var Name = mongoose.model("Name", nameSchema);

var locationSchema = mongoose.Schema ({
	country: String,
	state: String,//if applicable?
	town: String,	
	display: Boolean, 
});

var Location = mongoose.model("Location", locationSchema);

var dobSchema = mongoose.Schema({
	dateofbirth: Date,
	display: Boolean,
});

var DOB = mongoose.model("DOB", dobSchema);

var accountSchema = mongoose.Schema({
    email: {
		type: String, 
		display: Boolean,
		required: true,
		unique: true
    },
    password : {type: String},
    name: {type: mongoose.Schema.Types.ObjectId, ref: "Name"},
    location: {
		type: mongoose.Schema.Types.ObjectId, ref: "Location",
		required: true
    },
    dob: {
    	type: mongoose.Schema.Types.ObjectId, ref: "DOB",
		required: true	// required since people have to be above 13 to give personal info, or we need a privacy policy or something
    },
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

module.exports = {'Account': Account, 'Name': Name, 'Location': Location, 'DOB': DOB};
