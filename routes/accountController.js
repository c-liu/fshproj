var express = require('express');
var router = express.Router();

var session = require("express-session");
var handleError = require('./utils.js').handleError;
var Account = require("../models/account");
var Event = require("../models/event");
var Resource = require("../models/resource");

// GET /accounts/<id>
// Gets user information by id such as email, first & last name, etc.
// Response: all user info and display settings
router.get("/:id", function(req, res) {
    Account.findOne({ _id: req.params.id })
    .select("email firstName lastName")
    .exec(function(err, user){
        if(err) handleError(res, 500, err.message);
        else if(account) {
            res.json(account);
        } else {
            res.json({error: 'Error: No account found'});
        }
    });
});

//PUT change user info

/*
GET /accounts/<id>/events
Gets all user’s events.
*/
router.get('/:id/events', function(req,res) {
    if(req.params.id === req.session.user._id || req.session.user.isAdmin) {
        Event.find({ author: req.params.id })
        .populate("author", "-password")
        .exec(function(err, events) {
            if(err) {
                handleError(res, 500, err.message);
            } else if(events) {
                res.json(events);
            } else {
                res.json({ error: "Error: Unable to get user events" });
            }
        });
    } else {
        handleError(res, 500, "Error: You do not have the permission to view these events");
    }
});

/*
GET /accounts/<id>/resources
Gets all user’s resources.
*/
router.get('/:id/resources', function(req,res) {
    if(req.params.id === req.session.user._id || req.session.user.isAdmin) {
        Resource.find({ author: req.params.id })
        .exec(function(err, resources) {
            if(err) {
                handleError(res, 500, err.message);
            } else if(resources) {
                res.json(resources);
            } else {
                res.json({ error: "Error: Unable to get user resources" });
            }
        });
    } else {
        handleError(res, 500, "Error: You do not have the permission to view these resources");
    }
});
module.exports = router;