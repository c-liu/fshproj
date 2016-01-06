var mongoose = require("mongoose");

var storySchema = mongoose.Schema({
	author	: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
	passkey : String,
	title 	: {type : String, required : true}
});

var Story = mongoose.model("Story", storySchema);

module.exports = Story;