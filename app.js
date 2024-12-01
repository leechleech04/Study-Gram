const express = require('express');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const methodOverride = require('method-override');

const app = express();

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

let db;
const url =
  'mongodb+srv://lch2023:aa**895623@cluster0.y9ddq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
new MongoClient(url)
  .connect()
  .then((client) => {
    console.log('DB is connected');
    db = client.db('studygram');
    app.listen(8080, () => {
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

// app.get('/list/prev/:id', async (req, res) => {
//   let result = await db
//     .collection('post')
//     .find({ _id: { $lt: new ObjectId(req.params.id) } })
//     .sort({ _id: -1 })
//     .limit(5)
//     .toArray();
//   result.reverse();
//   res.render('list', { result });
// });

// app.get('/list/next/:id', async (req, res) => {
//   let result = await db
//     .collection('post')
//     .find({ _id: { $gt: new ObjectId(req.params.id) } })
//     .limit(5)
//     .toArray();
//   res.render('list', { result });
// });

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
