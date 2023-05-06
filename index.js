//importing modules 
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

//initialising express
const app = express();

//bodyparser middleware
app.use(bodyParser.json());

//importing models
const User = require('./models/users');
const Book = require('./models/books');
const Order = require('./models/orders');
require("dotenv").config()
//connecting to database
const connectToDb = async (cb) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connection Established to DB")
    cb()
  } catch (error) {
    console.log("Ërror While Connecting to DB Server not  started")
  }
}


//register route
app.post('/api/register', (req, res) => {
  const newUser = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    isAdmin: req.body.isAdmin
  });
  newUser.save()
    .then(user => res.status(201).json(user))
    .catch(err => res.status(400).json('Error: ' + err));
});

//login route
app.post('/api/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email })
    .then(user => {
      if (!user) return res.status(400).json('No user found');
      if (user.password !== password) return res.status(400).json('Incorrect password');
      jwt.sign({ id: user._id }, 'secretkey', (err, token) => {
        if (err) res.status(400).json('Error: ' + err);
        res.status(200).json({
          token
        });
      });
    });
});


// get books by category route
app.get('/api/books', (req, res) => {
  if(req.query.category) {
    Book.find({ category: req.query.category })
      .then(books => res.status(200).json(books))
      .catch(err => res.status(400).json('Error: ' + err));
  } 
// get books by author and category route
  else if(req.params.author & req.params.category){
    Book.find({ author: req.params.author, category: req.params.category })
    .then(books => res.status(200).json(books))
    .catch(err => res.status(400).json('Error: ' + err));
  }
// get books list route
  else {
    Book.find()
    .then(books => res.status(200).json(books))
    .catch(err => res.status(400).json('Error: ' + err));
  }
});

//get book details route
app.get('/api/books/:id', (req, res) => {
  Book.findById(req.params.id)
    .then(book => res.status(200).json(book))
    .catch(err => res.status(400).json('Error: ' + err));
});

//add book route (protected route)
app.post('/api/books', verifyToken, (req, res) => {
  jwt.verify(req.token, 'secretkey', (err, authData) => {
    if (err) {
      res.status(400).json('Error: ' + err);
    } else {
      const newBook = new Book({
        title: req.body.title,
        author: req.body.author,
        category: req.body.category,
        price: req.body.price,
        quantity: req.body.quantity
      });
      newBook.save()
        .then(book => res.status(201).json(book))
        .catch(err => res.status(400).json('Error: ' + err));
    }
  });
});

//update book route (protected route) using patch
app.put('/api/books/:id', verifyToken, (req, res) => {
  jwt.verify(req.token, 'secretkey', (err, authData) => {
    if (err) {
      res.status(400).json('Error: ' + err);
    } else {
      Book.findByIdAndUpdate(req.params.id, req.body)
        .then(() => res.status(202).json('Book updated!'))
        .catch(err => res.status(400).json('Error: ' + err));
    }
  });
});
//update book route (protected route) using patch
app.patch('/api/books/:id', verifyToken, (req, res) => {
  jwt.verify(req.token, 'secretkey', (err, authData) => {
    if (err) {
      res.status(400).json('Error: ' + err);
    } else {
      Book.findByIdAndUpdate(req.params.id, req.body)
        .then(() => res.status(202).json('Book updated!'))
        .catch(err => res.status(400).json('Error: ' + err));
    }
  });
});

//delete book route (protected route)
app.delete('/api/books/:id', verifyToken, (req, res) => {
  jwt.verify(req.token, 'secretkey', (err, authData) => {
    if (err) {
      res.status(400).json('Error: ' + err);
    } else {
      Book.findByIdAndDelete(req.params.id)
        .then(() => res.status(202).json('Book deleted!'))
        .catch(err => res.status(400).json('Error: ' + err));
    }
  });
});

//place order route (protected route)
app.post('/api/order', verifyToken, (req, res) => {
  jwt.verify(req.token, 'secretkey', (err, authData) => {
    if (err) {
      res.status(400).json('Error: ' + err);
    } else {
      const newOrder = new Order({
        user: authData.id,
        books: req.body.books,
        totalAmount: req.body.totalAmount
      });
      newOrder.save()
        .then(order => {
          res.status(201).json(order);
        })
        .catch(err => res.status(400).json('Error: ' + err));
    }
  });
});

//get orders route (protected route)
app.get('/api/orders', verifyToken, (req, res) => {
  jwt.verify(req.token, 'secretkey', (err, authData) => {
    if (err) {
      res.status(400).json('Error: ' + err);
    } else {
      Order.find()
        .populate('user', ['name', 'email'])
        .populate('books')
        .then(orders => {
          res.status(200).json(orders);
        })
        .catch(err => res.status(400).json('Error: ' + err));
    }
  });
});

//verify token middleware
function verifyToken(req, res, next) {
  const bearerHeader = req.headers['authorization'];
  if (typeof bearerHeader !== 'undefined') {
    const bearer = bearerHeader.split(' ');
    const bearerToken = bearer[1];
    req.token = bearerToken;
    next();
  } else {
    res.status(400).json('Unauthorised');
  }
}

//listen to port
const port = process.env.port || 3000;
const startServer = () => app.listen(port, () => console.log(`Server running on port ${port}`));
connectToDb(startServer)
