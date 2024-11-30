const express = require('express');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.get('/list', async (req, res) => {
  let result = await db.collection('post').find().toArray();
  res.render('list', { result });
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
      res.redirect('/list');
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

// app.put('/heart/add', async (req, res) => {
//   await db
//     .collection('post')
//     .updateOne({ _id: new ObjectId(req.body.id) }, { $inc: { heart: 1 } });
//   res.json({ heart: req.body.heart + 1 });
// });

// app.put('/heart/remove', async (req, res) => {
//   await db
//     .collection('post')
//     .updateOne({ _id: new ObjectId(req.body.id) }, { $inc: { heart: -1 } });
//   res.json({ heart: req.body.heart - 1 });
// });
