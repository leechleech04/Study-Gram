const express = require('express');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const methodOverride = require('method-override');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const MongoStore = require('connect-mongo');

require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(
  session({
    secret: process.env.COOKIE_SECRET,
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
  })
);
app.use(passport.initialize());
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
  res.render('main', { username: req.user ? req.user.username : null });
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
    .skip(skip)
    .limit(PAGE_SIZE)
    .toArray();

  let totalPosts = await db.collection('post').countDocuments();

  const totalPages = Math.ceil(totalPosts / PAGE_SIZE);

  res.render('list', {
    result,
    currentPage: page,
    totalPages: totalPages,
    username: req.user ? req.user.username : null,
  });
});

app.get('/write', (req, res) => {
  if (req.user) {
    res.render('write', { username: req.user.username });
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
      await db.collection('post').insertOne({
        title: req.body.title,
        content: req.body.content,
        user: req.user.username,
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
    let comments = await db
      .collection('comment')
      .find({ parentId: new ObjectId(req.params.id) })
      .toArray();
    if (post === null) {
      res.status(400).send('<h1>게시물이 존재하지 않습니다.</h1>');
    }
    res.render('detail', {
      post,
      username: req.user ? req.user.username : null,
      comments,
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
    res.render('edit', { post, username: req.user.username });
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
    res.render('mypage', { username: req.user.username });
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
    res.redirect('/');
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
  let post = await db
    .collection('post')
    .findOne({ _id: new ObjectId(req.params.id) });
  await db.collection('comment').insertOne({
    parentId: new ObjectId(req.params.id),
    user: req.user.username,
    content: req.body.comment,
  });
  res.redirect(`/detail/${req.params.id}`);
});
