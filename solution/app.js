const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const ejs = require('ejs');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const fetch = require('node-fetch');



// Import routes
const productRoutes = require('./routes/products');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// Set up EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
});

// Data directory initialization
async function ensureDataDirExists() {
    const dataDir = path.join(__dirname, 'data');
    const productsFile = path.join(dataDir, 'products.json');

    try {
        await fs.mkdir(dataDir, { recursive: true });

        try {
            await fs.access(productsFile);
        } catch (err) {
            // If file doesn't exist, create it with initial data
            const initialData = {
                products: [
                    {
                        id: 1,
                        name: "Laptop Pro",
                        description: "Powerful laptop for professionals",
                        price: 1299.99,
                        category: "electronics"
                    },
                    {
                        id: 2,
                        name: "Smartphone X",
                        description: "Latest smartphone with advanced features",
                        price: 799.99,
                        category: "electronics"
                    },
                    {
                        id: 3,
                        name: "Coffee Maker",
                        description: "Automatic coffee maker with timer",
                        price: 49.99,
                        category: "home"
                    }
                ]
            };

            await fs.writeFile(productsFile, JSON.stringify(initialData, null, 2));
            console.log('Created initial products data file');
        }
    } catch (err) {
        console.error('Error ensuring data directory exists:', err);
        process.exit(1);
    }
}

// API Routes
app.use('/api/products', productRoutes);

// View Routes
app.get('/', (req, res) => {
    res.render('home', { title: 'Home' });
});

// Products list page
app.get('/products', async (req, res) => {
    try {
        const response = await fetch(`http://localhost:${port}/api/products`);
        const products = await response.json();
        res.render('products/index', {
            title: 'Products',
            products
        });
    } catch (err) {
        console.error('Error fetching products:', err);
        res.render('error', {
            title: 'Error',
            message: 'Failed to fetch products',
            status: 500
        });
    }
});

// New product form
app.get('/products/new', (req, res) => {
    res.render('products/form', {
        title: 'Add Product',
        product: null
    });
});

// Edit product form
app.get('/products/:id/edit', async (req, res) => {
    try {
        const response = await fetch(`http://localhost:${port}/api/products/${req.params.id}`);

        if (!response.ok) {
            throw new Error('Product not found');
        }

        const product = await response.json();

        res.render('products/form', {
            title: 'Edit Product',
            product
        });
    } catch (err) {
        res.render('error', {
            title: 'Error',
            message: err.message,
            status: 404
        });
    }
});

// View product details
app.get('/products/:id', async (req, res) => {
    try {
        const response = await fetch(`http://localhost:${port}/api/products/${req.params.id}`);

        if (!response.ok) {
            throw new Error('Product not found');
        }

        const product = await response.json();

        res.render('products/show', {
            title: product.name,
            product
        });
    } catch (err) {
        res.render('error', {
            title: 'Error',
            message: err.message,
            status: 404
        });
    }
});

// Create product (form submission)
app.post('/products', async (req, res) => {
    try {
        const response = await fetch(`http://localhost:${port}/api/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create product');
        }

        res.redirect('/products');
    } catch (err) {
        res.render('error', {
            title: 'Error',
            message: err.message,
            status: 400
        });
    }
});

// Update product (form submission)
app.post('/products/:id', async (req, res) => {
    try {
        const response = await fetch(`http://localhost:${port}/api/products/${req.params.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update product');
        }

        res.redirect(`/products/${req.params.id}`);
    } catch (err) {
        res.render('error', {
            title: 'Error',
            message: err.message,
            status: 400
        });
    }
});

//Q: Why does our 404 and error handlers need to come at the bottom?

// 404 handler
app.use((req, res, next) => {
    res.status(404).render('error', {
        title: '404 - Mean girl on the bus',
        message: 'Caint sit here fo-oh-fo',
        status: 404
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        title: 'Server Error',
        message: 'Something went wrong on the server',
        status: 500
    });
});

// Start the server
async function startServer() {
    await ensureDataDirExists();

    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
