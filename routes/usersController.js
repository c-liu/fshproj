// Primary author: Catherine
var express = require('express');
var router = express.Router();

var session = require("express-session");
var handleError = require('./utils.js').handleError;
var User = require("../models/user");
var Annotation = require("../models/annotation");
var Story = require("../models/story");

// GET /users/<id>
// Gets user information by id such as email, first & last name, etc.
// Response: user JSON
router.get("/:id", function(req, res) {
    User.findOne({ _id: req.params.id })
    .select("email firstName lastName")
    .exec(function(err, user){
        if(err) handleError(res, 500, err.message);
        else if(user) {
            res.json(user);
        } else {
            res.json({error: 'Error: No user found'});
        }
    });
});

/*
GET /users/<id>/annotations
Request body (optional): { minLatitude: Number, maxLatitude: Number, minLongitude: Number, maxLongitude: Number }
Gets all user’s annotations. Restricts them to the given area if request body is specified.
*/
router.get('/:id/annotations', function(req,res) {
    if(req.params.id === req.session.user._id || req.session.user.isAdmin) {
        Annotation.find({ author: req.params.id })
        .where("latitude").gt(req.body.minLatitude || -90)
        .where("latitude").lt(req.body.maxLatitude || 90)
        .where("longitude").gt(req.body.minLongitude || -180)
        .where("longitude").lt(req.body.maxLongitude || 180)
        .populate("author", "-password")
        .exec(function(err, annotations) {
            if(err) {
                handleError(res, 500, err.message);
            } else if(annotations) {
                res.json(annotations);
            } else {
                res.json({ error: "Error: Unable to get user annotations" });
            }
        });
    } else {
        handleError(res, 500, "Error: You do not have the permission to view these annotations");
    }
});

/*
GET /users/<id>/stories
Gets all user’s stories.
*/
router.get('/:id/stories', function(req,res) {
    if(req.params.id === req.session.user._id || req.session.user.isAdmin) {
        Story.find({ author: req.params.id })
        .exec(function(err, stories) {
            if(err) {
                handleError(res, 500, err.message);
            } else if(stories) {
                res.json(stories);
            } else {
                res.json({ error: "Error: Unable to get user stories" });
            }
        });
    } else {
        handleError(res, 500, "Error: You do not have the permission to view these stories");
    }
});
module.exports = router;