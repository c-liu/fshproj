var express = require("express");
var path = require("path");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var session = require("express-session");

// Define controllers
var index = require("./routes/indexController");
var accounts = require("./routes/accountController");
var events = require("./routes/eventController");
var resources = require("./routes/resourceController");

var Account = require("./models/account");

// Create app
var app = express();
app.set("environment", "development");

// Setup mongoose
var connectionString = "localhost:27017/fsh";
if(process.env.OPENSHIFT_MONGODB_DB_URL) {
    connectionString = process.env.OPENSHIFT_MONGODB_DB_URL + "fsh";
}
mongoose.connect(connectionString);

// Set up view engine
app.set("views", "./views");
app.set("view engine", "ejs");

// Basic middleware
app.use(session({
    resave: false,
    saveUninitialized: false,
    unset: "destroy",
    secret: "sicknastyswagfsh"
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Set up static files directory
app.use(express.static(path.join(__dirname, "/public")));

// Set up routes
app.use("/accounts", accounts);
app.use("/events", events);
app.use("/resources", resources);
app.use("/", index);

// Error Handlers

// 404
app.use(function(req, res, next) {
    var err = new Error("There was nothing found at the path you requested :(");
    err.name = "Not Found";
    err.status = 404;
    next(err);
});

// Development handler
if(app.get("environment") === "development") {
    app.use(function(err, req, res, next) {
        console.error(err);
        res.status(err.status || 500);
        res.render("error", {
            title: "Error",
            name: err.name,
            message: err.message+"<br><br>"+err.stack
        });
    });
}

// Production handler
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render("error", {
        title: "Error",
        name: err.name,
        message: err.message
    });
});

// Start app
app.listen(process.env.OPENSHIFT_NODEJS_PORT || 8000, process.env.OPENSHIFT_NODEJS_IP || "localhost", function() {
    console.log("FSH server running on port "+(process.env.OPENSHIFT_NODEJS_PORT || 8000)+"...");
});