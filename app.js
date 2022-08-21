//import packages
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require("md5");

//initialize app as express
const app = express();

//use express to serve static public folder
app.use(express.static("public"));

//set ejs as view engine
app.set('view engine', 'ejs');

//use body parser to parse body
app.use(bodyParser.urlencoded({extended: true}));

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
app.get("/", function(req, res){
    res.render("home");
});

//send login page as response when get request received on route '/login'
app.get("/login", function(req, res){
    res.render("login");
});

//send register page as response when get request received on route '/register'
app.get("/register", function(req, res){
    res.render("register");
});

//register user data in database when post request received on register route
app.post("/register", function(req, res){
    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password)
    });
    newUser.save(function(err){
        if(err){
            console.log(err);
        } else {
            res.render("secrets");
        }
    });
});

//login user when post request received on login route
app.post("/login", function(req, res){
    const username = req.body.username;
    const password = md5(req.body.password);
    //check user credential in database
    User.findOne({email: username}, function(err, foundUser){
        if(err){
            console.log(err); 
        } else {
            if(foundUser) {
                if(foundUser.password === password) {
                    res.render("secrets");
                }
            }
        }
    });
});



//listen for client on port 3000
app.listen(3000, function(){
    console.log("Server started on port 3000.");
});
