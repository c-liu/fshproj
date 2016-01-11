var mongoose = require("mongoose");

var resourceSchema = mongoose.Schema({
	owner: {type: mongoose.Schema.Types.ObjectId, ref: "Account"},
    name: {type: String, required: true},
    location: {type: String, required: true},
    description: String,
    image: String,
    approval: {type: Boolean, default: false, required: true}
});

var Resources = mongoose.model("Resource", resourceSchema);

module.exports = Resources;
