const { getUser, generateRandomString, urlsForUser } = require('./helpers');

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const dayjs = require('dayjs');
const app = express();
const PORT = 8080; // default port 8080

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

// URL Database
const urlDatabase = {
  b6UTxQ: {
    longURL: 'https://lighthouselabs.ca',
    userID: 'aJ48lW',
    visits: 34,
    uniqueVisits: 20,
    dateCreated: new Date(),
    visitDates: [],
  },
  i3BoGr: {
    longURL: 'https://www.google.ca',
    userID: 'aJ48lW',
    visits: 153,
    uniqueVisits: 130,
    dateCreated: new Date(),
    visitDates: [],
  },
};

// User Database
const users = {
  aJ48lW: {
    id: 'aJ48lW',
    email: 'user@example.com',
    password: bcrypt.hashSync('purple-monkey-dinosaur'),
  },
};

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
// Get all URLs
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

  if (!templateVars.user) {
    // redirect if not logged in
    res.redirect('/login');
  } else {
    res.render('urls_new', templateVars);
  }
});

app.post('/urls', (req, res) => {
  if (!req.session.user_id) {
    // send error if not logged in
    res.status(403).send('Please log in to create a url.');
  } else {
    // create new url
    const shortUrl = generateRandomString();
    urlDatabase[shortUrl] = {
      longURL: req.body.longURL,
      userID: req.session.user_id,
      visits: 0,
      visitDates: [],
    };

    res.redirect(`/urls/${shortUrl}`);
  }
});

// Get URL from id
app.get('/urls/:shortURL', (req, res) => {
  const user = users[req.session.user_id];
  const url = urlDatabase[req.params.shortURL];

  // redirect if not logged in
  if (!user) {
    res.redirect('/login', 403);
    return;
  }

  // url doesn't belong to user
  if (req.session.user_id !== url.userID) {
    res.redirect('/urls', 403);
    return;
  }

  const templateVars = {
    shortURL: req.params.shortURL,
    url,
    user,
  };
  res.render('urls_show', templateVars);
});

// Update URL
app.post('/urls/:id', (req, res) => {
  const url = urlDatabase[req.params.id];

  if (url.userID === req.session.user_id) {
    urlDatabase[req.params.id].longURL = req.body.newURL;
    res.redirect(`/urls`);
  } else {
    res.status(403).send('Not authorized');
  }
});

// Delete URL
app.post('/urls/:shortURL/delete', (req, res) => {
  const url = urlDatabase[req.params.shortURL];

  if (url.userID === req.session.user_id) {
    delete urlDatabase[req.params.shortURL];
  } else {
    return res.status(403).send('Not authorized');
  }

  res.redirect('/urls');
});

// /u
app.get('/u/:shortURL', (req, res) => {
  const url = urlDatabase[req.params.shortURL];
  if (!url) {
    res.status(404).send('Link not found');
    return;
  }

  // increment number of visits
  url.visits += 1;

  // keep track of date visited
  const now = dayjs().format('YYYY-MM-DD hh:mm:ss A');
  url.visitDates.push(now);

  res.redirect(url.longURL);
});

// /login
// Log in
app.get('/login', (req, res) => {
  const templateVars = { user: users[req.session.user_id] };

  // redirect if logged in
  if (templateVars.user) {
    res.redirect('/urls');
  } else {
    res.render('login', templateVars);
  }
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  let user = getUser(email, users);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(403).send('Email and password do not match a user.');
  } else {
    // set cookie
    req.session.user_id = user.id;
    res.redirect('/urls');
  }
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
    res.redirect('/urls');
  } else {
    res.render('register', templateVars);
  }
});

app.post('/register', (req, res) => {
  let { email, password } = req.body;

  // email/password is empty
  if (!email || !password) {
    res.status(400).send('Email/password empty');
    return;
  }

  // user already exists
  if (getUser(email, users)) {
    res.status(400).send('Email already exists');
    return;
  }

  // add user to database
  const id = generateRandomString();
  password = bcrypt.hashSync(password);
  users[id] = { id, email, password };

  // set cookie
  req.session.user_id = id;
  console.log(users);

  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
