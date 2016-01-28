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
    displayName: {type: String, required: true},
    //Location, lat/long vs address?
    latitude: {type: Number, required: true},
    longitude: {type: Number,required: true},
    country: String,
    state: String,//if applicable?
    town: String,
    //DOB: are there legal requirements for under 13 or something(USA only)?
    dob: {type: Number},
    displayDOB: {type: Boolean},
    // Deleted boolean: to determine whether to hide their info or not.
    deleted: {type: Boolean, required: true},
    image: String,	//URL to the image
    impairment: String,
    sex: String,
    hobbies: String,
    description: String,
    research: { type: Boolean, default: false },
    approval: { type: Boolean, default: false },
    isAdmin: { type: Boolean,default: false }
});

accountSchema.plugin(uniqueValidator);
var Account = mongoose.model("Account", accountSchema);

module.exports = Account;
