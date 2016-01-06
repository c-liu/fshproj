var mongoose = require("mongoose");

var annotationSchema = mongoose.Schema({
    author: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    title: String,
    timestamp: Date,
    latitude: Number,
    longitude: Number,
    text: String,
    image: String,
    public: Boolean,
    story: {type: mongoose.Schema.Types.ObjectId, ref: "Story"}
});

var Annotation = mongoose.model("Annotation", annotationSchema);

module.exports = Annotation;