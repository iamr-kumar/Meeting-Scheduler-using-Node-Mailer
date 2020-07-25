// This application is used to add meeting schedules for a user and then sends email notification
// to the user on each day if the user has any meeting or not. As the descriptive email
// was getting a bit tough for me to complete for me within the given time frame, I have
// kept it simple to just send email if a user has any meeting on a given day.
// The database is checked each day at 9 AM for any meeting on that day and if found any
// then the related user is sent an email reminding the user that he/she has meetings today.
// As I was running a bit short on time due to the classes, I have not much focussed on the styling
// and have used simple bootstrap classes to make the application presentable.
// There are a lot of things that can be added to this application and I will continue to work on this
// evem beyond the scop of this task.



const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const Meetings = require("./models/meetings");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/user");
const cron = require("node-cron");



const app = express();


// Mongoose setup

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

mongoose.connect("mongodb+srv://iamzacker:iamzacker@node-mailer-test.zyfeu.mongodb.net/<dbname>?retryWrites=true&w=majority")
    .then(
        () => console.log("connection successful!")
    )
    .catch(err => {
        console.log(err);
    });

// Mongoose setup


app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(
    __dirname + "/public"
));
app.set("view engine", "ejs");

// Passport and Express session setup

app.use(require("express-session")({
    secret: "Nothing new is happening",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Passport and Express session setup

// Set current user

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});

// Set current user


app.get("/", (req, res) => {
    res.redirect("/login");
})



app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/meetings",
    failureRedirect: "/login",
    // failureFlash: "Invalid username or password!"
}), (req, res) => {
});

app.get("/signup", (req, res) => {
    res.render("signup");
})

app.post("/signup", (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    // Look for an existing user
    User.findOne().or([{username: username}, {email: email}])
        .then(user => {
            if(user){
                // req.flash("error", "User already exists");
                return res.redirect("/signup");
                // console.log("Redirected!");
            }
            else{
                // Register the user
                User.register(new User({username: username, email: email}), password)
                    .then(user => {
                        passport.authenticate("local")(req, res, () => {
                            // req.flash("success", "Signed you in!");
                            res.redirect("/meetings");
                        })
                    })
                    .catch(err => {
                        // req.flash("error", err.message);
                        return res.redirect("/signup");
                    })
            }
        })
        .catch(err => {
            console.log(err);
            // req.flash("error", err.message);
            return res.redirect("/signup");
        })
});

app.post("/post", (req, res) => {
    var date = new Date(req.body.date);
    // console.log(date);
    var time = req.body.timeFrom.split(":");
    var hour = time[0];
    var minutes = time[1];
    date.setHours(hour);
    date.setMinutes(minutes);
    var timeTo = req.body.timeTo.split(':');
    var dateTo = new Date(req.body.date);
    dateTo.setHours(timeTo[0]);
    dateTo.setMinutes(timeTo[1]);
    var currDate = new Date();
    if(currDate > date){
        res.send("You can't have a meeting in the past, unless you understand DARK!");
    }
    else{
        if(date > dateTo){
            res.send("How is your meeting finished if it hasn't even started yet?");
        }
        else{

            Meetings.create({
                date: date,
                place: req.body.place,
                tag: req.body.tag,
                user: req.user._id
            })
            .then( newMeeting => {
                console.log(newMeeting);
                res.redirect("/meetings");
            })
            .catch(err => res.send("Some error occured!"));
        }


    }    
    

});

app.get("/meetings", (req, res) => {
    User.findById(req.user._id, (err, user) => {
        if(err){
            console.log(err);
            res.send("Some error occurred!");
        }
        else{
            if(!user){
                req.send("User not found!");
            }
            else{
                Meetings.find().where('user').equals(user._id).exec((err, meetings) => {
                    if(err){
                        console.log(err);
                        res.send("Some error occurred!");
                    }
                    else{
                        var upcomingMeetings = [];
                        var pastMeetings = [];
                        const currDate = new Date();
                        meetings.forEach(meeting => {
                            if(meeting.date < currDate){
                                pastMeetings.push(meeting);
                            }
                            else{
                                upcomingMeetings.push(meeting);
                            }
                        });
                        upcomingMeetings = upcomingMeetings.sort((a, b) => a.date - b.date);
                        pastMeetings = pastMeetings.sort((a, b) => a.date - b.date);
                        res.render("home", {pastMeetings: pastMeetings, upcomingMeetings: upcomingMeetings});
                    }
                })
            }
        }
    })
});

// Logout User
app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

// Function to send mail using node-mailer

function sendMailReminder(address){
    var mailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'iamritik2910@gmail.com',
            pass: 'iamzacker2904'
        }
    });

    var mailDetails = {
        from: 'iamritik2910@gmail.com',
        to: address,
        subject: 'Upcoming meeting',
        html: '<p>You have meeting(s) today. Check now!</p>'
    };

    mailTransporter.sendMail(mailDetails, function(err, data) { 
        if(err) { 
            console.log(err);
            console.log('Error Occurs'); 
        } else { 
            console.log('Email sent successfully'); 
        } 
    });
}

// Check meetings for each day every day at 9 AM

cron.schedule('0 9 * * *', () => {
    const currDate = new Date();
    Meetings.find({}, (err, meetings) => {
        if(err){
            console.log(err);
        }else{
            var sentUsers = [];
            meetings.forEach(meeting => {
                const date = meeting.date;
                if(date.toLocaleDateString() === currDate.toLocaleDateString()){
                    const userId = meeting.user;
                    if(!sentUsers.includes(userId)){
                        sentUsers.push(userId);
                        User.findById(userId, (err, user) => {
                            if(err){
                                console.log(err);
                            }else{
                                if(user){
                                    sendMailReminder(user.email);
                                }
                            }
                        });
                    }
                }
            });
        }
    });
});

var port = process.env.PORT;
if(port == null || port == ""){
    port = 3000;
}

app.listen(port, () => console.log("Server started!"));