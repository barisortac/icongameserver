const cors = require('cors')
const app = require('express')();
const bodyParser = require('body-parser');

app.use(bodyParser());

const corsOptions = {
  origin: 'https://icongame.vercel.app',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors(corsOptions))
// app.use(cors())

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "https://icongame.vercel.app");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Import Dependencies
const url = require('url')
const MongoClient = require('mongodb').MongoClient

// Create cached connection variable
let cachedDb = null

// A function for connecting to MongoDB,
// taking a single parameter of the connection string
async function connectToDatabase(uri) {
  // If the database connection is cached,
  // use it instead of creating a new connection
  if (cachedDb) {
    return cachedDb
  }

  try {
    // If no connection is cached, create a new one
    const client = await MongoClient.connect(uri, { useNewUrlParser: true })

    // Select the database through the connection,
    // using the database path of the connection string
    const db = await client.db(url.parse(uri).pathname.substr(1))

    // Cache the database connection and return the connection
    cachedDb = db
    return db
  } catch(err) {
    console.log("Error on db connection")
    console.log(err)
  }
}


app.get('/api/leaderboard',
  async (req, res) => {
    try {
      const db = await connectToDatabase(process.env.MONGODB_URI)
      const collection = await db.collection('leaderboard')
      const sort = { score: -1 };
      const leaderboard = await collection.find({}).sort(sort).toArray()
      res.status(200).json({ leaderboard })
    } catch(err) {
      console.log(err)
    }
  });


app.post('/api/leaderboard',
  async (req, res) => {
    try {
      const db = await connectToDatabase(process.env.MONGODB_URI)
      const collection = await db.collection('leaderboard')
      const {name, score} = req.body;
      const payload = { name: name, score: score };
      const addResult = await collection.insertOne(payload)
      cachedDb = null;
      res.status(200).json({ addResult })
    } catch(err) {
      console.log(err)
    }
  });

module.exports = app;


// The main, exported, function of the endpoint,
// dealing with the request and subsequent response
// module.exports = async (req, res) => {
//   try {
//     // Get a database connection, cached or otherwise,
//     // using the connection string environment variable as the argument
//     const db = await connectToDatabase(process.env.MONGODB_URI)
//
//     // Select the "users" collection from the database
//     const collection = await db.collection('leaderboard')
//
//     // Select the users collection from the database
//     const leaderboard = await collection.find({}).toArray()
//
//     // Respond with a JSON string of all users in the collection
//     res.status(200).json({ leaderboard })
//   } catch(err) {
//     console.log(err)
//   }
// }
