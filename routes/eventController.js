var express = require('express');
var router = express.Router();
var Event = require("../models/event");


// Require authentication for the rest of the actions
router.use(function(req, res, next) {
    if(req.session.user && req.session.user.approval && !req.session.user.deleted) {
        next();
    } else {
        res.json({ error: "Error: You must be logged in and approved by a mod to perform this action" });
    }
});

// GET /events
// Request body (optional): { minLatitude: Number, maxLatitude: Number, minLongitude: Number, maxLongitude: Number }
// Gets all approved events. Restricts them to the given area if request body is specified.
router.get("/", function(req, res) {
    var query = {approval: true};
    var populateStr = "displayName deleted";
    if (req.session.user.isAdmin) {
        populateStr = "firstName lastName displayName"
    }
    Event.find(query)
    .where("latitude").gt(req.body.minLatitude || -90)
    .where("latitude").lt(req.body.maxLatitude || 90)
    .where("longitude").gt(req.body.minLongitude || -180)
    .where("longitude").lt(req.body.maxLongitude || 180)
	.populate("owner", populateStr)
	.exec(function(err, events) {
            if(err) {
        		res.json({ error: err.message });
            } else if(events) {
                events.forEach(function (event) {
                    var now = new Date();
                    // DELETE any past events from database
                    if(event.end.getTime()<now.getTime()){
                        Event.remove({_id:event._id})
                    }
                    else if (event.owner.deleted && !req.session.user.isAdmin) {
                        event.owner.displayName = 'Deleted account'
                    }
            });
        		res.json(events);
            } else {
        		res.json({ error: "Error: No resources found" });
            }
	});
});

// GET /events/<id>
// Gets event with specified ID.
router.get("/:id", function(req, res) {
    var query = {approval: true, _id: req.params.id };
    Event.findOne(query),
    function (err, found){
        if (err) handleError(res, 500, err);
        else if (found){
	    //found event???????
            res.json(found);
        }
    };
});

	   

/* POST /events
Request body: 
   name: {type: String, required: true},
   start: {type: Date, required: true},
   end: {type: Date, required: true},
   location: {type: String, required: true},
   description: String,
   image: String,
   approval: {type: Boolean, default: false, required: true}

Creates a new event as the currently logged-in user. Responds with { success: true, id: ObjectId } upon success, and with { error: String } otherwise.
*/
router.post("/", function(req, res) {
    var event = new Event({
        owner: req.session.user._id,
        name: req.body.name,
        start: req.body.start,
        end: req.body.end,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        location: req.body.location,
        description: req.body.description,
        image: req.body.image || "",
        approval: req.session.user.isAdmin || false
    });
    event.save(function(err, savedEvent) {
        if(err) {
            res.json({ error: err.message });
        } else {
            res.json({ success: true, id: savedEvent._id });
        }
    });
});

/* PUT /events/<id>
Request body: 
   name: {type: String, required: true},
   dateofevent: {type: Date, required: true},
   location: {type: String, required: true},
   description: String,
   image: String,
   approval: {type: Boolean, default: false, required: true}

Updates an event, so long as it belongs to the currently logged-in user.
*/

router.put("/:id", function(req, res) {
    Event.findOne({ _id: req.params.id, owner: req.session.user._id }, function(err, event) {
        if(err) {
            res.json({ error: err.message });
        } else if(event) {
            event.name = req.body.name || event.name;
            event.start = req.body.start || event.start;
            event.end = req.body.end || event.end;
    	    event.description = req.body.description || event.description;
    	    event.location = req.body.location || event.location;
            event.latitude = req.body.latitude || event.latitude;
            event.longitude = req.body.longitude|| event.longitude;
            event.approval = false;
            event.image = req.body.image || event.image;
  
            event.save(function(err) {
                if(err) {
                    res.json({ error: err.message });
                } else {
                    res.json({ success: true });
                }
            });
        } else {
            res.json({ error: "Error: You do not have permission to edit this event!" });
        }
    });
});

// DELETE /events/<id>
// Deletes the event with the given id, so long as it belongs to the currently logged-in user.
router.delete("/:id", function(req, res) {
    Event.findOne({ _id: req.params.id, owner: req.session.user._id })
	.remove()
	.exec(function(err, obj) {
        var num = obj.result.n;
        
            if(err) {
		res.json({ error: err.message });
            } else if(num > 0) {
		res.json({ success: true });
            } else {
		res.json({ error: "Error: You do not have permission to edit this event!" });
            }
	});
});

module.exports = router;
