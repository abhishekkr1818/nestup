// /utils/availability.js
const Booking = require("../models/booking");

async function isAvailable(listingId, checkIn, checkOut) {
  if (!listingId || !checkIn || !checkOut) {
    throw new Error("Missing listingId or dates");
  }
  const from = new Date(checkIn);
  const to = new Date(checkOut);
  if (isNaN(from) || isNaN(to)) throw new Error("Invalid dates");
  if (to <= from) throw new Error("checkOut must be after checkIn");

  try {
    const overlap = await Booking.findOne({
      listing: listingId,
      status: "confirmed",
      $or: [
        { checkIn: { $lt: to }, checkOut: { $gt: from } }
      ]
    });
    return !overlap;
  } catch (err) {
    console.error("isAvailable error:", err);
    throw err;
  }
}

module.exports = { isAvailable };
