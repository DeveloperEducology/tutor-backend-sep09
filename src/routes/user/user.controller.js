const UserModel = require("../../modals/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");



const clientId = "LRDFECK0815DHLLSN7KLJ7NU18YCOYMG";
const clientSecret = "mssp9lfiqnj2rtm4jfx331csaeoynmm4";
let storedOtp = null;
let orderId = null;
let phoneNumber = null;

const createUser = async (req, res) => {
  const {
    email,
    userName,
    password,
    userType,
    userId,
    phoneNumber,
    city,
    location,
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
    const user = await UserModel.findOne({ email: email });
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
          clientId: clientId,
          clientSecret: clientSecret,
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
          clientId: clientId,
          clientSecret: clientSecret,
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
        { expiresIn: "2h" }
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

module.exports = {
  // fileUpload,
  createUser,
  loginUser,
  loginWithPhone,
  sendOTP,
  verifyOTP,
};
