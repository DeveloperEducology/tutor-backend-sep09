const UserModel = require("../../modals/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");

// const clientId = "LRDFECK0815DHLLSN7KLJ7NU18YCOYMG";
// const clientSecret = "mssp9lfiqnj2rtm4jfx331csaeoynmm4";
let storedOtp = null;
let orderId = null;
let phoneNumber = null;

const fileUpload = async (req, res) => {
  if (!req?.file) {
    res.status(403).json({ status: false, error: "please upload a file" });
    return;
  }
  let data = {};
  if (!!req?.file) {
    data = {
      url: req.file.location,
      type: req.file.mimetype,
    };
  }
  try {
    res.send({
      data: data,
    });

    console.log("fileupload in user api", data);
  } catch (error) {
    res.status(403).json({ status: false, error: error });
  }
};

const createUser = async (req, res) => {
  const {
    email,
    userName,
    password,
    userType,
    userId,
    phoneNumber,
    city,
    pincode,
  } = req.body;

  try {
    let checkUser = await UserModel.findOne({
      $or: [{ email: email }, { userName: userName }],
    });

    if (!checkUser) {
      const salt = await bcrypt.genSalt();
      const passwordHash = await bcrypt.hash(password, salt);

      let result = await UserModel.create({
        ...req.body,
        password: passwordHash,
        userId: userId,
      });

      const token = jwt.sign(
        { user_id: result?._id, email },
        process.env.TOKEN_KEY
      );
      result.token = token;

      res.send({
        data: result,
        message: "User created successfully...!!!",
        status: true,
      });
    } else {
      res.status(403).json({ status: false, message: "User already exists" });
    }
  } catch (error) {
    console.log("Error raised", error);
    res.status(403).json({ status: false, error: error });
  }
};

const loginUser = async (req, res) => {
  const { email, password, fcmToken } = req.body;

  console.log("req.body", req.body);

  try {
    const user = await UserModel.findOne({ email: email })
      .populate("city")
      .populate("pincode");
    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (isPasswordValid) {
        const token = jwt.sign(
          { user_id: user._id, email: user.email },
          process.env.TOKEN_KEY,
          { expiresIn: "2h" } // Token expires in 2 hours
        );

        if (fcmToken) {
          user.fcmToken = fcmToken;
          await user.save();
        }

        const userWithoutPassword = {
          ...user.toObject(),
          token,
        };
        delete userWithoutPassword.password;

        res.send({
          data: userWithoutPassword,
          status: true,
        });
      } else {
        res
          .status(403)
          .json({ status: false, error: "Password/email not correct" });
      }
    } else {
      res
        .status(403)
        .json({ status: false, error: "Password/email not correct" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ status: false, error: "Internal Server Error" });
  }
};

const loginWithPhone = async (req, res) => {
  const { phoneNumber, fcmToken } = req.body;

  console.log("req.body", req.body);

  try {
    const user = await UserModel.findOne({ phoneNumber });

    if (user) {
      await client.verify.services(serviceSid).verifications.create({
        to: phoneNumber,
        channel: "sms",
      });

      if (fcmToken) {
        user.fcmToken = fcmToken;
        await user.save();
      }

      res.send({
        status: true,
        message: "OTP sent successfully. Please verify to complete login.",
      });
    } else {
      res.status(404).json({ status: false, error: "User not found" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ status: false, error: "Internal Server Error" });
  }
};

const sendOTP = async (req, res) => {
  phoneNumber = req.body.phoneNumber;

  try {
    let user = await UserModel.findOne({ phoneNumber });

    if (!user) {
      return res.json({ message: "not there", success: false });
    }

    const response = await axios.post(
      "https://auth.otpless.app/auth/otp/v1/send",
      {
        phoneNumber,
        otpLength: 4,
        channel: "SMS",
        expiry: 600,
      },
      {
        headers: {
          clientId: process.env.OTP_LESS_CLIENTID,
          clientSecret: process.env.OTP_LESS_CLIENTSECRET,
          "Content-Type": "application/json",
        },
      }
    );
    // console.log("response", response);
    orderId = response.data.orderId; // Store orderId for verification
    storedOtp = response.data.otp; // Store OTP temporarily
    res.json({ orderId, success: true });
  } catch (error) {
    console.error(
      "Error sending OTP:",
      error.response ? error.response.data : error.message
    );
    res.status(error.response ? error.response.status : 500).json({
      success: false,
      message: error.response ? error.response.data.message : error.message,
    });
  }
};

const verifyOTP = async (req, res) => {
  const { otp } = req.body;

  try {
    const response = await axios.post(
      "https://auth.otpless.app/auth/otp/v1/verify",
      {
        orderId: orderId,
        otp: otp,
        phoneNumber: phoneNumber, // Include phone number
      },
      {
        headers: {
          clientId: process.env.OTP_LESS_CLIENTID,
          clientSecret: process.env.OTP_LESS_CLIENTSECRET,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("response veife", response.data.isOTPVerified);
    if (response.data.isOTPVerified) {
      let user = await UserModel.findOne({ phoneNumber });

      if (!user) {
        // If the user doesn't exist, create a new one
        user = new UserModel({ phoneNumber });
        await user.save();
      }

      // Generate a JWT token
      const token = jwt.sign(
        { user_id: user._id, phoneNumber: user.phoneNumber },
        process.env.TOKEN_KEY,
        { expiresIn: "2w" }
      );

      const userWithoutSensitiveInfo = {
        ...user.toObject(),
        token,
      };
      delete userWithoutSensitiveInfo.password;

      // Clear stored OTP and orderId after successful verification
      storedOtp = null;
      orderId = null;
      console.log(userWithoutSensitiveInfo);
      res.json({ data: userWithoutSensitiveInfo, success: true });
    } else {
      res.status(400).json({ success: false, message: response.data.reason });
    }
  } catch (error) {
    console.error(
      "Error verifying OTP:",
      error.response ? error.response.data : error.message
    );
    res.status(error.response ? error.response.status : 500).json({
      success: false,
      message: error.response ? error.response.data.message : error.message,
    });
  }
};

const updateUser = async (req, res) => {
  const userId = req.params.userId; // Assuming you're using userId as a parameter in the route
  const { email, userName, city, location, profileImage } = req.body;

  try {
    // Find the user by ID
    let user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // Update the fields
    if (email) user.email = email;
    if (userName) user.userName = userName;
    if (city) user.city = city;
    if (location) user.location = location;
    if (profileImage) user.profileImage = profileImage; // Update the profile picture

    // Save the updated user to the database
    await user.save();

    // Return the updated user data, excluding the password
    const userWithoutSensitiveInfo = {
      ...user.toObject(),
    };
    delete userWithoutSensitiveInfo.password;

    res.json({
      status: true,
      message: "User profile updated successfully",
      data: userWithoutSensitiveInfo,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ status: false, error: "Internal Server Error" });
  }
};

const getUser = async (req, res) => {
  const userId = req.params.id; // Assuming userId is passed as a URL parameter

  try {
    const user = await UserModel.findOne({ _id: userId }); // Use _id if that's how users are stored

    if (!user) {
      return res.status(404).send({
        message: "User not found with userId=" + userId,
      });
    }

    console.log("User retrieved:", user);
    res.status(200).send({ user }); // Send user data as part of an object
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).send({
      message: "Error retrieving user information with userId=" + userId,
    });
  }
};


module.exports = {
  fileUpload,
  createUser,
  loginUser,
  loginWithPhone,
  sendOTP,
  verifyOTP,
  updateUser,
  getUser,
};
