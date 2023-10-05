const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

function findUserByEmail(email) {
  for (const id in users) {
    if (users[id].email === email) {
      return users[id];
    }
  }
  return null;
}

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
  const user_id = users[req.cookies["user_id"]];
  if (!user_id) {
    res.send("You need to sign up or log in!");
  } else {

    const templateVars = { user_id, urls: urlsForUser(user_id.id) };

    res.render("urls_index", templateVars);
  }
});

app.post("/urls", (req, res) => {

  if (req.cookies.user_id) {

    const shortID = generateRandomString();
    urlDatabase[shortID] = { longURL: req.body.longURL, userID: req.cookies.user_id };

    res.redirect(`/urls/${shortID}`);
  } else {
    res.send("You need to be logged in to create a short URL!");
  }
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user_id: users[req.cookies["user_id"]] };
  if (!templateVars.user_id) {
    res.redirect('/login');
  } else {

    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  const user_id = req.cookies.user_id;
  console.log(user_id)

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
  console.log(req.params + "HERE")

  if(!req.cookies.user_id || req.cookies.user_id !== urlDatabase[req.params.id].userID) {
    res.send("Only the owner of the Short URL can edit, sorry! If this is your Short URL, please log in to edit it!")

  }else{
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect('/urls');
}
});

app.post("/urls/:id/delete", (req, res) => {

  if(!req.cookies.user_id || req.cookies.user_id !== urlDatabase[req.params.id].userID) {
    res.send("Only the owner of the Short URL can delete, sorry! If this is your Short URL, please log in to delete it!");

  }else {
    delete urlDatabase[req.params.id];
    res.redirect(`/urls`);
  }
});

app.get("/register", (req, res) => {
  const templateVars = { user_id: users[req.cookies["user_id"]] };

  res.render("register", templateVars);
});

app.post("/register", (req, res) => {

  if (!req.body.email || !req.body.password) {
    res.sendStatus(404);
  } else if (findUserByEmail(req.body.email)) {
    res.redirect(`/login`);

  } else {
    const id = generateRandomString();
    users[id] = { id, ...req.body };
    res.cookie("user_id", id);
    res.redirect(`/urls`);
  }

});
app.get('/login', (req, res) => {
  const templateVars = { user_id: users[req.cookies["user_id"]] };

  res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  const user = findUserByEmail(req.body.email);
  if (!user || req.body.password !== user.password) {
    res.sendStatus(403);
  } else {

    res.cookie("user_id", user.id);
    res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie("user_id");
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