const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middlewares

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o2yungw.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const packageCollection = client.db("gotripDB").collection("packages");
    const storiesCollection = client.db("gotripDB").collection("stories");

    // package related apis
    app.get("/packages", async (req, res) => {
      const result = await packageCollection.find().toArray();
      res.send(result);
    });

    app.get("/packages/:id", async (req, res) => {
      const packageId = req.params.id;
      const objectId = new ObjectId(packageId);
      const result = await packageCollection.findOne({ _id: objectId });
      res.send(result);
    });
    app.get("/packages/tourType/:tourType", async (req, res) => {
      const tourType = req.params.tourType;
      const query = { tourType };
      const result = await packageCollection.find(query).toArray();
      res.send(result);
    });

    // stories related apis
    app.post("/stories", async (req, res) => {
      const story = req.body;
      const result = await storiesCollection.insertOne(story);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Gotrip is running");
});
app.listen(port, () => {
  console.log(`Gotrip is running on port ${port}`);
});
