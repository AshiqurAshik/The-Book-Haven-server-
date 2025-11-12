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
  res.send('📚 Book Haven server is running...');
});

async function run() {
  try {
    await client.connect();
    const db = client.db('sample_book');
    const books = db.collection('books');
    const userColl = db.collection('users');
    const comments = db.collection('comments');

    // Get comments for a book
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
        res.status(500).send({ message: 'Failed to fetch comments' });
      }
    });

    // Add a comment to a book
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
        res.status(500).send({ message: 'Failed to add comment' });
      }
    });

    // Add a new book
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

    // Add a new user
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

    // Get all books (optionally by email)
    app.get('/books', async (req, res) => {
      try {
        const email = req.query.email;
        const query = email ? { userEmail: email } : {};

        const result = await books.find(query).sort({ rating: -1 }).toArray();
        res.send(result);
      } catch (err) {
        console.error('Error fetching books:', err);
        res.status(500).send({ message: 'Failed to fetch books' });
      }
    });

    // Get recent books
    app.get('/recentBook', async (req, res) => {
      try {
        const limit = parseInt(req.query.limit) || 3;
        const result = await books
          .find()
          .sort({ _id: -1 })
          .limit(limit)
          .toArray();
        res.send(result);
      } catch (err) {
        console.error('Error fetching recent books:', err);
        res.status(500).send({ message: 'Failed to fetch recent books' });
      }
    });

    // Get book by ID
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

    // Get books by email
    app.get('/books/by-email/:email', async (req, res) => {
      try {
        const email = req.params.email;
        const result = await books.find({ userEmail: email }).toArray();
        res.send(result);
      } catch (err) {
        console.error('Error fetching books by email:', err);
        res.status(500).send({ message: 'Failed to fetch books by email' });
      }
    });

    // Get books by genre (case-insensitive)
    app.get('/home/genre/:genre', async (req, res) => {
      try {
        const genreParam = req.params.genre;
        const limit = parseInt(req.query.limit) || 6;

        const result = await books
          .find({ genre: { $regex: `^${genreParam}$`, $options: 'i' } })
          .sort({ _id: -1 })
          .limit(limit)
          .toArray();

        res.send(result);
      } catch (err) {
        console.error('Error fetching books by genre:', err);
        res.status(500).send({ message: 'Failed to fetch books by genre' });
      }
    });

    // Update book by ID
    app.patch('/books/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const updatedFields = req.body;

        if (Object.keys(updatedFields).length === 0) {
          return res.status(400).send({ message: 'No fields to update' });
        }

        const result = await books.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedFields }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: 'Book not found' });
        }

        res.send({
          message: 'Book updated successfully',
          modifiedCount: result.modifiedCount,
        });
      } catch (err) {
        console.error('Error updating book:', err);
        res.status(500).send({ message: 'Failed to update book' });
      }
    });

    // Delete book by ID
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
