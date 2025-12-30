const User = require("../../model/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
