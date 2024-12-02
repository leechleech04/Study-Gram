const express = require('express');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const methodOverride = require('method-override');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');

require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(passport.initialize());
app.use(
  session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.session());

let db;
const url = process.env.MONGODB_URL;
new MongoClient(url)
  .connect()
  .then((client) => {
    console.log('DB is connected');
    db = client.db('studygram');
    app.listen(process.env.PORT, () => {
      console.log('App listening on port 8080.');
    });
  })
  .catch((err) => {
    console.log(err);
  });

app.get('/', (req, res) => {
  res.render('main');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/list/:page', async (req, res) => {
  let page = parseInt(req.params.page) || 1;
  const PAGE_SIZE = 5;
  const skip = (page - 1) * PAGE_SIZE;

  let result = await db
    .collection('post')
    .find()
    .skip(skip)
    .limit(PAGE_SIZE)
    .toArray();

  let totalPosts = await db.collection('post').countDocuments();

  const totalPages = Math.ceil(totalPosts / PAGE_SIZE);

  res.render('list', {
    result,
    currentPage: page,
    totalPages: totalPages,
  });
});

app.get('/write', (req, res) => {
  res.render('write');
});

app.post('/newcontent', async (req, res) => {
  try {
    if (req.body.title === '') {
      res.send('<h1>제목을 입력해주세요.</h1>');
      return;
    } else if (req.body.content === '') {
      res.send('<h1>내용을 입력해주세요.</h1>');
      return;
    } else {
      await db.collection('post').insertOne({
        title: req.body.title,
        content: req.body.content,
        user: 'user1',
        heart: 0,
      });
      res.redirect('/list/1');
    }
  } catch (e) {
    console.error(e);
    res.status(500).send('<h1>에러 발생</h1>');
  }
});

app.get('/detail/:id', async (req, res) => {
  try {
    let post = await db
      .collection('post')
      .findOne({ _id: new ObjectId(req.params.id) });
    if (post === null) {
      res.status(400).send('<h1>게시물이 존재하지 않습니다.</h1>');
    }
    res.render('detail', { post });
  } catch (e) {
    console.error(e);
    res.status(400).send('<h1>에러 발생</h1>');
  }
});

app.get('/edit/:id', async (req, res) => {
  try {
    let post = await db
      .collection('post')
      .findOne({ _id: new ObjectId(req.params.id) });
    if (post === null) {
      res.status(400).send('<h1>게시물이 존재하지 않습니다.</h1>');
    }
    res.render('edit', { post });
  } catch (e) {
    console.error(e);
    res.status(400).send('<h1>에러 발생</h1>');
  }
});

app.put('/editcontent', async (req, res) => {
  try {
    if (req.body.title === '') {
      res.send('<h1>제목을 입력해주세요.</h1>');
      return;
    } else if (req.body.content === '') {
      res.send('<h1>내용을 입력해주세요.</h1>');
      return;
    } else {
      await db
        .collection('post')
        .updateOne(
          { _id: new ObjectId(req.body.id) },
          { $set: { title: req.body.title, content: req.body.content } }
        );
      res.redirect('/list/1');
    }
  } catch (e) {
    console.error(e);
    res.status(500).send('<h1>에러 발생</h1>');
  }
});

app.delete('/delete/:id', async (req, res) => {
  try {
    await db.collection('post').deleteOne({ _id: new ObjectId(req.params.id) });
    res.redirect('/list/1');
  } catch (e) {
    console.error(e);
    res.status(500).send('<h1>에러 발생</h1>');
  }
});
