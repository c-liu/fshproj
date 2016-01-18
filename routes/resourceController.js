var express = require('express');
var router = express.Router();
var Resource = require("../models/resource");


// Require authentication for the rest of the actions
router.use(function(req, res, next) {
    if(req.session.user && req.session.user.approval) {
        next();
    } else {
        res.json({ error: "Error: You must be logged in and approved by a mod to perform this action" });
    }
});

// GET /resources
// Request body (optional): { minLatitude: Number, maxLatitude: Number, minLongitude: Number, maxLongitude: Number }
// Gets all approved resources. Restricts them to the given area if request body is specified.
router.get("/", function(req, res) {
    var query = {approval: true};

    Resource.find(query)
    // .where("latitude").gt(req.body.minLatitude || -90)
    // .where("latitude").lt(req.body.maxLatitude || 90)
    // .where("longitude").gt(req.body.minLongitude || -180)
    // .where("longitude").lt(req.body.maxLongitude || 180)
    .populate("owner", 'firstName lastName displayName')  //name has display settings to determine whether or not to strip it out
    .exec(function(err, resources) {
        if(err) {
            res.json({ error: err.message });
        } else if(resources) {
            resources.forEach(function (resource) {
                if (!resource.owner.displayName && !req.session.user.isAdmin) {
                    resource.owner.firstName = 'Anonymous'
                    resource.owner.lastName = 'Poster'
                }
            });
            res.json(resources);
        } else {
            res.json({ error: "Error: No resources found" });
        }
    });
});

// POST /resources
// Request body:
    /*
    name: {type: String, required: true},
    location: {type: String, required: true},
    description: String,
    image: String
    */
// Creates a new resource as the currently logged-in user. Responds with { success: true, id: ObjectId } upon success, and with { error: String } otherwise.
router.post("/", function(req, res) {

    var resource = new Resource({
        owner: req.session.user._id,    // required
        name: req.body.name,    //required
        location: req.body.location,    //required
        description: req.body.description,
        image: req.body.image || "",
        approval: req.session.user.isAdmin || false
    });
    resource.save(function(err, savedResource) {
        if(err) {
            res.json({ error: err.message });
        } else {
            res.json({ success: true, id: savedResource._id });
        }
    });
});


//TODO(catliu): Finish PUT/DELETE, then copy over for Events
// PUT /annotations/<id>
// Request body: { title: String, text: String, image: Base64, public: Boolean, storyId: ObjectId }
// Updates an annotation, so long as it belongs to the currently logged-in user.
router.put("/:id", function(req, res) {
    Resource.findOne({ _id: req.params.id, author: req.session.user._id }, function(err, annotation) {
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
    Resource.findOne({ _id: req.params.id, author: req.session.user._id })
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
