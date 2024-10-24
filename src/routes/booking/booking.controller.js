const Area = require("../../modals/Area");
const BookingModel = require("../../modals/Booking");
const ProfileModel = require("../../modals/Profile");
const School = require("../../modals/School");

const create = async (req, res) => {
  try {
    const {
      tuitionType,
      city,
      location,
      area,
      category,
      course,
      subjects,
      studentGender,
      tutorGender,
      numStudents,
      days,
      tuitionDemoDate,
      userId,
      otherRequirement,
      salary,
      postedDate,
      daysPerWeek,
      board,
    } = req.body;

    const newBooking = new BookingModel({
      tuitionType,
      city,
      location,
      area,
      category,
      course,
      subjects,
      studentGender,
      tutorGender,
      numStudents,
      days,
      tuitionDemoDate,
      userId,
      otherRequirement,
      salary,
      postedDate,
      daysPerWeek,
      board,
    });

    const data = await newBooking.save();
    // await BookingModel.findByIdAndUpdate(userId, { hasProfile: true });

    res.send({
      data: data,
      message: "Booking created successfully",
      status: true,
    });
    console.log(data);
  } catch (error) {
    console.log("Error creating booking", error);
    res.status(500).json({ status: false, error: "Internal Server Error" });
  }
};

const getBooking = async (req, res) => {
  const tutorJobId = req.params.id; // Correctly extract bookingId from params
  console.log("Booking ID:", tutorJobId);

  try {
    const booking = await BookingModel.findOne({ _id: tutorJobId }); // Query by the correct field

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" }); // Send a proper 404 response if not found
    }

    res.json({ data: booking, success: true }); // Send the booking data in the response
  } catch (error) {
    console.error("Error fetching booking details:", error);
    res.status(500).json({
      message: "Error fetching booking details",
      error: error.message,
    });
  }
};

const booking = async (req, res) => {
  try {
    const userId = req.userId; // Assuming userId is stored in req.userId from authentication middleware
    const bookingId = req.params.id;

    // Fetch the booking with populated fields, filtering by userId
    const bookingDetails = await BookingModel.findOne({
      _id: bookingId,
      userId,
    })
      .populate("city")
      .populate("category")
      .populate("course")
      .populate("subjects")
      .populate("days");

    if (!bookingDetails) {
      return res
        .status(404)
        .json({ message: "Booking not found or not authorized" });
    }

    res.status(200).json(bookingDetails);
  } catch (error) {
    res.status(500).json({ message: "Error fetching booking details", error });
  }
};

const filtBookings = async (req, res) => {
  try {
    // Query all tutor profiles to find those with matching otherInfo.location
    const tutorProfiles = await ProfileModel.find({
      "otherInfo.location": { $exists: true },
    });

    const matchingLocationIds = tutorProfiles.map(
      (profile) => profile.otherInfo.location
    );

    // Find bookings with a matching locationId
    const bookings = await BookingModel.find({
      location: { $in: matchingLocationIds },
    })
      .populate("tutorId")
      .populate("studentId")
      .populate("location");

    res.status(200).json({ success: true, bookings });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const userId = req.params.id; // Assuming userId is stored in req.userId from authentication middleware

    // Fetch all bookings for the authenticated user
    const bookings = await BookingModel.find({ userId })
      .populate("city")
      .populate("location")
      .populate("category")
      .populate("course")
      .populate("subjects")
      .populate("days")
      .sort({ createdAt: -1 }); // Sorting by the latest date

    if (!bookings || bookings.length === 0) {
      return res
        .status(404)
        .json({ message: "No bookings found for this user" });
    }

    res.status(200).json({ bookings });
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    res.status(500).json({ message: "Error fetching bookings", error });
  }
};

const getBookings = async (req, res) => {
  try {
    // Get the page number, pageSize, city, and location from the query parameters
    const { page = 1, pageSize = 10, city, location } = req.query;
    const skip = (page - 1) * pageSize;

    // Build the filter object based on the city and location
    const filter = {};
    if (city) {
      filter.city = city;
    }

    console.log(city);
    // Fetch bookings with pagination, filtering, and sorting by the latest date
    const bookings = await BookingModel.find(filter)
      .populate("city")
      .populate("location")
      .populate("category")
      .populate("course")
      .populate("subjects")
      .populate("days")
      .skip(skip)
      .sort({ createdAt: -1 }) // Sorting by the latest date
      .limit(parseInt(pageSize));

    // Get the total count of bookings for pagination purposes
    const totalBookings = await BookingModel.countDocuments(filter);

    if (!bookings || bookings.length === 0) {
      return res
        .status(404)
        .json({ message: "No bookings found for this user" });
    }

    // Calculate total pages
    const totalPages = Math.ceil(totalBookings / pageSize);

    res.status(200).json({
      bookings,
      currentPage: parseInt(page),
      totalPages,
      totalBookings,
    });
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    res.status(500).json({ message: "Error fetching bookings", error });
  }
};

const updateBooking = async (req, res) => {
  try {
    const tutorJobId = req.params.id;
    const updateData = req.body;

    // Find the booking by ID and update it with the new data
    const updatedBooking = await BookingModel.findByIdAndUpdate(
      tutorJobId,
      updateData,
      { new: true } // Return the updated document
    )
      .populate("city")
      .populate("location")
      .populate("category")
      .populate("course")
      .populate("subjects")
      .populate("days");

    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({
      data: updatedBooking,
      message: "Booking updated successfully",
      status: true,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ status: false, error: "Internal Server Error" });
  }
};

// Route to fetch tutor jobs by IDs

const bookmarkData = async (req, res) => {
  try {
    const { ids } = req.body; // Expecting an array of IDs
    const tutorJobs = await BookingModel.find({ _id: { $in: ids } })
      .populate("city")
      .populate("location")
      .populate("category")
      .populate("course")
      .populate("subjects")
      .populate("days");

    if (!tutorJobs || tutorJobs.length === 0) {
      return res.status(404).json({ message: "No jobs found for these IDs" });
    }

    res.status(200).json(tutorJobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete Booking by ID
const deleteBooking = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the booking by ID and delete it
    const deletedBooking = await BookingModel.findByIdAndDelete(id);

    if (!deletedBooking) {
      return res
        .status(404)
        .json({ message: "Booking not found", success: false });
    }

    res.json({ message: "Booking deleted successfully", success: true });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ message: "An error occurred", success: false });
  }
};

const filterBookings = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    console.log(startDate, endDate);

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start date and end date are required" });
    }

    // Search for bookings that exactly match the startDate and endDate
    const bookings = await BookingModel.find({
      startDate: { $eq: new Date(startDate) },
      endDate: { $eq: new Date(endDate) },
    });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const searchBooking = async (req, res) => {
  const { q, part, maxResults } = req.query;

  try {
    if (!q) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Perform the search in the Booking collection
    const bookings = await BookingModel.find({
      $or: [
        { tuitionType: new RegExp(q, "i") },
        { studentGender: new RegExp(q, "i") },
        { tutorGender: new RegExp(q, "i") },
        // Add other searchable fields here...
      ],
    }).limit(parseInt(maxResults) || 10);

    res.json({
      count: bookings.length,
      items: bookings,
      part,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const addArea = async (req, res) => {
  const { name, pincode, cityId } = req.body;

  if (!name || !cityId) {
    return res
      .status(400)
      .json({ message: "All fields are required or select a city" });
  }

  try {
    // Check if the area already exists
    let area = await Area.findOne({ name: name.toLowerCase() });

    if (area) {
      return res.status(400).json({ message: "Area already exists" });
    }

    // Create a new area
    area = new Area({
      name: name.toLowerCase(),
      pincode,
      cityId,
    });

    await area.save();

    res.status(201).json({ message: "Area added successfully", area });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
const addSchool = async (req, res) => {
  const { name, cityId } = req.body;

  if (!name || !cityId) {
    return res
      .status(400)
      .json({ message: "All fields are required or select a city" });
  }

  try {
    // Check if the area already exists
    let area = await School.findOne({ name: name.toLowerCase() });

    if (area) {
      return res.status(400).json({ message: "school already exists" });
    }

    // Create a new area
    school = new School({
      name: name,
      cityId,
    });

    await school.save();

    res.status(201).json({ message: "school added successfully", school });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  create,
  getBooking,
  booking,
  getAllBookings,
  getBookings,
  filtBookings,
  bookmarkData,
  updateBooking,
  deleteBooking,
  filterBookings,
  searchBooking,
  addArea,
  addSchool,
};
