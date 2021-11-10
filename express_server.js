const { getUser, generateRandomString, urlsForUser } = require('./helpers');
const { urlDatabase, users } = require('./db');

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const methodOverride = require('method-override')
const dayjs = require('dayjs');
const app = express();
const PORT = 8080; // default port 8080
const dateFormat = 'YYYY-MM-DD hh:mm:ss A';

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: 'session',
    keys: ['secretkey'],
    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })
);
// override with POST having ?_method=DELETE
app.use(methodOverride('_method'))

app.get('/', (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// Get URL database in JSON format
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// /urls
// Get all URLs for user
app.get('/urls', (req, res) => {
  const urls = urlsForUser(req.session.user_id, urlDatabase);
  const templateVars = {
    urls,
    user: users[req.session.user_id],
  };

  res.render('urls_index', templateVars);
});

// Create URL
app.get('/urls/new', (req, res) => {
  const templateVars = { user: users[req.session.user_id] };

  // redirect if not logged in
  if (!templateVars.user) {
    return res.redirect('/login');
  }

  res.render('urls_new', templateVars);
});

app.post('/urls', (req, res) => {
  // send error if not logged in
  if (!req.session.user_id) {
    return res.status(403).send('Please log in to create a url.');
  }

  // create new url
  const shortUrl = generateRandomString();
  urlDatabase[shortUrl] = {
    longURL: req.body.longURL,
    userID: req.session.user_id,
    visits: 0,
    uniqueVisits: 0,
    uniqueVisitors: [],
    visitDates: [],
    dateCreated: dayjs().format(dateFormat)
  };

  res.redirect(`/urls/${shortUrl}`);
});

// Get URL from id
app.get('/urls/:shortURL', (req, res) => {
  const user = users[req.session.user_id];
  const url = urlDatabase[req.params.shortURL];

  // check if not logged in
  if (!user) {
    return res.redirect('/login', 403);
  }

  // check if url exists
  if (!url) {
    return res.redirect('/urls', 404);
  }

  // check if url doesn't belong to user
  if (req.session.user_id !== url.userID) {
    return res.redirect('/urls', 403);
  }

  const templateVars = {
    shortURL: req.params.shortURL,
    url,
    user,
  };
  res.render('urls_show', templateVars);
});

// Update URL
app.put('/urls/:id', (req, res) => {
  const url = urlDatabase[req.params.id];

  // check if url belongs to current user
  if (url.userID !== req.session.user_id) {
    return res.status(403).send('Not authorized');
  }

  urlDatabase[req.params.id].longURL = req.body.newURL;
  res.redirect(`/urls`);
});

// Delete URL
app.delete('/urls/:shortURL', (req, res) => {
  const url = urlDatabase[req.params.shortURL];

  // check if url belongs to current user
  if (url.userID !== req.session.user_id) {
    return res.status(403).send('Not authorized');
  }

  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

// /u
app.get('/u/:shortURL', (req, res) => {
  const url = urlDatabase[req.params.shortURL];
  if (!url) {
    return res.status(404).send('URL not found');
  }

  // increment number of visits
  url.visits += 1;

  // generate visitor id
  if (!req.session.visitor_id) {
    req.session.visitor_id = generateRandomString(8);
  }

  // check if visitor has visited url already
  if (!url.uniqueVisitors.includes(req.session.visitor_id)) {
    url.uniqueVisits += 1;
    url.uniqueVisitors.push(req.session.visitor_id);
  }

  // keep track of date visited
  const now = dayjs().format(dateFormat);
  url.visitDates.push(now);

  res.redirect(url.longURL);
});

// /login
// Log in
app.get('/login', (req, res) => {
  const templateVars = { user: users[req.session.user_id] };

  // redirect if logged in
  if (templateVars.user) {
    return res.redirect('/urls');
  }

  res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  let user = getUser(email, users);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(403).send('Email and password do not match a user.');
  }

  // set cookie
  req.session.user_id = user.id;
  res.redirect('/urls');
});

// /logout
// Log out the user
app.get('/logout', (req, res) => {
  req.session.user_id = '';
  res.redirect('/urls');
});

// /register
// User registration
app.get('/register', (req, res) => {
  const templateVars = { user: users[req.session.user_id] };

  // redirect if logged in
  if (templateVars.user) {
    return res.redirect('/urls');
  }

  res.render('register', templateVars);
});

app.post('/register', (req, res) => {
  let { email, password } = req.body;

  // check if email/password is empty
  if (!email || !password) {
    return res.status(400).send('Email/password empty');
  }

  // check if user already exists
  if (getUser(email, users)) {
    return res.status(400).send('Email already exists');
  }

  // add user to database
  const id = generateRandomString();
  password = bcrypt.hashSync(password);
  users[id] = { id, email, password };

  // set cookie
  req.session.user_id = id;

  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
