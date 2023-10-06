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

//creates a random string 
function generateRandomString() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters[Math.floor(Math.random() * characters.length)];
  }
  return result;
}

// return an object of shortUrls and their matching longUrls for a given user
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

//url database, which stores all the shortUrls, with longURL and user who created it
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

// Get route for landing page
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect("/login");
  }

});

//get route for urls
app.get("/urls", (req, res) => {
  const user_id = users[req.session.user_id];

  //checks if user is logged in, and only then displays urls_index
  if (!user_id) {
    res.send("You need to sign up or log in!");
  } else {

    const templateVars = { user_id, urls: urlsForUser(user_id.id) };

    res.render("urls_index", templateVars);
  }
});

//post route for urls - adds a new shortURL
app.post("/urls", (req, res) => {

  //checks if user is logged in, and only then add new shortURL
  if (req.session.user_id) {

    const shortID = generateRandomString();
    urlDatabase[shortID] = { longURL: req.body.longURL, userID: req.session.user_id };

    res.redirect(`/urls/${shortID}`);
  } else {
    res.send("You need to be logged in to create a short URL!");
  }
});

// checks if user is logged in, and only then renders urls_new, allowing user to add a new form
app.get("/urls/new", (req, res) => {
  const templateVars = { user_id: users[req.session.user_id] };
  if (!templateVars.user_id) {
    res.redirect('/login');
  } else {

    res.render("urls_new", templateVars);
  }
});


//checks if user is logged in, then if the urlDatabase contains the URL and then if the shortURL belongs to the logged in user, and only then renders the corresponding page
app.get("/urls/:id", (req, res) => {
  const user_id = req.session.user_id;

  if (!user_id) {
    res.send("You need to be logged in to view this page");
  }

  else if (!Object.keys(urlDatabase).includes(req.params.id)) {
    res.send("This ID is not in the database :(");

  } else if (user_id !== urlDatabase[req.params.id].userID) {

    res.send("Only the account holder can view this page!");

  } else {

    const templateVars = {
      user_id: users[req.session.user_id],
      id: req.params.id,
      longURL: urlDatabase[req.params.id].longURL
    };

    res.render("urls_show", templateVars);
  }
});


//checks if there is a user logged in, and if the id belongs to the account holder, and only then allows the longURL to be edited
app.post("/urls/:id", (req, res) => {

  if (!req.session.user_id || req.session.user_id !== urlDatabase[req.params.id].userID) {
    res.send("Only the owner of the Short URL can edit, sorry! If this is your Short URL, please log in to edit it!");

  } else {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect('/urls');
  }
});


//checks if there is a user logged in, and if the id belongs to the account holder, and only then allows the longURL to be deleted
app.post("/urls/:id/delete", (req, res) => {

  if (!req.session.user_id || req.session.user_id !== urlDatabase[req.params.id].userID) {
    res.send("Only the owner of the Short URL can delete, sorry! If this is your Short URL, please log in to delete it!");

  } else {
    delete urlDatabase[req.params.id];
    res.redirect(`/urls`);
  }
});

//renders register page, unless user is logged in, in which case they are redirect to the /urls
app.get("/register", (req, res) => {
  const templateVars = { user_id: users[req.session.user_id] };
  if (templateVars.user_id) {
    res.redirect('/urls');
  } else {

    res.render("register", templateVars);
  }
});

//takes data from the register form
app.post("/register", (req, res) => {


  // and checks if there is information for the username and password, sends 404 error if not
  if (!req.body.email || !req.body.password) {
    res.send("Oops, it looks like the email or password field was left blank");

    // redirects user to login page if email has already been registered
  } else if (findUserByEmail(req.body.email, users)) {
    res.redirect(`/login`);


    //creates user by created a random id, hashing the given password, and adding them to the users object that tracks all registered users. Also creates a cookie for the user, and logs them in 
  } else {
    const id = generateRandomString();
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    users[id] = { id, email: req.body.email, password: hashedPassword };
    req.session.user_id = id;
    res.redirect(`/urls`);
  }

});

//renders login page, but redirects user to /urls if they are logged in
app.get('/login', (req, res) => {
  const templateVars = { user_id: users[req.session.user_id] };

  if (templateVars.user_id) {
    res.redirect('/urls');
  } else {

    res.render('login', templateVars);
  }
});

// searches for user by email, if there is no user, or the password is incorrect it throws an error, otherwise it logs the user in and sets a cookie for the user.
app.post('/login', (req, res) => {
  const user = findUserByEmail(req.body.email, users);
  if (!user || !bcrypt.compareSync(req.body.password, user.password)) {
    res.send("The email or password is incorrect, or the email has not been registered!");
  } else {

    req.session.user_id = user.id;

    res.redirect('/urls');
  }
});

// logs user out, clears cookies
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});


// checks if shortUrl exists, then redirects shortURL to longURL or sends out error in html
app.get("/u/:id", (req, res) => {
  let longURL = urlDatabase[req.params.id];
  if (longURL){
  let longURL = urlDatabase[req.params.id].longURL;

    res.redirect(longURL);
  } else {
    res.send("Oops, it looks like that does not exist")
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});