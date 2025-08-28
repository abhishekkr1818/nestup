const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken= process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });
const geocodeLocation = require("../utils/geocode");

// module.exports.index=async (req, res) => {
//   const allListings = await Listing.find({});
//   res.render("listings/index.ejs", { allListings });
// }

module.exports.renderNewForm=(req, res) => {
  res.render("listings/new.ejs");
}

module.exports.showListing=async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
  .populate({
    path: "reviews",
    populate: {
    path: "author",
    },
  })
  .populate("owner");
  if(!listing){
    req.flash("error", "listing doesn't exist")
    res.redirect("/listings")
  }
  console.log(listing)
  res.render("listings/show.ejs", { listing });
}


module.exports.createListing = async (req, res, next) => {
  let { location, country } = req.body.listing;

  const geometry = await geocodeLocation(location, country);

  if (!geometry) {
    req.flash("error", "Could not find that location. Please try again with a valid city/country.");
    return res.redirect("/listings/new");
  }

  let url = req.file.path;
  let filename = req.file.filename;

  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };
  newListing.geometry = geometry;

  let savedListing = await newListing.save();
  console.log(savedListing);

  req.flash("success", "New listing created");
  res.redirect("/listings");
};


module.exports.renderEditForm = async (req, res ) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing) {
        req.flash("error", "listing you requested for does not exist");
        return res.redirect("/listings");
    }
 
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace(/\/upload\//, "/upload/w_250/");

    // ✅ Categories array (could later come from DB instead of hardcoding)
    const categories = [
        "Rooms",
        "Iconic cities",
        "Mountains",
        "Castles",
        "Amazing pools",
        "Camping",
        "Farms"
    ];

    res.render("listings/edit.ejs", { listing, originalImageUrl, categories });
};


module.exports.updateListing = async (req, res) => {
  let { id } = req.params;

  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });

  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  if (req.body.listing.location || req.body.listing.country) {
    let { location, country } = req.body.listing;
    const geometry = await geocodeLocation(location, country);

    if (!geometry) {
      req.flash("error", "Could not update location. Please try again with a valid city/country.");
      return res.redirect(`/listings/${id}/edit`);
    }

    listing.geometry = geometry;
  }

  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
  }

  await listing.save();

  req.flash("success", "Listing updated");
  res.redirect(`/listings/${id}`);
};




module.exports.destroyListing=async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing deleted")
  res.redirect("/listings");
}

// controllers/listings.js
module.exports.index = async (req, res) => {
  const searchQuery = (req.query.search || "").trim();
  const selectedCategory = (req.query.category || "").trim();

  const filter = {};

  if (searchQuery) {
    filter.$or = [
      { title: { $regex: searchQuery, $options: "i" } },
      { location: { $regex: searchQuery, $options: "i" } }
    ];
  }

  if (selectedCategory) {
    filter.category = selectedCategory;
  }

  const listings = await Listing.find(filter);

  res.render("listings/index.ejs", {
    listings,
    searchQuery,
    selectedCategory
  });
};


module.exports.suggestions = async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json([]);

  const suggestions = await Listing.find({
    $or: [
      { title: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } },
      { country: { $regex: q, $options: "i" } }
    ]
  })
    .limit(7)
    .select("title location") // _id present by default
    .lean();

  res.json(suggestions);
};