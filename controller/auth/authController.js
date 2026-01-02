const User = require("../../model/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const sendEmail = require("../../services/sendEmail");

exports.registerUser = async (req, res) => {
  const { email, password, userName, phoneNumber } = req.body;
  if (!email || !password || !userName || !phoneNumber) {
    return res.status(400).json({
      message: "Please provide email,password,userName and phoneNumber",
    });
  }
  const userFound = await User.findOne({ userEmail: email });
  if (userFound) {
    return res.status(400).json({
      message: "Email already registered",
    });
  }
  const user = await User.create({
    userEmail: email,
    userPassword: bcrypt.hashSync(password, 10),
    userPhoneNumber: phoneNumber,
    userName,
  });
  res.status(201).json({
    message: "User registered successfully",
    data: user,
  });
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      message: "Please provide email and password",
    });
  }

  const userFound = await User.findOne({ userEmail: email });
  if (!userFound) {
    return res.status(404).json({
      message: "No user registered with that email",
    });
  }
  const isPasswordMatched = bcrypt.compareSync(
    password,
    userFound.userPassword
  );
  if (!isPasswordMatched) {
    return res.status(400).json({
      message: "Password doesnot matched",
    });
  }
  const token = jwt.sign({ id: userFound._id }, process.env.SECRET_KEY, {
    expiresIn: "7d",
  });
  res.status(200).json({
    message: "user loggedin successfully",
    token,
  });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({
      message: "Please provide email",
    });
  }
  const userExist = await User.findOne({ userEmail: email });
  if (!userExist) {
    res.status(400).json({
      message: "User doesnot exist with that email",
    });
  }
  const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
  userExist.otp = otp;
  await userExist.save();
  await sendEmail({
    email,
    subject: "Your One-Time Password (OTP)",
    message: `Your OTP is ${otp}. Do not share this code with anyone.`,
  });
  res.status(200).json({
    message: "Email sent successfully",
  });
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    res.status(400).json({
      message: "Please enter email and otp",
    });
  }
  const userExist = await User.findOne({ userEmail: email });
  if (!userExist) {
    return res.status(400).json({
      message: "Email is not registered",
    });
  }
  if (userExist.otp !== otp) {
    return res.status(400).json({
      message: "Invalid otp",
    });
  }
  userExist.otp = undefined;
  userExist.isOtpVerified = true;
  await userExist.save();
  res.status(200).json({
    message: "Otp verified successfully",
  });
};

exports.resetPassword = async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;
  if (!email || !newPassword || !confirmPassword) {
    return res.status(400).json({
      message: "Please enter email,new Password and confirm password",
    });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      message: "New password doesnot match confirm Password",
    });
  }
  const userExist = await User.findOne({ userEmail: email });
  if (!userExist) {
    return res.status(400).json({
      message: "User isnot registered with that email",
    });
  }
  if (!userExist.isOtpVerified) {
    return res.status(403).json({
      message: "You cannot perform this action",
    });
  }
  userExist.userPassword = bcrypt.hashSync(newPassword, 10);
  userExist.isOtpVerified = false;
  await userExist.save();
  res.status(200).json({
    message: "Password changed successfully",
  });
};
