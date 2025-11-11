const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MongoDB connection URI
const uri =
  'mongodb+srv://BookHaverUser:IZcvWq8jX3XPEmGd@cluster0.4jfw6yd.mongodb.net/?appName=Cluster0';

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Root route
app.get('/', (req, res) => {
  res.send(' Book Haven server is running...');
});

async function run() {
  try {
    await client.connect();
    const db = client.db('sample_book');
    const books = db.collection('books');
    const userColl = db.collection('users');
    const comments = db.collection('comments');

    app.get('/books/:id/comments', async (req, res) => {
      try {
        const bookId = req.params.id;
        const result = await comments
          .find({ bookId })
          .sort({ createdAt: -1 })
          .toArray();
        res.send(result);
      } catch (err) {
        console.error('Error fetching comments:', err);
      }
    });

    app.post('/books/:id/comments', async (req, res) => {
      try {
        const bookId = req.params.id;
        const { name, photo, comment } = req.body;

        const newComment = {
          bookId,
          name,
          photo: photo || '',
          comment,
          createdAt: new Date(),
        };

        const result = await comments.insertOne(newComment);
        res.send({ message: 'Comment added', commentId: result.insertedId });
      } catch (err) {
        console.error('Error adding comment:', err);
      }
    });

    app.post('/books', async (req, res) => {
      try {
        const newBook = req.body;
        const result = await books.insertOne(newBook);
        res.send(result);
      } catch (err) {
        console.error('Error adding book:', err);
        res.status(500).send({ message: 'Failed to add book' });
      }
    });

    app.post('/users', async (req, res) => {
      try {
        const newUser = req.body;
        const email = newUser.email;

        const existingUser = await userColl.findOne({ email });
        if (existingUser) {
          res.send({
            message: 'User already exists. No need to insert again.',
          });
        } else {
          const result = await userColl.insertOne(newUser);
          res.send(result);
        }
      } catch (err) {
        console.error('Error adding user:', err);
        res.status(500).send({ message: 'Failed to add user' });
      }
    });

    app.get('/books', async (req, res) => {
      try {
        const email = req.query.email;
        const query = email ? { userEmail: email } : {};

        const cursor = books.find(query).sort({ rating: -1 });
        const result = await cursor.toArray();

        res.send(result);
      } catch (err) {
        console.error('Error fetching books:', err);
        res.status(500).send({ message: 'Failed to fetch books' });
      }
    });

    app.get('/recentBook', async (req, res) => {
      try {
        const limit = parseInt(req.query.limit) || 6;
        const cursor = books.find().sort({ _id: -1 }).limit(limit);
        const result = await cursor.toArray();

        res.send(result);
      } catch (err) {
        console.error('Error fetching recent books:', err);
        res.status(500).send({ message: 'Failed to fetch recent books' });
      }
    });

    app.get('/books/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const book = await books.findOne({ _id: new ObjectId(id) });
        res.send(book);
      } catch (err) {
        console.error('Error fetching book by ID:', err);
        res.status(500).send({ message: 'Failed to fetch book' });
      }
    });

    app.patch('/books/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const updatedBook = req.body;
        const result = await books.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedBook }
        );
        res.send(result);
      } catch (err) {
        console.error('Error updating book:', err);
        res.status(500).send({ message: 'Failed to update book' });
      }
    });

    app.delete('/books/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const result = await books.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (err) {
        console.error('Error deleting book:', err);
        res.status(500).send({ message: 'Failed to delete book' });
      }
    });

    await client.db('admin').command({ ping: 1 });
    console.log('✅ Connected successfully to MongoDB!');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`🚀 The Book Haven server running on port ${port}`);
});
