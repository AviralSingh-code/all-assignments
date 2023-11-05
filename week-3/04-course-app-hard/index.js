// ## Create a course selling website

// ### Description
// Functionally the same as 03-course-app-medium. Routes are the same as well.
// Rather than storing data in files, store them in MongoDB. 
// We will be covering this in the extra class next week but would be good for you to run ahead.

// ## Routes
// ### Admin Routes:
//  - POST /admin/signup
//    Description: Creates a new admin account.
//    Input: { username: 'admin', password: 'pass' }
//    Output: { message: 'Admin created successfully', token: 'jwt_token_here' }
//  - POST /admin/login
//    Description: Authenticates an admin. It requires the admin to send username and password in the headers.
//    Input: Headers: { 'username': 'admin', 'password': 'pass' }
//    Output: { message: 'Logged in successfully', token: 'jwt_token_here' }
//  - POST /admin/courses
//    Description: Creates a new course.
//    Input: Headers: { 'Authorization': 'Bearer jwt_token_here' }, Body: { title: 'course title', description: 'course description', price: 100, imageLink: 'https://linktoimage.com', published: true }
//    Output: { message: 'Course created successfully', courseId: 1 }
//  - PUT /admin/courses/:courseId
//    Description: Edits an existing course. courseId in the URL path should be replaced with the ID of the course to be edited.
//    Input: Headers: { 'Authorization': 'Bearer jwt_token_here' }, Body: { title: 'updated course title', description: 'updated course description', price: 100, imageLink: 'https://updatedlinktoimage.com', published: false }
//    Output: { message: 'Course updated successfully' }
//  - GET /admin/courses
//    Description: Returns all the courses.
//    Input: Headers: { 'Authorization': 'Bearer jwt_token_here' }
//    Output: { courses: [ { id: 1, title: 'course title', description: 'course description', price: 100, imageLink: 'https://linktoimage.com', published: true }, ... ] }
//    User Routes:

// ### User routes
//  - POST /users/signup
//    Description: Creates a new user account.
//    Input: { username: 'user', password: 'pass' }
//    Output: { message: 'User created successfully', token: 'jwt_token_here' }
//  - POST /users/login
//    Description: Authenticates a user. It requires the user to send username and password in the headers.
//    Input: Headers: { 'username': 'user', 'password': 'pass' }
//    Output: { message: 'Logged in successfully', token: 'jwt_token_here' }
//  - GET /users/courses
//    Description: Lists all the courses.
//    Input: Headers: { 'Authorization': 'Bearer jwt_token_here' }
//    Output: { courses: [ { id: 1, title: 'course title', description: 'course description', price: 100, imageLink: 'https://linktoimage.com', published: true }, ... ] }
//  - POST /users/courses/:courseId
//    Description: Purchases a course. courseId in the URL path should be replaced with the ID of the course to be purchased.
//    Input: Headers: { 'Authorization': 'Bearer jwt_token_here' }
//    Output: { message: 'Course purchased successfully' }
//  - GET /users/purchasedCourses
//    Description: Lists all the courses purchased by the user.
//    Input: Headers: { 'Authorization': 'Bearer jwt_token_here' }
//    Output: { purchasedCourses: [ { id: 1, title: 'course title', description: 'course description', price: 100, imageLink: 'https://linktoimage.com', published: true }, ... ] }


// Database Access String : mongodb+srv://Aviral_Singh:Aviral@001@cluster0.hcnv856.mongodb.net/

const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

const secretKey = 'SECr3t';


//Defining schemas
const userSchema = new mongoose.Schema({
  username: String,  //we can also write username: {type: String}
  password: String,
  purchasedCourses: [{type: mongoose.Schema.Types.ObjectId, ref: 'Course'}]  //this is same as setting a foreign key
  //this will only store the objectId and not the entire object
  //so that if there is any change in the courses table we don't get stale data in this table
});

const adminSchema = new mongoose.Schema({
  username: String,
  password: String
});

const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  imageLink: String,
  published: Boolean
});


//Defining models
const User = mongoose.model('User', userSchema);
const Admin = mongoose.model('Admin', adminSchema);
const Course = mongoose.model('Course', courseSchema);


//Authentication
function generateToken(user)
{
  var usernameVal = {username: user.username};
  return jwt.sign(usernameVal, secretKey, {expiresIn: '1h'});
}

function authentication(req,res,next)
{
  var authenticateVal = req.headers.authorization;
  var tokenVal = authenticateVal.split(' ')[1];
  jwt.verify(tokenVal, secretKey, (err,user) => {
    if(err)
    {
      return res.sendStatus(403);
    }
    else
    {
      req.user = user;
      res.token = tokenVal;
      next();
    }
  });
}


//courseId generator from google
function makeid(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

//connecting to mongoDB
mongoose.connect('mongodb+srv://Aviral_Singh:Aviral%40001@cluster0.hcnv856.mongodb.net/courses', {dbName: "courses"});

// Admin routes
app.post('/admin/signup', async (req, res) => {
  const  admin = req.body;
  const result = await Admin.findOne({username: admin.username}); //findOne takes object as argument that is why we cannot write admin.username but we write username: admin.username
  if(result)
  {
    res.status(403).json({message: 'Admin already exists'});
  }
  else
  {
    const newAdmin = new Admin({username: admin.username, password: admin.password}); //to create a new entry
    await newAdmin.save(); //to put value to database
    const token = generateToken(admin);
    res.json({message: 'Admin created successfully', token});
  }
});

app.post('/admin/login', async (req, res) => {
  const admin = req.headers;
  const result = await Admin.findOne({username: admin.username, password: admin.password});
  if(result)
  {
    const token = generateToken(admin);
    res.json({message: 'Logged In Successfully', token});
  }
  else
  {
    res.status(403).json({message: 'Invalid username or password'});
  }
});

app.post('/admin/courses', authentication , async (req, res) => {
  const course = req.body;
  course.id = makeid(10);
  const createCourse = new Course(course);
  await createCourse.save();
  res.json({message: 'Course Created Successfully', courseId: course.id});
});

app.put('/admin/courses/:courseId', authentication ,async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.courseId, req.body, {new: true});
  if(course)
  {
    res.json({message: 'Course Updated Successfully'});
  }
  else
  {
    res.status(404).json({message: 'Course not found'});
  }
});

app.get('/admin/courses', authentication ,async (req, res) => {
  const courses = await Course.find({}); //this gives all the courses without any parameteres
  res.json({courses}); 
});

// User routes
app.post('/users/signup', async (req, res) => {
  const user = req.body;
  const result = await User.findOne({username: user.username});
  if(result)
  {
    res.status(403).json({message: 'User Already exists'});
  }
  else
  {
    const newUser = new User({username: user.username, password: user.password});
    await newUser.save();
    const token = generateToken(user);
    res.json({message: 'User created successfully', token});
  }
});

app.post('/users/login', async (req, res) => {
  const user = req.headers;
  const result = await User.findOne({username: user.username, password: user.password});
  if(result)
  {
    const token = generateToken(user);
    res.json({message: 'Logged In Successfully', token});
  }
  else
  {
    res.status(403).json({message: 'Invalid Username or Password'});
  }
});

app.get('/users/courses', authentication ,async (req, res) => {
  //we just have to show the published courses to the user and
  //not all the courses
  const courses = await Course.find({published: true});
  res.json({courses});
});

app.post('/users/courses/:courseId', authentication ,async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if(course)
  {
    const resultUser = await User.findOne({username: req.user.username});
    if(resultUser)
    {
      resultUser.purchasedCourses.push(course);
      await resultUser.save();
      res.json({message: 'Course purchased successfully'});
    }
    else
    {
      res.status(403).json({message: 'User not found'});
    }
  }
  else
  {
    res.status(404).json({message: 'Course not found'});
  }
});

app.get('/users/purchasedCourses',  authentication, async (req, res) => {
  //populate will take the reference key and fill all the details of the course
  //from the course table....this will help us to display all the details of the course
  //with just the id stored as reference
  const user = await User.findOne({username: req.user.username}).populate('purchasedCourses');
  if(user)
  {
    res.json({purchasedCourses: user.purchasedCourses || [] });
  }
  else
  {
    res.status(403).json({message: 'User not found'});
  }
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
