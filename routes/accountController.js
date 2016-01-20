var express = require('express');
var router = express.Router();

var session = require("express-session");
var handleError = require('./utils.js').handleError;
var Account = require("../models/account");
var Event = require("../models/event");
var Resource = require("../models/resource");

// Require authentication for the rest of the actions
router.use(function(req, res, next) {
    if(req.session.user && req.session.user.approval && !req.session.user.deleted) {
        next();
    } else {
        res.json({ error: "Error: You must be logged in and approved by a mod to perform this action" });
    }
});

// GET /accounts/<id>
// Gets user information by id such as email, first & last name, etc.
// Response: all user info and display settings
router.get("/:id", function(req, res) {
    Account.findOne({ _id: req.params.id })
    .select("-password -deleted -approval")
    .exec(function(err, account){
        if(err) handleError(res, 500, err.message);
        else if(account) {
            res.json(account);
        } else {
            res.json({error: 'Error: No account found'});
        }
    });
});

// PUT /accounts/<id>
// Request body: { email: String, password: String, firstName: String, lastName: String, and all optional fields }
// Updates account information, so long as it belongs to the currently logged-in user.
// Cannot change email or name
router.put("/:id", function(req, res) {
    Account.findOne({ _id: req.params.id}, function(err, user) {
        if(err) {
            res.json({ error: err.message });
        } else if(user) {
            if(req.body.password) {
                // store a hashed password
                user.password = crypto.createHash('md5')
                    .update(req.body.password)
                    .digest('hex');
            }
            console.log(req.body);
            if (req.body.displayName || !req.body.displayName) user.displayName = req.body.displayName;

            if(req.body.country) user.country = req.body.country;
            if(req.body.state) user.state = req.body.state;
            if(req.body.town) user.town = req.body.town;
            if(req.body.displayLocation || !req.body.displayLocation) user.displayLocation = req.body.displayLocation;
            if(req.body.dob) user.dob = req.body.dob;
            if(req.body.displayDOB || !req.body.displayDOB) user.displayDOB = req.body.displayDOB;

            if(req.body.image) user.image = req.body.image;
            if(req.body.impairment) user.impairment = req.body.impairment;
            if(req.body.sex) user.sex = req.body.sex;
            if(req.body.hobbies) user.hobbies = req.body.hobbies;
            if(req.body.description) user.description = req.body.description;

            user.save(function(err) {
                if(err) {
                    res.json({ error: err.message });
                } else {
                    res.json({ success: true });
                }
            });
        } else {
            res.json({ error: "Error: You do not have permission to edit this account" });
        }
    });
});

/*
GET /accounts/<id>/events
Gets all user’s events.
*/
router.get('/:id/events', function(req,res) {
    if(req.params.id === req.session.user._id || req.session.user.isAdmin) {
        Event.find({ owner: req.params.id })
        .populate("owner", "-password")
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
        Resource.find({ owner: req.params.id })
        .populate("owner", "-password")
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

/*
GET /accounts/moderator/pendingresources
Gets all pending resources
*/
router.get('/moderator/pendingresources', function(req,res){
    if(req.session.user.isAdmin) {
        Resource.find({ approval : false })
        .populate('owner', '-password')
        .exec(function(err, resources) {
            if(err) {
                handleError(res, 500, err.message);
            } else if(resources) {
                res.json(resources);
            } else {
                res.json({ error: "Error: Unable to get pending resources" });
            }
        });
    } else {
        handleError(res, 500, "Error: You do not have the permission to view these resources");
    }
});

/*
GET /accounts/moderator/pendingevents
Gets all pending events
*/
router.get('/moderator/pendingevents', function(req,res){
    if(req.session.user.isAdmin) {
        Event.find({ approval : false })
        .populate('owner', '-password')
        .exec(function(err, events) {
            if(err) {
                handleError(res, 500, err.message);
            } else if(events) {
                res.json(events);
            } else {
                res.json({ error: "Error: Unable to get pending events" });
            }
        });
    } else {
        handleError(res, 500, "Error: You do not have the permission to view these events");
    }
});

/*
GET /accounts/moderator/pendingaccounts
Gets all pending accounts
*/
router.get('/moderator/pendingaccounts', function(req,res){
    if(req.session.user.isAdmin) {
        Account.find({ approval : false })
        .populate('owner', '-password')
        .exec(function(err, users) {
            if(err) {
                handleError(res, 500, err.message);
            } else if(users) {
                res.json(users);
            } else {
                res.json({ error: "Error: Unable to get pending users" });
            }
        });
    } else {
        handleError(res, 500, "Error: You do not have the permission to view these users");
    }
});

// PUT /accounts/moderator/pendingresources
// Request body: {TODO}
// Updates resource information and/or changes approval status.
router.put("/moderator/pendingresources/:id", function(req, res) {
    Resource.findOne({ _id: req.params.id}, function(err, resource) {
        if(err) {
            res.json({ error: err.message });
        } else if(resource) {
            if (req.body.name) resource.name = req.body.name;
            if (req.body.location) resource.location = req.body.location;
            if (req.body.description) resource.description = req.body.description;
            if (req.body.image) resource.image = req.body.image;
            if (req.body.approval) resource.approval = req.body.approval;

            resource.save(function(err) {
                if(err) {
                    res.json({ error: err.message });
                } else {
                    res.json({ success: true });
                }
            });
        } else {
            res.json({ error: "Error: You do not have permission to edit this resource" });
        }
    });
});

// PUT /accounts/moderator/pendingevents
// Request body: {TODO}
// Updates event information and/or changes approval status.
router.put("/moderator/pendingevents/:id", function(req, res) {
    Resource.findOne({ _id: req.params.id}, function(err, event) {
        if(err) {
            res.json({ error: err.message });
        } else if(event) {
            if (req.body.name) event.name = req.body.name;
            if (req.body.location) event.location = req.body.location;
            if (req.body.dateofevent) event.dateofevent = req.body.dateofevent;
            if (req.body.description) event.description = req.body.description;
            if (req.body.image) event.image = req.body.image;
            if (req.body.approval) event.approval = req.body.approval;

            event.save(function(err) {
                if(err) {
                    res.json({ error: err.message });
                } else {
                    res.json({ success: true });
                }
            });
        } else {
            res.json({ error: "Error: You do not have permission to edit this event" });
        }
    });
});

// PUT /accounts/moderator/pendingaccounts
// Request body: {TODO}
// Change approval status of an account
router.put("/moderator/pendingaccounts/:id", function(req, res) {
    Resource.findOne({ _id: req.params.id}, function(err, account) {
        if(err) {
            res.json({ error: err.message });
        } else if(account) {
            if (req.body.approval) resource.approval = req.body.approval;

            account.save(function(err) {
                if(err) {
                    res.json({ error: err.message });
                } else {
                    res.json({ success: true });
                }
            });
        } else {
            res.json({ error: "Error: You do not have permission to edit this account" });
        }
    });
});
//TODO: add DELETE routes for things that are not approved by the moderator.
module.exports = router;