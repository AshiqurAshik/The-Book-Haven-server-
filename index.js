const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri =
  'mongodb+srv://BookHaverUser:IZcvWq8jX3XPEmGd@cluster0.4jfw6yd.mongodb.net/?appName=Cluster0';

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get('/', (req, res) => {
  res.send('Book Haven server is running...');
});

async function run() {
  try {
    await client.connect();
    const db = client.db('sample_book');
    const books = db.collection('books');

    app.post('/books', async (req, res) => {
      const newBook = req.body;
      const result = await books.insertOne(newBook);
      res.send(result);
    });

    app.get('/books', async (req, res) => {
      // const allBooks = await books.find().sort({ rating: -1 }).toArray();
      // res.send(allBooks);

      console.log(req.query);
      const email = req.query.email;
      const query = {};
      if (email) {
        query.userEmail = email;
      }

      const cursor = books.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/books/:id', async (req, res) => {
      const id = req.params.id;
      const book = await books.findOne({ _id: new ObjectId(id) });
      res.send(book);
    });

    app.patch('/books/:id', async (req, res) => {
      const id = req.params.id;
      const updatedBook = req.body;
      const result = await books.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedBook }
      );
      res.send(result);
    });

    app.delete('/books/:id', async (req, res) => {
      const id = req.params.id;
      const result = await books.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    await client.db('admin').command({ ping: 1 });
    console.log('Connected successfully to MongoDB!');
  } catch (err) {
    console.error('MongoDB connection failed:', err);
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`The Book Haven server running on port ${port}`);
});
