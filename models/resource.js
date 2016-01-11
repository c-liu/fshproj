var mongoose = require("mongoose");

var resourceSchema = mongoose.Schema({
    //author?
    name: {type: String, required: true},
    location: {type: String, required: true},
    description: String,
    image: String,
    approval: {type: Boolean, default: false}
});

var Resources = mongoose.model("Resources", resourceSchema);

module.exports = Resources;
