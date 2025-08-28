const mongoose = require("mongoose");
const { Schema } = mongoose;

const bookingSchema = new Schema(
  {
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    user:    { type: Schema.Types.ObjectId, ref: "User", required: true },

    checkIn:  { type: Date, required: true },
    checkOut: { type: Date, required: true },
    guests:   { type: Number, min: 1, default: 1 },

    pricePerNight: { type: Number, required: true },  // snapshot of listing price
    nights:        { type: Number, required: true },
    subtotal:      { type: Number, required: true },
    tax:           { type: Number, required: true },  // 18%
    total:         { type: Number, required: true },

    status: { type: String, enum: ["pending", "confirmed", "cancelled"], default: "pending" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
