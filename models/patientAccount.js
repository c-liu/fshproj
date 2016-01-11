var mongoose = require("mongoose");

var patientSchema = mongoose.Schema({
    username: {
	type: String, 
	display: Boolean,
	required: true,
	unique: true
    },
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
	display: Boolean
    },
    dob: { 
	dateofbirth: Date,
	display: Boolean
    },
    image: String,
    degree: String, //????
    Sex: String,
    hobbies: String,
    description: String,
    approval: { 
	type: Boolean, 
        default: false 
    }

});

var Patient = mongoose.model("Patient", patientSchema);

module.exports = Patient;
