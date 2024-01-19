const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const mongoSanitize = require('express-mongo-sanitize');
const Task = require('./models/Tasks');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/taskManagement', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

app.use(express.json());

// Middleware for task creation validation
const validateTaskCreation = [
  body('title').notEmpty().withMessage('Title is required.').isLength({ max: 255 }).withMessage('Title must be at most 255 characters.').escape(),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be at most 1000 characters.').escape(),
  body('status').notEmpty().isIn(['To Do', 'In Progress', 'Done']).withMessage('Invalid status.'),
];

// Middleware to sanitize user inputs
app.use(mongoSanitize());

// Passport setup
app.use(session({ secret: 'sakshisecret', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Routes

// Use the middleware in your protected routes
app.get('/api/protected-route', isAuthenticated, (req, res) => {
  // Handle the protected route logic
  res.status(200).json({ message: 'You have access to this protected route' });
});

app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = new User({ username });
    await User.register(user, password);
    res.status(200).json({ message: 'Registration successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/api/login', passport.authenticate('local'), (req, res) => {
  res.status(200).json({ message: 'Login successful', user: req.user });
});

app.get('/api/logout', (req, res) => {
  req.logout();
  res.status(200).json({ message: 'Logout successful' });
});

app.get('/api/tasks', isAuthenticated, async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/api/tasks', isAuthenticated, validateTaskCreation, async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description, status } = req.body;
    const newTask = new Task({ title, description, status });
    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.put('/api/tasks/:id', isAuthenticated, validateTaskCreation, async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const taskId = req.params.id;
    const { title, description, status } = req.body;
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { title, description, status },
      { new: true }
    );
    res.json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.delete('/api/tasks/:id', isAuthenticated, async (req, res) => {
  try {
    const taskId = req.params.id;
    await Task.findByIdAndDelete(taskId);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});



// Authentication middleware
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
