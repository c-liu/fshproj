var mongoose = require("mongoose");

var modSchema = mongoose.Schema({
    username: {
	type: String, 
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
    approval: {
	type: Boolean, 
    default: false
    }
});

var Moderator = mongoose.model("Moderator", modSchema);

module.exports = Moderator;
