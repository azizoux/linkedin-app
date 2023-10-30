const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

const app = express();
const port = 5000;
const cors = require("cors");
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const url = "mongodb+srv://azizmahamat:password@cluster0.k8bfku2.mongodb.net/";
mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB", err);
  });
app.listen(port, () => {
  console.log("Server connected to port: ", port);
});
// function to generate secretKey
const generateSecretKey = () => {
  const secretKey = crypto.randomBytes(32).toString("hex");
  return secretKey;
};
const secretKey = generateSecretKey();
//send email function
const sendVerificationEmail = async (email, verificationToken) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "azizmahamat@gmail.com",
      pass: "",
    },
  });
  const mailOptions = {
    from: "linkedin@gmail.com",
    to: email,
    subject: "Email Verification",
    text: `please click the following link to verify your email : http://localhost:5000/verify/${verificationToken}`,
  };
  // send the email
  try {
    await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully");
  } catch (error) {
    console.log("Error sending the verification email");
  }
};

const User = require("./models/user");
const Post = require("./models/post");

//endpoint to register a user in data base
app.post("/register", async (req, res) => {
  try {
    console.log("req.body:", req.body);
    const { name, email, password, profileImage } = req.body;
    //check if the email already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Email already registered");
      return res.status(400).json({ message: "Email already registered" });
    }
    //create a new User
    const newUser = new User({
      name,
      email,
      password,
      profileImage,
    });
    // generate the verification token
    newUser.verificationToken = crypto.randomBytes(20).toString("hex");
    // save the user to data base
    await newUser.save();
    // send the verification email to the registered user
    sendVerificationEmail(newUser.email, newUser.verificationToken);

    res.status(200).json({
      message:
        "Registeration successful. Please check your mail for verification",
    });
  } catch (error) {
    console.log("Error registering user ", error);
    res.status(500).json({ message: "Registration failed" });
  }
});
// endpoint to verify email
app.get("/verify/:token", async (req, res) => {
  try {
    const token = req.params.token;
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(404).json({ message: "Invalid verification token" });
    }
    // mark the user as verified
    user.verified = true;
    user.verificationToken = undefined;
    await user.save();
    return res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Email verification failed" });
  }
});
// endpoint to login user
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      console.log("Invalid email adress");
      return res.status(401).json({ message: "Invalid email adress" });
    }
    if (user.password !== password) {
      console.log("Invalid password");
      return res.status(401).json({ message: "Invalid password" });
    }
    const token = jwt.sign({ userId: user._id }, secretKey);
    res.status(200).json({ token });
  } catch (error) {
    console.log("Error on login user ", error);
    res.status(500).json({ message: "Error on login a user " });
  }
});
// user's profile
app.get("/profile/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving user profile" });
  }
});
// endpoint to fetch all users except current user
app.get("/users/:userId", async (req, res) => {
  try {
    const loggedInUserId = req.params.userId;
    //fetch the logged-in user's connections
    const loggedInUser = await User.findById(loggedInUserId).populate(
      "connections",
      "_id"
    );
    //get the ID's of the connected users
    const connectedUserIds = loggedInUser.connections.map(
      (connection) => connection._id
    );
    //find the users who are not connected to the logged-in user Id
    const users = await User.find({
      _id: { $ne: loggedInUserId, $nin: connectedUserIds },
    });
    res.status(200).json(users);
  } catch (error) {
    console.log("Error retrieving users", error);
    res.status(500).json({ message: "Error retrieving users" });
  }
});
//send connection request
app.post("/connection-request", async (req, res) => {
  try {
    const { currentUserId, selectedUserId } = req.body;
    await User.findByIdAndUpdate(selectedUserId, {
      $push: { connectionRequests: currentUserId },
    });
    await User.findByIdAndUpdate(currentUserId, {
      $push: { sendConnectionRequests: selectedUserId },
    });
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ message: "Error creating connection request" });
  }
});
//endpoint to show all show the connections requests
app.get("/connections-request/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .populate("connectionRequests", "name email profileImage")
      .lean();
    const connectionRequests = user.connectionRequests;
    res.json(connectionRequests);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server Error" });
  }
});
// endpoint to accept a connection request
app.post("/connection-request/accept", async (req, res) => {
  try {
    console.log("req.body", req.body);
    const { senderId, recepientId } = req.body;

    const sender = await User.findById(senderId);
    const recepient = await User.findById(recepientId);

    sender.connections.push(recepientId);
    recepient.connections.push(senderId);

    recepient.connectionRequests = recepient.connectionRequests.filter(
      (request) => request.toString() !== senderId.toString()
    );
    sender.sendConnectionRequests = sender.sendConnectionRequests.filter(
      (request) => request.toString() !== recepientId.toString()
    );

    await sender.save();
    await recepient.save();

    res.status(200).json({ message: "Fiend request accepted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error Internal server" });
  }
});
//endpoint to fetch all the connections of a user
app.get("/connections/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId)
      .populate("connections", "name profileImage createdAt")
      .exec();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ connections: user.connections });
  } catch (error) {
    console.log("error fetching the connections", error);
    res.status(500).json({ message: "Error fecthing the connections" });
  }
});
