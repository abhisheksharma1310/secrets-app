//import packages
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

//salts round for bcrypt
const saltRounds = 10;

//initialize app as express
const app = express();

//use express to serve static public folder
app.use(express.static("public"));

//set ejs as view engine
app.set('view engine', 'ejs');

//use body parser to parse body
app.use(bodyParser.urlencoded({ extended: true }));

//connect to monogodb database using mongoose
mongoose.connect("mongodb://localhost:27017/userDB");

//schema for user
const userSchema = new mongoose.Schema(
    {
        email: String,
        password: String
    }
);

//mongoose model for user schema
const User = new mongoose.model("User", userSchema);

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

//register user data in database when post request received on register route
app.post("/register", function (req, res) {
    //salting and hashing password using bcrypt
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        const newUser = new User({
            email: req.body.username,
            password: hash
        });
        //save user email and encrypted password into database
        newUser.save(function (err) {
            if (err) {
                console.log(err);
            } else {
                //render secret page when user data saved in database
                res.render("secrets");
            }
        });
    });
});

//login user when post request received on login route
app.post("/login", function (req, res) {
    const username = req.body.username;
    const password = req.body.password;
    //check user credential in database
    User.findOne({ email: username }, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                //hashing and salting user login password and match with database
                bcrypt.compare(password, foundUser.password, function(err, result){
                    result ? res.render("secrets") : null;
                });
            }
        }
    });
});



//listen for client on port 3000
app.listen(3000, function () {
    console.log("Server started on port 3000.");
});
