const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require('dotenv');
const path = require("path");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { Vonage } = require('@vonage/server-sdk');
const process = require('process');



var randomotp;

const vonage = new Vonage({
  apiKey: "e9aefcd7",
  apiSecret: "ZxGpMP0RblxB53q4"
})

const app = express();
const cors = require("cors");

app.use(cors());
dotenv.config({ path: path.join(__dirname, "./.env.example") });
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const jwt = require("jsonwebtoken");

mongoose.connect(`${process.env.MONGO_URI}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.log("Error connecting to MongoDB", error);
  });

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port: 5000`);
});

const User = require("./models/user");

app.get('/',(req,res)=>{
  res.send("from bacend")
})

//endpoint to register a user in the backend
app.post('/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    let formattedPhoneNumber = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
        // Assuming the country code for India is '+91'
        formattedPhoneNumber = '91' + phoneNumber;
    }
    // Generate a random 4-digit OTP
     randomotp = Math.floor(1000 + Math.random() * 9000);

    // Compose the SMS text with the OTP
    const text = `Your OTP to verify mobile number in jay tailors shop is: ${randomotp}`;

    // Specify the sender ID
    const from = "Vonage APIs";

    // Send SMS using Vonage SMS API
    await vonage.sms.send({ to: formattedPhoneNumber, from, text });
    res.status(200).send('OTP sent successfully');
  } catch (error) {
   
    res.status(500).send('Error sending OTP');
  }
});

app.post('/verify-otp', (req, res) => {
  const { otp} = req.body;
  if ( otp == randomotp) {
      // OTP verification successful
      res.status(200).json({ success: true });
  } else {
      // OTP verification failed
      res.status(400).json({ success: false, error: 'Invalid OTP' });
  }
});

app.post("/register", async (req, res) => {
  try {
    const { name, email, password, companyName } = req.body;

    //check if the email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    //create a new User
    const newUser = new User({
      name,
      email,
      password,
      companyName,
    });

    //generate the verification token
    newUser.verificationToken = crypto.randomBytes(20).toString("hex");

    //save the user to the database
    await newUser.save();

    res.status(202).json({
      message:
        "Registration successful.Please check your mail for verification",
    });
  } catch (error) {
    console.log("Error registering user", error);
    res.status(500).json({ message: "Registration failed" });
  }
});


const generateRandomToken = (email, password) => {
  // Get the current timestamp in milliseconds
  const timestamp = Date.now().toString();

  // Concatenate email, password, and timestamp
  const data = email + password + timestamp;

  // Generate SHA256 hash of the concatenated string
  const hash = crypto.createHash('sha256').update(data).digest('hex');

  return hash;
};
//endpoint to login a user.
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

   
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token =generateRandomToken(user.email,user.password); 

    res.status(200).json({ token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: "Login failed" });
  }
});


