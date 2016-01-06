// Primary author: Eric
var express = require('express');
var router = express.Router();
var Annotation = require("../models/annotation");

// GET /annotations
// Request body (optional): { minLatitude: Number, maxLatitude: Number, minLongitude: Number, maxLongitude: Number }
// Gets all public annotations. Restricts them to the given area if request body is specified.
router.get("/", function(req, res) {
    Annotation.find({ public: true })
    .where("latitude").gt(req.body.minLatitude || -90)
    .where("latitude").lt(req.body.maxLatitude || 90)
    .where("longitude").gt(req.body.minLongitude || -180)
    .where("longitude").lt(req.body.maxLongitude || 180)
    .populate("author", "-password")
    .exec(function(err, annotations) {
        if(err) {
            res.json({ error: err.message });
        } else if(annotations) {
            res.json(annotations);
        } else {
            res.json({ error: "Error: No annotations found" });
        }
    });
});

// Require authentication for the rest of the actions
router.use(function(req, res, next) {
    if(req.session.user) {
        next();
    } else {
        res.json({ error: "Error: You must be logged in to perform this action" });
    }
});

// POST /annotations
// Request body: { title: String, latitude: Number, longitude: Number, text: String, image: Base64, public: Boolean, storyId: ObjectId }
// Creates a new annotation as the currently logged-in user. Responds with { success: true, id: ObjectId } upon success, and with { error: String } otherwise.
router.post("/", function(req, res) {
    var annotation = new Annotation({
        author: req.session.user._id,
        title: req.body.title,
        timestamp: new Date(),
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        text: req.body.text,
        image: req.body.image || "",
        public: req.body.public
    });
    if(req.body.storyId) annotation.story = req.body.storyId;
    annotation.save(function(err, savedAnnotation) {
        if(err) {
            res.json({ error: err.message });
        } else {
            res.json({ success: true, id: savedAnnotation._id });
        }
    });
});

// PUT /annotations/<id>
// Request body: { title: String, text: String, image: Base64, public: Boolean, storyId: ObjectId }
// Updates an annotation, so long as it belongs to the currently logged-in user.
router.put("/:id", function(req, res) {
    Annotation.findOne({ _id: req.params.id, author: req.session.user._id }, function(err, annotation) {
        if(err) {
            res.json({ error: err.message });
        } else if(annotation) {
            annotation.title = req.body.title || annotation.title;
            annotation.text = req.body.text || annotation.text;
            annotation.image = req.body.image || annotation.image;
            if(req.body.storyId) annotation.story = req.body.storyId;
            if(typeof(req.body.public) != "undefined") {
                annotation.public = req.body.public;
            }
            annotation.save(function(err) {
                if(err) {
                    res.json({ error: err.message });
                } else {
                    res.json({ success: true });
                }
            });
        } else {
            res.json({ error: "Error: You do not have permission to edit this annotation" });
        }
    });
});

// DELETE /annotations/<id>
// Deletes the annotation with the given id, so long as it belongs to the currently logged-in user.
router.delete("/:id", function(req, res) {
    Annotation.findOne({ _id: req.params.id, author: req.session.user._id })
    .remove()
    .exec(function(err, num) {
        if(err) {
            res.json({ error: err.message });
        } else if(num > 0) {
            res.json({ success: true });
        } else {
            res.json({ error: "Error: You do not have permission to edit this annotation" });
        }
    });
});

module.exports = router;
