//import packages
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const Googlestrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

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
        password: String,
        googleId: String,
        secret: String
    }
);

//use passport local mongoose for userSchema
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//mongoose model for user schema
const User = new mongoose.model("User", userSchema);

//create local login strategy using passport
passport.use(User.createStrategy());

//serialize and deserialize user data using passport
passport.serializeUser(function(user, done){
    done(null, user.id);
});
passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
        done(err, user);
    });
});

//use passport google strategy to login user using google Oauth 2.0 api
passport.use(new Googlestrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        //console.log(profile);
        User.findOrCreate(
            { 
                googleId: profile.id,

            }, 
            function (err, user) {
            return cb(err, user);
        });
    }
));

//send home page as response when get request received on route '/'
app.get("/", function (req, res) {
    res.render("home");
});

//redirect to google login page when get request received on route '/auth/google'
app.get("/auth/google",  
    //initiate authentication with google using passport
    passport.authenticate('google', { scope: ["profile"] })
);

//redirect to secret page after goolge login successfull
app.get("/auth/google/secrets",
    passport.authenticate("google", { failureRedirect: "/login" }),
    function (req, res) {
        //successfull authentication, redirect secrets page
        res.redirect("/secrets");
    }
);

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
   User.find({"secret": {$ne: null}}, function(err, foundUsers){
    if(err) {
        console.log(err);
    } else {
        if(foundUsers) {
            res.render("secrets", {usersWithSecrets: foundUsers});
        }
    }
   });
});

//send submit page
app.get("/submit", function(req, res){
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

//save secrets received from submit page
app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret;
    //find user id and save its secrets
    User.findById(req.user.id, function(err, foundUser){
        if(err){
            console.log(err);
        } else {
            if(foundUser) {
                foundUser.secret = submittedSecret;
                foundUser.save(function(){
                    res.redirect("/secrets");
                });
            }
        }
    });
});

//send logout page as response when get request received on route '/logout'
app.get("/logout", function (req, res, next) {
    //logout user using passport
    req.logout(function (err) {
        if (err) {
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
            //initiate authentication with local using passport
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
        if (err) {
            console.log(err);
        } else {
            //initiate authentication with local using passport
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });
});

//listen for client on port 3000
app.listen(3000, function () {
    console.log("Server started on port 3000.");
});
