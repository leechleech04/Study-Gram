const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();

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
  res.sendFile(path.join(__dirname + '/index.html'));
});
