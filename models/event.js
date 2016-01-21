var mongoose = require("mongoose");

var eventSchema = mongoose.Schema({
    owner: {type: mongoose.Schema.Types.ObjectId, ref: "Account"},
    name: {type: String, required: true},
    start: {type: Date, required: true},
    end: {type: Date, required: true},
    location: {type: String, required: true},	// specific address
    description: String,
    image: String,
    approval: {type: Boolean, default: false, required: true}
});

var Events = mongoose.model("Events", eventSchema);

module.exports = Events;
