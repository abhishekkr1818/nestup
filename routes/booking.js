const express = require("express");
const router = express.Router({ mergeParams: true });
const { isLoggedIn } = require("../middleware");
const bookings = require("../controllers/booking"); // ✅ fixed
const { isAvailable } = require("../utils/availability");

// Start booking (form)
router.get("/listings/:id/book", isLoggedIn, bookings.renderNew);

// Create booking then go to checkout
router.post("/listings/:id/book", isLoggedIn, bookings.create);

// Checkout page
router.get("/bookings/:bookingId/checkout", isLoggedIn, bookings.checkout);

// Confirm & Pay (simulate)
router.post("/bookings/:bookingId/pay", isLoggedIn, bookings.pay);

// Success page
router.get("/bookings/:bookingId/success", isLoggedIn, bookings.success);

// GET /listings/:id/availability
router.get("/listings/:id/availability", async (req, res) => {
  const { id } = req.params;
  const { checkIn, checkOut } = req.query;

  if (!checkIn || !checkOut) {
    return res.status(400).json({ available: false, message: "Dates required" });
  }

  console.log("Availability check:", { id, checkIn, checkOut, ip: req.ip });

  try {
    const available = await isAvailable(id, checkIn, checkOut);
    return res.json({ available });
  } catch (err) {
    console.error("Availability route error:", err);
    return res.status(500).json({
      available: false,
      message: "Error checking availability",
      error: err.message
    });
  }
});


module.exports = router;
