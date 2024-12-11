const express = require('express');
const app = express();
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const methodOverride = require('method-override');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const MongoStore = require('connect-mongo');
const { createServer } = require('http');
const { Server } = require('socket.io');
const server = createServer(app);
const io = new Server(server);
const sharedsession = require('express-socket.io-session');

require('dotenv').config();

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
const sessionMiddleware = session({
  secret: process.env.COOKIE_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 60 * 60 * 1000,
  },
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URL,
    dbName: 'studygram',
  }),
});
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

let connectDB = require('./db.js');
let db;
connectDB
  .then((client) => {
    console.log('DB is connected');
    db = client.db('studygram');
    server.listen(process.env.PORT, () => {
      console.log('App listening on port 8080.');
    });
  })
  .catch((err) => {
    console.log(err);
  });

passport.use(
  new LocalStrategy(async (inputId, inputPw, cb) => {
    try {
      let result = await db.collection('user').findOne({ username: inputId });
      if (!result) {
        return cb(null, false, { message: 'id' });
      }
      if (await bcrypt.compare(inputPw, result.password)) {
        return cb(null, result);
      } else {
        return cb(null, false, { message: 'pw' });
      }
    } catch (e) {
      console.error(e);
      res.status(500).send('<h1>에러 발생</h1>');
    }
  })
);

passport.serializeUser((user, done) => {
  process.nextTick(() => {
    done(null, { id: user._id, username: user.username });
  });
});

passport.deserializeUser(async (user, done) => {
  let result = await db
    .collection('user')
    .findOne({ _id: new ObjectId(user.id) });
  delete result.password;
  process.nextTick(() => {
    done(null, result);
  });
});

app.get('/', (req, res) => {
  console.log(req.user);
  res.render('main', { user: req.user ? req.user : null });
});

app.get('/login', (req, res) => {
  console.log(req.user);
  res.render('login', { msg: '' });
});

app.get('/list/:page', async (req, res) => {
  let page = parseInt(req.params.page) || 1;
  const PAGE_SIZE = 5;
  const skip = (page - 1) * PAGE_SIZE;

  let result = await db
    .collection('post')
    .find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(PAGE_SIZE)
    .toArray();

  let totalPosts = await db.collection('post').countDocuments();

  const totalPages = Math.ceil(totalPosts / PAGE_SIZE);

  res.render('list', {
    result,
    currentPage: page,
    totalPages: totalPages,
    user: req.user ? req.user : null,
  });
});

app.get('/write', (req, res) => {
  if (req.user) {
    res.render('write', { user: req.user });
  } else {
    res.redirect('/login');
  }
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
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
      const kr_time_diff = 9 * 60 * 60 * 1000;
      let result = await db.collection('post').insertOne({
        title: req.body.title,
        content: req.body.content,
        user: req.user.username,
        heart: 0,
        createdAt: new Date(utc + kr_time_diff),
      });
      res.redirect(`/detail/${result.insertedId}`);
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
    let comments = await db
      .collection('comment')
      .find({ parentId: new ObjectId(req.params.id) })
      .sort({ createdAt: -1 })
      .toArray();
    let heart = false;
    if (req.user) {
      heart = (await db.collection('heart').findOne({
        username: req.user.username,
        postId: new ObjectId(req.params.id),
      }))
        ? true
        : false;
    }
    if (post === null) {
      res.status(400).send('<h1>게시물이 존재하지 않습니다.</h1>');
    }
    res.render('detail', {
      post,
      user: req.user ? req.user : null,
      comments,
      heart,
    });
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
    res.render('edit', { post, user: req.user });
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
      res.redirect(`/detail/${req.body.id}`);
    }
  } catch (e) {
    console.error(e);
    res.status(500).send('<h1>에러 발생</h1>');
  }
});

app.delete('/delete/:id', async (req, res) => {
  try {
    await db.collection('post').deleteOne({ _id: new ObjectId(req.params.id) });
    await db
      .collection('comment')
      .deleteMany({ parentId: new ObjectId(req.params.id) });
    await db
      .collection('heart')
      .deleteMany({ postId: new ObjectId(req.params.id) });
    res.redirect('/list/1');
  } catch (e) {
    console.error(e);
    res.status(500).send('<h1>에러 발생</h1>');
  }
});

app.post('/login', async (req, res, next) => {
  passport.authenticate('local', (error, user, info) => {
    if (error) {
      return res.status(500).json(error);
    }
    if (!user) {
      return res.render('login', { msg: info.message });
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      res.redirect('/');
    });
  })(req, res, next);
});

app.get('/mypage', (req, res) => {
  if (req.user) {
    res.render('mypage', {
      user: req.user,
      password: req.user.password,
    });
  } else {
    res.redirect('/login');
  }
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  let hash = await bcrypt.hash(req.body.password, 10);
  if (await db.collection('user').findOne({ username: req.body.username })) {
    res.send('<h1>이미 존재하는 사용자입니다.</h1>');
  } else {
    await db.collection('user').insertOne({
      username: req.body.username,
      password: hash,
    });
    res.redirect('/login');
  }
});

app.get('/checkDuplication/:username', async (req, res) => {
  let result = await db
    .collection('user')
    .findOne({ username: req.params.username });
  if (result) {
    res.json({ valid: false });
  } else {
    res.json({ valid: true });
  }
});

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

app.post('/comment/:id', async (req, res) => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const kr_time_diff = 9 * 60 * 60 * 1000;
  let post = await db
    .collection('post')
    .findOne({ _id: new ObjectId(req.params.id) });
  await db.collection('comment').insertOne({
    parentId: new ObjectId(req.params.id),
    user: req.user.username,
    content: req.body.comment,
    createdAt: new Date(utc + kr_time_diff),
  });
  res.redirect(`/detail/${req.params.id}`);
});

app.put('/put-comment/:id', async (req, res) => {
  let comment = await db.collection('comment').findOne({
    _id: new ObjectId(req.params.id),
  });
  await db
    .collection('comment')
    .updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { content: req.body.put_comment } }
    );
  res.redirect(`/detail/${comment.parentId}`);
});

app.delete('/delete-comment/:id', async (req, res) => {
  let comment = await db
    .collection('comment')
    .deleteOne({ _id: new ObjectId(req.params.id) });
  res.json({ result: comment.acknowledged });
});

app.post('/heart/:id', async (req, res) => {
  let result;
  if (
    await db.collection('heart').findOne({
      postId: new ObjectId(req.params.id),
      username: req.user.username,
    })
  ) {
    result = false;
  } else {
    await db.collection('heart').insertOne({
      username: req.user.username,
      postId: new ObjectId(req.params.id),
    });
    await db.collection('post').updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $inc: { heart: 1 },
      }
    );
    result = true;
  }
  res.json({ result, num: parseInt(req.body.num) + 1 });
});

app.delete('/delete-heart/:id', async (req, res) => {
  let result;
  if (
    await db
      .collection('heart')
      .findOne({ postId: new ObjectId(req.params.id) })
  ) {
    await db.collection('heart').deleteOne({
      username: req.user.username,
      postId: new ObjectId(req.params.id),
    });
    await db
      .collection('post')
      .updateOne({ _id: new ObjectId(req.params.id) }, { $inc: { heart: -1 } });
    result = true;
  } else {
    result = false;
  }
  res.json({ result, num: parseInt(req.body.num) - 1 });
});
