const express = require("express");
const router=express.Router();
const wrapAsync=require("../utils/wrapAsync.js")
const Listing = require("../models/listing.js");
const {isLoggedIn, isOwner,validateListing}=require("../middleware.js");
const listingController=require("../controllers/listings.js")
const multer  = require('multer');
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage })

//Index Route
//Create Route
router.route("/")
.get(wrapAsync(listingController.index))
.post(
    isLoggedIn,
    upload.single('listing[image]'),
    validateListing,
    wrapAsync(listingController.createListing)
);



//New Route
router.get("/new",isLoggedIn, listingController.renderNewForm);

// /listings/suggestions (must be above /:id)
router.get("/suggestions", async (req, res) => {
  const q = req.query.q || "";
  if (!q.trim()) return res.json([]);

  const regex = new RegExp(q, "i");
  const listings = await Listing.find({
    $or: [
      { title: regex },
      { location: regex }
    ]
  }).limit(5);

  res.json(
    listings.map(l => ({
      id: l._id,
      title: l.title,
      location: l.location,
      description: l.description,
      author: l.owner?.username || "Unknown"
    }))
  );
});


//Show Route
//Update Route 
//Delete Route
router.route("/:id")
.get(wrapAsync( listingController.showListing))
.put(isLoggedIn,isOwner,upload.single('listing[image]'), validateListing, wrapAsync( listingController.updateListing))
.delete(isLoggedIn,isOwner, wrapAsync(listingController.destroyListing))


// //Edit Route
router.get("/:id/edit",isLoggedIn,isOwner, listingController.renderEditForm);

router.route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single('listing[image]'),
    validateListing,
    wrapAsync(listingController.createListing)
  );




module.exports=router