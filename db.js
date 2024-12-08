const { MongoClient } = require('mongodb');

const url = process.env.MONGODB_URL;
let connectDB = new MongoClient(url).connect();

module.exports = connectDB;
