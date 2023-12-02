const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
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
    const userCollection = client.db("gotripDB").collection("users");
    const wishListCollection = client.db("gotripDB").collection("wishLists");
    const bookingCollection = client.db("gotripDB").collection("bookings");

    // jwt related apis
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });
    // middlewares
    const verifyToken = (req, res, next) => {
      console.log("inside verify token", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "forbidden access" });
      }
      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({message: 'forbidden access'})
        }
        req.decoded = decoded;
        next();
      })
    };

    // package related apis
    app.get("/packages", async (req, res) => {
      const result = await packageCollection.find().toArray();
      res.send(result);
    });

    app.post("/packages", async (req, res) => {
      const item = req.body;
      const result = await packageCollection.insertOne(item);
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

    // user related apis

    app.get("/users", verifyToken, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      // insert email if user doesnt exist
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists" });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    // user admin api
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // stories related apis
    app.get("/stories", async (req, res) => {
      const result = await storiesCollection.find().toArray();
      res.send(result);
    });
    app.get("/stories/:id", async (req, res) => {
      const storyId = req.params.id;
      const objectId = new ObjectId(storyId);
      const result = await storiesCollection.findOne({ _id: objectId });
      res.send(result);
    });

    app.post("/stories", async (req, res) => {
      const story = req.body;
      const result = await storiesCollection.insertOne(story);
      res.send(result);
    });

    // wishlist related apis
    app.post("/wishlists", async (req, res) => {
      const wishList = req.body;
      const result = await wishListCollection.insertOne(wishList);
      res.send(result);
    });
    app.get("/wishlists", async (req, res) => {
      const email = req.query.email;
      const query = { userEmail: email };
      const result = await wishListCollection.find(query).toArray();
      res.json(result);
    });

    app.delete("/wishlists/:id", async (req, res) => {
      const wishlistId = req.params.id;
      const result = await wishListCollection.deleteOne({ _id: wishlistId });
      res.send(result);
    });

    // bookings related apis
    app.post("/bookings", async (req, res) => {
      const bookings = req.body;
      const result = await bookingCollection.insertOne(bookings);
      res.send(result);
    });

    app.get("/bookings", async (req, res) => {
      const email = req.query.email;
      const query = { userEmail: email };
      const result = await bookingCollection.find(query).toArray();
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
