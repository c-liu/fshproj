var mongoose = require("mongoose");

var eventSchema = mongoose.Schema({
    //author?
    title: {type: String, required: true}
    dateofevent: Date,
    location: String,
    description: String,
    image: String,
    approval: {type: Boolean, default: false}
});

var Events = mongoose.model("Events", eventSchema);

module.exports = Events;
