const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");
const gravatar = require("gravatar");

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    googleId: { type: String, unique: true, sparse: true },
    username: { type: String, unique: true, sparse: true },
    profilePicture: { type: String }, // Google profile photo URL
  },
  {
    // ✅ Make virtuals (like `avatar`) show up on objects passed to views
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ✅ Virtual avatar: Google picture first, else Gravatar
userSchema.virtual("avatar").get(function () {
  const grav = gravatar.url(
    this.email || "",
    { s: "200", r: "pg", d: "identicon" },
    true
  );
  return this.profilePicture || grav;
});

userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", userSchema);
