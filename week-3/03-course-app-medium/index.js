// ## Create a course selling website

// ### Description
// Functionally the same as 02-course-app-easy. Routes are the same as well.
// But now you need to store data in files vs in memory.
// Create separate files for each entity (admin, user, course, purchase).

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


const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.json());

app.use(bodyParser.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

ADMINS = JSON.parse(fs.readFileSync(path.join(__dirname + '/admin.json'), 'utf-8'));
USERS = JSON.parse(fs.readFileSync(path.join(__dirname + '/user.json'), 'utf-8'));
COURSES = JSON.parse(fs.readFileSync(path.join(__dirname + '/course.json'), 'utf-8'));

var courseIdGenerator = 1;

const secretKey = 'AviralS33cretval1';
const secretKeyUser = 'fwfewviralval1';

function generateToken(user)
{
  var usernameVal = {username: user.username};
  return jwt.sign(usernameVal, secretKey, {expiresIn : '1h'});
}

function generateTokenUser(user)
{
  var usernameVal = {username: user.username};
  return jwt.sign(usernameVal, secretKeyUser, {expiresIn : '1h'});
}


function adminAuthentication(req,res,next)
{
  var authenticateVal = req.headers.authorization;
  var tokenVal = authenticateVal.split(' ')[1];

  jwt.verify(tokenVal, secretKey, (err,user) => 
  {
    if(err)
    {
      return res.sendStatus(403);
    }
    else
    {
      req.user = user;
      req.token = tokenVal;
      next();
    }
  })
}

function userAuthentication(req,res,next)
{
  var authenticateVal = req.headers.authorization;
  var tokenVal = authenticateVal.split(' ')[1];

  jwt.verify(tokenVal, secretKeyUser, (err,user) => 
  {
    if(err)
    {
      return res.sendStatus(403);
    }
    else
    {
      req.user = user;
      req.token = tokenVal;
      next();
    }
  })
}

// Admin routes
app.post('/admin/signup', (req, res) => {
  var admin = req.body;
  var findAdmin = ADMINS.find(a => a.username == admin.username);
  if(findAdmin)
  {
    res.status(403).json({ message: 'Admin already exists' });
  }
  else
  {
    ADMINS.push(admin);
    fs.writeFileSync(path.join(__dirname + '/admin.json'), JSON.stringify(ADMINS));
    var token = generateToken(admin);
    res.json({ message: 'Admin created successfully', token });
  }
});

app.post('/admin/login',(req, res) => {
  const { username, password } = req.headers;
  const admin = ADMINS.find(a => a.username == username && a.password == password);
  if (admin) {
    const token = generateToken(admin);
    res.json({ message: 'Logged in successfully', token });
  } else {
    res.status(403).json({ message: 'Admin authentication failed' });
  }
});


app.post('/admin/courses', adminAuthentication ,(req, res) => {
  const course = req.body;
  course.id = courseIdGenerator;
  courseIdGenerator += 1;
  COURSES.push(course);
  fs.writeFileSync(path.join(__dirname + '/course.json'), JSON.stringify(COURSES));
  res.json({ message: 'Course created successfully', courseId: course.id });
});

app.put('/admin/courses/:courseId', adminAuthentication ,(req, res) => {
  var courseIdValue = req.params.courseId;
  for(let i = 0; i < COURSES.length; i++)
  {
    if(COURSES[i].id == courseIdValue)
    {
      COURSES[i].title = req.body.title;
      COURSES[i].description = req.body.description;
      COURSES[i].price = req.body.price;
      COURSES[i].imageLink = req.body.imageLink;
      COURSES[i].published = req.body.published;
      fs.writeFileSync(path.join(__dirname + '/course.json'), JSON.stringify(COURSES));
      res.status(200).json({ message: 'Course updated successfully' });
    }
  }
  res.status(404).json({message : 'Course Not Found !!'});
});

app.get('/admin/courses', adminAuthentication ,(req, res) => {
  var courses = [];
  courses = COURSES;
  res.status(200).json({courses});
});

// User routes
app.post('/users/signup', (req, res) => {
  var user = req.body;
  var findAdmin = USERS.find(a => a.username == user.username);
  if(findAdmin)
  {
    res.status(403).json({ message: 'User already exists' });
  }
  else
  {
    USERS.push(user);
    fs.writeFileSync(path.join(__dirname + 'user.json'), JSON.stringify(USERS));
    var token = generateTokenUser(user);
    res.json({ message: 'User created successfully', token });
  }
});

app.post('/users/login' ,(req, res) => {
  const { username, password } = req.headers;
  const user = USERS.find(a => a.username == username && a.password == password);
  if (user) {
    const token = generateTokenUser(user);
    res.json({ message: 'Logged in successfully', token });
  } else {
    res.status(403).json({ message: 'User authentication failed' });
  }
});

app.get('/users/courses', userAuthentication ,(req, res) => {
  var courses = [];
  courses = COURSES;
  res.status(200).json({courses});
});

app.post('/users/courses/:courseId', userAuthentication ,(req, res) => {
  var pickCourse = parseInt(req.params.courseId);
  const result = COURSES.find(c => c.id === pickCourse);

  if(result)
  {
    const userVal = USERS.find(u => u.username === req.user.username)
    if(!userVal.purchasedCourses)
    {
      userVal.purchasedCourses = [];   //see over here only the user is being modified 
    }
    userVal.purchasedCourses.push(pickCourse);
    fs.writeFileSync(path.join(__dirname + '/user.json'), JSON.stringify(USERS)); //we update the USERS
    res.json({ message: 'Course purchased successfully' });
  }
  else
  {
    res.status(404).json({ message: 'Course not found' });
  }
});

app.get('/users/purchasedCourses', userAuthentication ,(req, res) => {
  const user = USERS.find(u => u.username === req.user.username);
  var coursePurchased = [];
  //we only do user.purchasedCourses and not req.user.purchasedCourses because see above we are only
  //modifying the user and not the req header
  var purchasedCoursesId = user.purchasedCourses;  
  
  for(let i = 0; i < COURSES.length; i++)
  {
    if(purchasedCoursesId.indexOf(COURSES[i].id) !== -1)
    {
      coursePurchased.push(COURSES[i]);
    }
  }
  res.json({coursePurchased});
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
