var crypto = require('crypto')
var express = require('express');
var router = express.Router();
var Account = require("../models/account");
var handleError = require('./utils.js').handleError;

var google = require("googleapis");
var plus = google.plus('v1');
var OAuth2 = google.auth.OAuth2;
// openshift
var oauth2Client = new OAuth2('1074513880769-6apcnkv996u3ci9ir76imhhgm2uft5on.apps.googleusercontent.com', '1VJzpmIky9lS1S_SOBbZGT8u', 'http://mappy-proj4.rhcloud.com/oauthcallback');
//localhost testing
// var oauth2Client = new OAuth2('1074513880769-f42l2t2ovbnvb7uo4aft0t3gql6dolv6.apps.googleusercontent.com', 'LHgKq1WE4VKzAranhgy86BQx', 'http://localhost:8000/oauthcallback');

// GET /
// The homepage
// Response: HTML for homepage
router.get("/", function(req, res) {
    if (!req.session.user){
        req.session.user = {
            firstName: 'TempGuest',
            lastName: 'Name',
            displayName : 'Temporary Guest'
        };
    }
    res.render('fsh', {
        userId: req.session.user._id,
        userEmail: req.session.user.email,
        firstName: req.session.user.firstName,
        lastName: req.session.user.lastName
    });
});


// POST /login
// Request body: { email: String, password: String }
// Attempts to log in with the given credentials. Responds with { success: true } if successful or { error: String } otherwise.
router.post('/login', function(req, res) {
    var encrypted_password = crypto.createHash('md5')
                    .update(req.body.password)
                    .digest('hex');
    Account.findOne({ email: req.body.email, password: encrypted_password})
    .select("-password") // TODO(catliu): Figure out if we want to restrict fields?
    .exec(function(err, user) {
        if(err) handleError(res, 500, err.message);
        else if(user) {
            if (user.deleted) {
                handleError(res, 403, 'Error: You cannot login to a deleted account.')
            } else {
                req.session.user = user;
                req.session.save();
                res.json({success: true, user: user});    
            }
        } else {
            handleError(res, 404, 'Error: Email and password do not match');
        }
    });
});


// POST /signup
// Request body: { email: String, password: String, firstName: String, lastName: String, and all optional fields }
// Attempts to create an account with the given credentials. Responds with { success: true } if successful or { error: String } otherwise.
router.post('/signup', function(req,res) {
    Account.findOne({ email: req.body.email }, function(err, user) {
        if(err) handleError(res, 500, err.message);
        else if(user) {
            if (user.deleted) {
                // TODO: Send them an email asking if they want to reactivate the account if it's deleted
                res.json({ error: "Error: The previous account with this email address was deleted. We assumed no one would ever resign up with the same email. Sorry, try with a new email address" });   
            } else {
                res.json({ error: "Error: An account already exists with this email address" });
            }
        } else {    
            var newUser = new Account({
                // for easy testing, switch approval to true for initial admin
                approval : false,    
                isAdmin : req.body.isAdmin,
                latitude: req.body.latitude,    //required
                longitude: req.body.longitude,  //required
                firstName: req.body.firstName, //required
                lastName: req.body.lastName, //required
                displayName: req.body.displayName, //required
                email : req.body.email, // required
                deleted: false
            });

            if(req.body.password) {
                // store a hashed password
                newUser.password = crypto.createHash('md5')
                    .update(req.body.password)
                    .digest('hex');
            }

            if(req.body.country) newUser.country = req.body.country;
            if(req.body.research || !req.body.research) newUser.research = req.body.research;
            if(req.body.state) newUser.state = req.body.state;
            if(req.body.town) newUser.town = req.body.town;
            if(req.body.dob) newUser.dob = req.body.dob;
            if(req.body.displayDOB || !req.body.displayDOB) newUser.displayDOB = req.body.displayDOB;

            if(req.body.image) newUser.image = req.body.image;
            if(req.body.impairment) newUser.impairment = req.body.impairment;
            if(req.body.sex) newUser.sex = req.body.sex;
            if(req.body.hobbies) newUser.hobbies = req.body.hobbies;
            if(req.body.description) newUser.description = req.body.description;

            newUser.save(function(err, user) {
                if (err) return handleError(res, 500, err.message);
                delete user['password'];
                req.session.user = user;
                req.session.save();
                res.json({success: true, username: user});
            });
        }
    });
});

// POST /logout
// Attempts to log the user out and destroy the session. Responds with { success: true } if successful or { error: String } otherwise.
router.post('/logout', function(req,res){
    req.session.destroy(function(err) {
        if(err) handleError(res, 500, err.message);
        else res.json({success: true});
    });
});

module.exports = router;
