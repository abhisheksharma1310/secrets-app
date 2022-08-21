//import packages
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

//initialize app as express
const app = express();

//use express to serve static public folder
app.use(express.static("public"));

//set ejs as view engine
app.set('view engine', 'ejs');

//use body parser to parse body
app.use(bodyParser.urlencoded({ extended: true }));

//use express session
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

//use passport to manage session
app.use(passport.initialize());
app.use(passport.session());

//connect to monogodb database using mongoose
mongoose.connect("mongodb://localhost:27017/userDB");

//schema for user
const userSchema = new mongoose.Schema(
    {
        email: String,
        password: String
    }
);

//use passport local mongoose for userSchema
userSchema.plugin(passportLocalMongoose);

//mongoose model for user schema
const User = new mongoose.model("User", userSchema);

//create local login strategy using passport
passport.use(User.createStrategy());

//serialize and deserialize user data
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//send home page as response when get request received on route '/'
app.get("/", function (req, res) {
    res.render("home");
});

//send login page as response when get request received on route '/login'
app.get("/login", function (req, res) {
    res.render("login");
});

//send register page as response when get request received on route '/register'
app.get("/register", function (req, res) {
    res.render("register");
});

//send secrets page as response when get request received on route '/secrets'
app.get("/secrets", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

//send logout page as response when get request received on route '/logout'
app.get("/logout", function(req, res, next){
    //logout user using passport
    req.logout(function(err){
        if(err) {
            return next(err);
        }
        res.redirect("/");
    });
});

//register user data in database when post request received on register route
app.post("/register", function (req, res) {
    //register user using passport local mongoose
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });
});

//login user when post request received on login route
app.post("/login", function (req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    //login user using passport
    req.login(user, function (err) {
        if(err){
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            });
        }
    });
});

//listen for client on port 3000
app.listen(3000, function () {
    console.log("Server started on port 3000.");
});
