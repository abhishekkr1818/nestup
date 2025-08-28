// controllers/booking.js
const Listing = require("../models/listing");
const Booking = require("../models/booking");
const { isAvailable } = require("../utils/availability");

// Render booking form
module.exports.renderNew = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }
    res.render("bookings/new", { listing });
  } catch (err) {
    console.error("Render booking form error:", err);
    req.flash("error", "Could not load booking form");
    res.redirect("/listings");
  }
};

// Create booking
module.exports.create = async (req, res) => {
  const { id } = req.params; // listing id
  const { checkIn, checkOut, guests } = req.body;

  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  // Calculate booking details...
  const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000*60*60*24));
  const subtotal = listing.price * nights;
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  const booking = new Booking({
    listing: listing._id,
    user: req.user._id,
    checkIn,
    checkOut,
    guests,
    pricePerNight: listing.price,
    nights,
    subtotal,
    tax,
    total
  });

  await booking.save();
  
  // ✅ redirect to checkout page for that booking
  res.redirect(`/bookings/${booking._id}/checkout`);
};


// Checkout page
module.exports.checkout = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId).populate("listing");
    if (!booking) {
      req.flash("error", "Booking not found");
      return res.redirect("/listings");
    }
    res.render("bookings/checkout", { booking });
  } catch (err) {
    console.error("Checkout error:", err);
    req.flash("error", "⚠️ Could not load checkout");
    res.redirect("/listings");
  }
};

// Simulate payment
module.exports.pay = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      req.flash("error", "Booking not found");
      return res.redirect("/listings");
    }
    booking.status = "confirmed"; // 💳 Mark as confirmed instead of just "paid"
    await booking.save();
    res.redirect(`/bookings/${booking._id}/success`);
  } catch (err) {
    console.error("Payment error:", err);
    req.flash("error", "⚠️ Payment failed");
    res.redirect("/listings");
  }
};

// Success page
module.exports.success = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId).populate("listing");
    if (!booking) {
      req.flash("error", "Booking not found");
      return res.redirect("/listings");
    }
    res.render("bookings/success", { booking });
  } catch (err) {
    console.error("Success page error:", err);
    req.flash("error", "⚠️ Could not load success page");
    res.redirect("/listings");
  }
};
