var mongoose = require("mongoose");

var eventSchema = mongoose.Schema({
	owner: {type: mongoose.Schema.Types.ObjectId, ref: "Account"},
    title: {type: String, required: true}
    dateofevent: Date,
    location: String,
    description: String,
    image: String,
    approval: {type: Boolean, default: false, required: true}
});

var Events = mongoose.model("Events", eventSchema);

module.exports = Events;
