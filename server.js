const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/photographyEventDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Booking = mongoose.model('Booking', {
  name: String,
  email: String,
  date: String,
  message: String,
});

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));

// Image upload setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// === Routes ===
app.post('/api/book', async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();
    res.send({ success: true });
  } catch (err) {
    res.status(500).send({ error: 'Failed to save booking' });
  }
});

app.post('/api/upload-image', upload.single('image'), (req, res) => {
  try {
    res.send({ imageUrl: `/uploads/${req.file.filename}` });
  } catch (err) {
    res.status(500).send({ error: 'Image upload failed' });
  }
});

app.get('/admin/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ date: -1 });
    let html = \`
      <h1>All Bookings</h1>
      <table border="1" cellpadding="10">
        <tr><th>Name</th><th>Email</th><th>Date</th><th>Message</th></tr>
        \${bookings.map(b => \`<tr><td>\${b.name}</td><td>\${b.email}</td><td>\${b.date}</td><td>\${b.message}</td></tr>\`).join('')}
      </table>
      <p><a href="/">Back to Site</a></p>
    \`;
    res.send(html);
  } catch (err) {
    res.status(500).send('Error fetching bookings');
  }
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(\`Server started on http://localhost:\${PORT}\`));
