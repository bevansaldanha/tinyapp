const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const { findUserByEmail } = require('./helpers');


app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'whatever',
  keys: ['vsjdnvuseiovn']
}));

function generateRandomString() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters[Math.floor(Math.random() * characters.length)];
  }
  return result;
}

function urlsForUser(id) {
  let result = {};
  for (const shortID in urlDatabase) {
    if (urlDatabase[shortID].userID === id) {
      result[shortID] = urlDatabase[shortID].longURL;
    }
  }
  return result;
}

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};


const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "userRandomID",
  },
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const user_id = users[req.session.user_id];
  if (!user_id) {
    res.send("You need to sign up or log in!");
  } else {

    const templateVars = { user_id, urls: urlsForUser(user_id.id) };

    res.render("urls_index", templateVars);
  }
});

app.post("/urls", (req, res) => {

  if (req.session.user_id) {

    const shortID = generateRandomString();
    urlDatabase[shortID] = { longURL: req.body.longURL, userID: req.session.user_id };

    res.redirect(`/urls/${shortID}`);
  } else {
    res.send("You need to be logged in to create a short URL!");
  }
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user_id: users[req.session.user_id] };
  if (!templateVars.user_id) {
    res.redirect('/login');
  } else {

    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  const user_id = req.session.user_id;

  if (!user_id || user_id !== urlDatabase[req.params.id].userID) {
    res.send("Only the account holder can view this page!");
  }

  else if (!Object.keys(urlDatabase).includes(req.params.id)) {
    res.send("This ID is not in the database :(");
  } else {
    const templateVars = {
      user_id,
      id: req.params.id,
      longURL: urlDatabase[req.params.id].longURL
    };

    res.render("urls_show", templateVars);
  }
});

app.post("/urls/:id", (req, res) => {

  if (!req.session.user_id || req.session.user_id !== urlDatabase[req.params.id].userID) {
    res.send("Only the owner of the Short URL can edit, sorry! If this is your Short URL, please log in to edit it!");

  } else {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect('/urls');
  }
});

app.post("/urls/:id/delete", (req, res) => {

  if (!req.session.user_id || req.session.user_id !== urlDatabase[req.params.id].userID) {
    res.send("Only the owner of the Short URL can delete, sorry! If this is your Short URL, please log in to delete it!");

  } else {
    delete urlDatabase[req.params.id];
    res.redirect(`/urls`);
  }
});

app.get("/register", (req, res) => {
  const templateVars = { user_id: users[req.session.user_id] };
  if (templateVars.user_id) {
    res.redirect('/urls');
  } else {

    res.render("register", templateVars);
  }
});

app.post("/register", (req, res) => {

  if (!req.body.email || !req.body.password) {
    res.sendStatus(404);
  } else if (findUserByEmail(req.body.email, users)) {
    res.redirect(`/login`);

  } else {
    const id = generateRandomString();
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    users[id] = { id, email: req.body.email, password: hashedPassword };
    // res.cookie("user_id", id);
    req.session.user_id = id;
    res.redirect(`/urls`);
  }

});
app.get('/login', (req, res) => {
  const templateVars = { user_id: users[req.session.user_id] };

  res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  const user = findUserByEmail(req.body.email, users);
  if (!user || !bcrypt.compareSync(req.body.password, user.password)) {
    res.send("The email or password is incorrect, or the email has not been registered!");
  } else {

    // res.cookie(req.session.user_id, user.id);
    req.session.user_id = user.id;

    res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie(req.session.user_id);

  req.session.user_id = null;

  res.redirect('/login');
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});


app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});