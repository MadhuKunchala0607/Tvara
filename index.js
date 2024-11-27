const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const app = express();

// Use the environment variable for PORT or default to 3000 for local dev
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); 

// Configure Multer for File Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads'); 
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName); 
    }
});
const upload = multer({ storage });

// MySQL Connection (using environment variables for production)
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',    // Change these as needed
    user: process.env.DB_USER || 'root',        // Set in Render dashboard
    password: process.env.DB_PASSWORD || 'madhu',// Set in Render dashboard
    database: process.env.DB_NAME || 'tvarapick'// Set in Render dashboard
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'form.html'));
});

// POST Endpoint to Add a Product with Image
app.post('/products', upload.single('image'), (req, res) => {
    const { name, price, category, shopkeeper, location } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null; // Get image path

    // Validate required fields
    if (!name || !price || !category || !shopkeeper || !location) {
        return res.status(400).send("All fields are required!");
    }

    const query = `INSERT INTO products (name, price, category, shopkeeper, location, image) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [name, price, category, shopkeeper, location, image];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error inserting product:', err);
            return res.status(500).send("Database error");
        }

        // Success response
        res.send(`<h1>Product Added Successfully!</h1><a href="/">Add Another Product</a>`);
    });
});

// GET Endpoint to Fetch Products
app.get('/items', (req, res) => {
    const query = 'SELECT * FROM products';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).send('Database error');
        }

        res.json(results);
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
