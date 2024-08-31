const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const booking_controller = require("../booking/booking.controller");

router.post("/create-booking", auth, booking_controller.create);
router.get("/booking/:id", booking_controller.getBooking);
router.get("/bookings/:id", auth, booking_controller.getAllBookings); // Add this line
router.get("/bookings", auth, booking_controller.getBookings); // Add this line
router.post('/fetch-bookmarked-jobs',booking_controller.bookmarkData );
router.put("/update-booking/:id", booking_controller.updateBooking)
router.delete('/booking/:id', booking_controller.deleteBooking); 
router.get('/bookingss', booking_controller.filterBookings); 
module.exports = router; // Corrected from `module. Exports` to `module.exports`
