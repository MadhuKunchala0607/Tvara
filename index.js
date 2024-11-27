const express = require('express');
const mongoose = require('mongoose');
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

// MongoDB Connection (using Mongoose)
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Error connecting to MongoDB:', err));

// Product Schema
const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    category: String,
    shopkeeper: String,
    location: String,
    image: String
});

const Product = mongoose.model('Product', productSchema);

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

    // Create a new product document
    const newProduct = new Product({
        name,
        price,
        category,
        shopkeeper,
        location,
        image
    });

    newProduct.save((err) => {
        if (err) {
            console.error('Error saving product:', err);
            return res.status(500).send("Database error");
        }

        // Success response
        res.send(`<h1>Product Added Successfully!</h1><a href="/">Add Another Product</a>`);
    });
});

// GET Endpoint to Fetch Products
app.get('/items', (req, res) => {
    Product.find((err, products) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).send('Database error');
        }

        res.json(products);
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
