const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const booking_controller = require("../booking/booking.controller");

router.post("/create-booking", auth, booking_controller.create);
router.get("/booking/:id", booking_controller.getBooking);
router.get("/bookings/:id", auth, booking_controller.getAllBookings); // Add this line
router.get("/bookings", booking_controller.getBookings); // Add this line
router.post("/fetch-bookmarked-jobs", booking_controller.bookmarkData);
router.put("/update-booking/:id", booking_controller.updateBooking);
router.delete("/booking/:id", booking_controller.deleteBooking);
router.get("/bookingss", booking_controller.filterBookings);
router.get("/search", booking_controller.searchBooking);
router.post("/add-area", booking_controller.addArea);
router.post("/add-school", booking_controller.addSchool);
module.exports = router; // Corrected from `module. Exports` to `module.exports`

// https://192.168.29.247:3000/v3/search?q=chocolate&maxResults=5
