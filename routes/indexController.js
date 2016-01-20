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
            displayName : false
        };
    }
    if (!req.session.story){
        req.session.story = {
            _id: "invalid"
        };
    }
    res.render('map', {
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

// GET /login/google
// Redirects to Google for authentication
// router.get('/login/google', function(req, res){
//     // generate a url that asks permissions for Google Calendar and Email address scopes
//     var scopes = ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/plus.me'];
//     var url = oauth2Client.generateAuthUrl({
//         access_type : 'offline', // 'online' (default) or 'offline' (gets refresh_token)
//         scope       : scopes // If you only need one scope you can pass it as string
//     });

//     res.redirect(url);
// });

// Google will redirect to this link upon oauth acceptance
// router.get('/oauthcallback', function(req, res){
//     var code = req.query.code;
//     oauth2Client.getToken(code, function(err, tokens) {

//         // Now tokens contains an access_token and an optional refresh_token. Save them.
//         if (err) return handleError(res, 500, err);
//         oauth2Client.setCredentials(tokens);

//         // user is now logged in. Using token to get personal info
//         plus.people.get({userId:'me', auth:oauth2Client}, function(err, googlePlusInfo) {
//             if (err) return handleError(res, 500, err);
//             savePersonalInfo(googlePlusInfo, req, res);
//         });
        
//     });
// });


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
                // for easy testing, uncomment 2 lines below
                approval : false,    
                isAdmin : req.body.isAdmin,
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
            if(req.body.displayLocation || !req.body.displayLocation) newUser.displayLocation = req.body.displayLocation;
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


// parses and saves the google plus info into the Users model
// var savePersonalInfo = function(googlePlusInfo, req, res) {
//     var firstName = googlePlusInfo.name.givenName;
//     var lastName = googlePlusInfo.name.familyName;
//     var email = null;

//     // finds the email associated with the account
//     for (var i = 0; i < googlePlusInfo.emails.length; i++) {
//         var emailObject = googlePlusInfo.emails[i];
//         if (emailObject.type == 'account') {
//             email = emailObject.value;
//         }
//     }

//     // try to find the user
//     Account.findOne({ email:email }, function (err, user) {
//         if (err) return handleError(res, 500, err);

//         // create a new user and save the fact that they're new to the session
//         if (user == undefined) {
//             var newUser = new User({ 'firstName': firstName, 'lastName': lastName, email: email });
        
//             newUser.save(function (err, user) {
//                 if (err) return handleError(res, 500, err);
//                 userObject = user;
//                 //req.session.userIsNew = true;
//                 req.session.user = user;
//                 req.session.save();
//                 res.redirect('/');
//             });

//         } else {
//             req.session.user = user;
//             req.session.save();
//             res.redirect('/');
//         }
//     });
// }

module.exports = router;
