var mongoose = require("mongoose");

var accountSchema = mongoose.Schema({
    username: {
		type: String, 
		display: Boolean,
		required: true,
		unique: true
    },
    password : {type: String},
    name: {
		first: {
		    type: String, 
		    required: true
		},
		last: { 
		    type: String,
		    required: true
		},
		display: Boolean
    },
    location: {
		country: String,
		state: String,//if applicable?
		town: String
		display: Boolean, 
		required: true
    },
    dob: { 
		dateofbirth: Date,
		display: Boolean,
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

module.exports = Account;
