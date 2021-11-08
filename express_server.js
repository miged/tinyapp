const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://lighthouselabs.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// /urls
// Get all URLs
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id]
  };
  res.render("urls_index", templateVars);
});

// Create URL
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };

  if (!templateVars.user) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

app.post("/urls", (req, res) => {
  if (!req.cookies.user_id) {
    res.status(403).send("Not authorized");
  } else {
    const shortUrl = generateRandomString();
    urlDatabase[shortUrl] = {
      longURL: req.body.longURL,
      userID: req.cookies.user_id
    };

    res.redirect(`/urls/${shortUrl}`);
  }
});

// Get URL from id
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.cookies.user_id]
  };
  res.render("urls_show", templateVars);
});

// Update URL
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.newURL;
  res.redirect(`/urls/${req.params.id}`);
});

// Delete URL
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});


// /u
app.get("/u/:shortURL", (req, res) => {
  const url = urlDatabase[req.params.shortURL];
  if (!url) {
    res.status(404).send("Link not found");
  }

  res.redirect(url.longURL);
});


// /login
// Log in
app.get('/login', (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };

  // redirect if logged in
  if (templateVars.user) {
    res.redirect("/urls");
  } else {
    res.render("login", templateVars);
  }
});

app.post('/login', (req, res) => {
  const {email, password} = req.body;
  let user = getUser(email);

  if (!user) {
    res.status(403).send("User not found");
  } else if (user.password !== password) {
    res.status(403).send("Wrong password");
  } else {
    res.cookie('user_id', user.id);
    res.redirect("/urls");
  }
});

// /logout
// Log out the user
app.get('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
});

// /register
// User registration
app.get('/register', (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };

  // redirect if logged in
  if (templateVars.user) {
    res.redirect("/urls");
  } else {
    res.render("register", templateVars);
  }
});

app.post('/register', (req, res) => {
  let { email, password } = req.body;

  // email/password is empty
  if (!email || !password) {
    res.status(400).send("Email/password not found");
    return;
  }

  // user already exists
  if (getUser(email)) {
    res.status(400).send("User already exists");
    return;
  }

  // add user to database
  const id = generateRandomString();
  users[id] = { id, email, password };

  // set cookie
  res.cookie('user_id', id);
  console.log(users);

  res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const generateRandomString = (length = 6) => {
  let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  let str = '';
  for (let i = 0; i < length; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return str;
};

const getUser = (email) => {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return undefined;
};
