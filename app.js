const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();

app.set('view engine', 'ejs');

app.use(express.static('public'));

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
  console.log(result);
  res.render('list', { result: result[0] });
});

app.get('/write', (req, res) => {
  res.render('write');
});

app.get('/detail', (req, res) => {
  res.render('detail');
});
