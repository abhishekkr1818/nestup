const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // allows multiple users without googleId
  },
  username: {
    type: String,
    unique: true,
    sparse: true
  }
});

userSchema.plugin(passportLocalMongoose); // use username as login

module.exports = mongoose.model("User", userSchema);
