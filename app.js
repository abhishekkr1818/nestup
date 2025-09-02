if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const GoogleStrategy = require("passport-google-oauth20").Strategy;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

app.use((req, res, next) => {
  res.locals.mapApiKey = process.env.GOOGLE_MAPS_API_KEY;
  next();
});

//ROUTES
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const bookingRouter = require("./routes/booking.js");

const dbUrl = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});

store.on("error", () => {
  console.log("ERROR in MONGO SESSION");
});

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, //For seven days
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true,
  },
};

app.use(session(sessionOptions));
app.use(flash());

//PASSPORT PLUGIN
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

// Google strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:8080/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 🔎 See exactly what Google gives you
        console.log("🔐 Google profile snapshot:", {
          id: profile?.id,
          displayName: profile?.displayName,
          emails: profile?.emails?.map(e => e.value),
          photos: profile?.photos?.map(p => p.value),
        });

        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // If user signed up earlier with same email (local), attach googleId
          const email = profile.emails && profile.emails.length ? profile.emails[0].value : null;
          const photo = profile.photos && profile.photos.length ? profile.photos[0].value : null;

          if (email) {
            user = await User.findOne({ email });
          }

          if (user) {
            console.log("🔗 Linking Google to existing account:", user.email);
            user.googleId = profile.id;
            if (photo && !user.profilePicture) user.profilePicture = photo;
            await user.save();
          } else {
            console.log("🆕 Creating new Google user");
            user = new User({
              username: profile.displayName || `user_${profile.id}`,
              email,
              googleId: profile.id,
              profilePicture: photo,
            });
            await user.save();
          }
        } else {
          // Existing Google user: ensure photo is up to date if missing
          if (!user.profilePicture && profile.photos && profile.photos.length) {
            user.profilePicture = profile.photos[0].value;
            await user.save();
            console.log("🖼️ Updated missing profilePicture for:", user.email);
          }
        }

        console.log("✅ Final user for session:", {
          id: user._id.toString(),
          email: user.email,
          googleId: user.googleId,
          profilePicture: user.profilePicture,
          // Virtuals are available on doc, but logging explicitly:
          avatar: user.avatar,
        });

        return done(null, user);
      } catch (err) {
        console.error("❌ Google Strategy error:", err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// app.get("/", (req, res) => {
//   res.send("Hi, I am root");
// });

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// app.get("/demouser", async (req,res)=>{
//   let fakeuser= new User({
//     email: "ak.@gmail.com",
//     username: "abhi18"
//   })
//   const registeredUser=await User.register(fakeuser, "abhi12345")
//   res.send(registeredUser)
// })

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);
app.use("/", bookingRouter);

// app.get("/testListing", async (req, res) => {
//   let sampleListing = new Listing({
//     title: "My New Villa",
//     description: "By the beach",
//     price: 1200,
//     location: "Calangute, Goa",
//     country: "India",
//   });

//   await sampleListing.save();
//   console.log("sample was saved");
//   res.send("successful testing");
// });

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page not found"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something wrong" } = err;
  res.status(statusCode).render("error.ejs", { message });
  // res.send(statusCode).send(message)
});

app.listen(8080, () => {
  console.log("server is listening to port 8080");
});
