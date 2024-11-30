const express = require('express');
const path = require('path');

const app = express();
app.listen(8080, () => {
  console.log('App listening on port 8080.');
});

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
});
