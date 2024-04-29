const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware
app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to ${req.url}`);
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect('mongodb+srv://aimmore:AimMore2003@cluster0.yaw8qsy.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

db.once('open', () => {
  console.log('MongoDB connection successful');
});

// User Schema
const userSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  emailid: { type: String, unique: true }, // Ensure unique email IDs
  userid: { type: String, unique: true }, // Ensure unique user IDs
  password: String, // Hash and salt passwords for security
});

const User = mongoose.model('User', userSchema);

// Chat Schema
const chatSchema = new mongoose.Schema({
  sender_userid: String,
  receiver_userid: String, // Add receiver ID
  content_type: String,
  message: String,
  timestamp: { type: Date, default: Date.now }, // Add timestamp
});

// Route to handle user signup
app.post('/signup', async (req, res) => {
  try {
    console.log('Attempting to sign up user...');
    const { firstname, lastname, emailid, password } = req.body;
    const userCount = await User.countDocuments() + 1;
    const userid = `AM${('0000' + userCount).slice(-5)}IN`;

    const user = new User({
      firstname,
      lastname,
      emailid,
      userid,
      password, // Hash and salt the password here
    });
    await user.save();
    console.log('User signup successful');
    res.status(201).send({ message: 'User created successfully' });
  } catch (error) {
    console.error('User signup failed:', error.message);
    res.status(500).send({ error: error.message });
  }
});

// Route to handle user login
app.post('/login', async (req, res) => {
  try {
    console.log('Attempting to log in user...');
    const { emailid, password } = req.body;
    const user = await User.findOne({ emailid });
    if (!user) {
      console.error('User login failed: User not found');
      return res.status(404).send({ message: 'User not found' });
    }
    if (user.password !== password) {
      console.error('User login failed: Invalid password');
      return res.status(401).send({ message: 'Invalid password' });
    }
    console.log('User login successful');
    res.status(200).send({ userid: user.userid, firstname: user.firstname });
  } catch (error) {
    console.error('User login failed:', error.message);
    res.status(500).send({ error: error.message });
  }
});

// Route to handle sending chat messages
app.post('/send', async (req, res) => {
  try {
    console.log('Attempting to send chat message...');
    const { receiver_userid, content_type, message } = req.body;
    const sender_userid = req.user.userid; // Assuming you have middleware to set req.user

    const chat = new Chat({
      sender_userid,
      receiver_userid,
      content_type,
      message,
    });
    await chat.save();
    console.log('Chat message sent successfully');
    res.status(201).send({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Sending chat message failed:', error.message);
    res.status(500).send({ error: error.message });
  }
});

// Route to handle fetching new messages
app.get('/chats', async (req, res) => {
  try {
    console.log('Attempting to fetch new messages...');
    const userid = req.headers.userid;

    const chats = await Chat.find({
      $or: [{ sender_userid: userid }, { receiver_userid: userid }],
    }).sort({ timestamp: 1 }); // Sort by timestamp in ascending order

    console.log('New messages fetched successfully');
    res.status(200).send(chats);
  } catch (error) {
    console.error('Fetching new messages failed:', error.message);
    res.status(500).send({ error: error.message });
  }
});

// Server Listening
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
