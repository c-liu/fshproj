var express = require('express');
var router = express.Router();
var Story = require("../models/story")
var Annotation = require("../models/annotation");
var handleError = require('./utils.js').handleError;

// GET /stories/shared/<passkey>
// Gets the publicly shared information associated with the story with the given passkey.
router.get("/shared/:passkey", function (req, res){
    var pass = req.params.passkey;
    Story.findOne({passkey : pass}, function(err, found){
        if(err) handleError(res, 500, err);
        else if (found){
            //get all annotations and remove the author field
            Annotation.find({story : found._id}).select('-author').exec( function(err, foundAnnotations){
                if (err) handleError(res, 500, err);
                else{
                    res.json({annotations : foundAnnotations, story : found});
                }
            });
        }else{
            handleError(res, 500, "story with that passkey not found");
        }
    });
});

// Require authentication for actions
router.use(function(req, res, next) {
    if(req.session.user) {
        next();
    } else {
        res.json({ error: "Error: You must be logged in to perform this action" });
    }
});

// GET /stories/<id>
// Gets the information associated with the story with the given id. Includes title, annotations, passkey
// Response : {title: String, passkey : String, annotations : [Annotation]}
router.get("/:id", function(req, res) {
    Story.findOne({_id : req.params.id, author : req.session.user._id}, function (err, found){
        if (err) handleError(res, 500, err);
        else if (found){
            Annotation.find({story : found._id}, function(err, foundAnnotations){
                if (err) handleError(res, 500, err);
                else{
                    res.json({annotations : foundAnnotations, story : found});
                }
            });
        }
        else{
            handleError(res, 400, "You are not the author of this story and cannot access it.")
        }
    });
});

// POST /stories
// Request body: { title: String, passkey: String }, passkey field is optional
// Creates a new story for the currently logged-in user with the specified title.
router.post("/", function(req, res) {
    var story;
    //if passkey given, check that it's not already in db
    if(req.body.passkey){
        story = new Story({
                author: req.session.user._id,
                title: req.body.title,
                passkey : req.body.passkey
            });
        //require unique passkey
        Story.findOne({passkey:story.passkey}, function(err, found){
            if(err) handleError(res, 500, err);
            //passkey already exists
            if(found){
                handleError(res, 500, "A story with that passkey already exists");
            }
            //passkey doesn't exist, save the story
            else{
                story.save(function(err, savedStory){
                    if (err) { 
                        handleError(res, 500, err) 
                    }else{
                        res.json({success : true, id:savedStory._id});
                    }
                });
            }
        });
    }
    //if passkey not given, just save
    else{
        story = new Story({
            author: req.session.user._id,
            title: req.body.title,
        });
        story.save(function(err, savedStory){
            if (err) { 
                handleError(res, 500, err) 
            }else{
                res.json({success : true, id:savedStory._id});
            }
        });
    }
    
});

// PUT /stories/<id>
// Request body: { title: String, passkey: String }
// Updates the story with the given id, so long as it belongs to the currently logged-in user.
router.put("/:id", function(req, res) {

    //require unique passkey if param given
    if(req.body.passkey){
        Story.findOne({passkey : req.body.passkey}, function(err, found){
            if(err) handleError(res, 500, err);        
            //check whether passkey exists or not
            if(found){
                handleError(res, 500, "A story with that passkey already exists");
            }
            else{
                //passkey is not already existing, ok to update
                Story.findOne({ _id: req.params.id, author: req.session.user._id }, function(err, story){
                    story.title = req.body.title || story.title;
                    story.passkey= req.body.passkey || story.passkey;
                    story.save(function(err) {
                        if(err) {
                            res.json({ error: err.message });
                        } else {
                            res.json({ success: true });
                        }
                    });
                });
            }
        });
    }
    else{
        //if no passkey given, just update title and save
        Story.findOne({ _id: req.params.id, author: req.session.user._id }, function(err, story){
            story.title = req.body.title || story.title;
            story.save(function(err) {
                if(err) {
                    res.json({ error: err.message });
                } else {
                    res.json({ success: true });
                }
            });
        });
    }
});

// DELETE /stories/<id>
// Request body: 
// Deassociates the posts that reference to the given id
router.delete("/:id", function(req, res) {
    var storyID = req.params.id;
    //find the story and remove it
    Story.findOne({ _id: storyID, author: req.session.user._id })
    .remove()
    .exec(function(err, num) {
        if(err) {
            res.json({ error: err.message });
        } else if(num > 0) {
            //dereference any annotations that were in the story
            Annotation.update({story:storyID}, 
                {$unset: {story: 1}},
                {multi: true, safe: true},
                function(err, docs) {
                    if(err) handleError(res, 500, err);
                    else{
                        res.json({success:true});
                    }
                }
            );
        } else {
            res.json({ error: "Error: You do not have permission to delete this story" });
        }
    });
});

module.exports = router;