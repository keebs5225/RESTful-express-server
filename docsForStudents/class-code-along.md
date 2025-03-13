# RESTful API Server Implementation: Code-Along Exercise
## First. Let's Norse it up
Yggdrasil and the Nine Realms provides a great analogy for considering best practices in RESTful API development. We will be building our own Yggdrasil(s) (Express server) that connects various realms (resources) through standardized pathways (routes). Our frontend interfaces will serve as Heimdall's observatory, allowing our users to traverse these paths and interact with the different realms through a managed gateway.

Resources as distinct entities (the realms)
Hierarchical organization (the structure of the tree)
Connected through standardized paths (branches and roots)
Central infrastructure providing access to all resources (the tree itself)

This story provides an exceptional metaphor for RESTful API architecture. The World Tree represents your Express server, while each realm corresponds to a resource endpoint in your API. Just as travelers would follow specific paths along Yggdrasil to reach different realms, clients make requests to specific URL endpoints to access different data resources.
The structured nature of the Nine Realms mirrors how RESTful APIs organize resources into logical collections. The story also captures how these distinct resources exist as separate entities (realms) while remaining part of an interconnected system (the tree). This duality perfectly represents how RESTful resources are both independent and related.
Furthermore, the frontend interface you're building would represent Heimdall's observatory, Himinbjörg, which provides a managed gateway for accessing the various realms through the bridge Bifröst.

## Overview

This code-along exercise guides students through implementing a complete RESTful API server using Express.js. The exercise builds upon the concepts introduced in class and walks through each step of creating the server components required for the homework assignment.

## Learning Objectives
By the end of this exercise, students will be able to:
- Set up a structured Express.js project
- Implement CRUD operations for a resource
  Q: What is CRUD?
- Create file-based data persistence
- Serve static files and implement view templates
- Add custom middleware for logging and error handling
- Document API endpoints

## Prerequisites
- Node.js installed (version 14+)
- Basic understanding of JavaScript and HTTP
- Text editor or IDE
- Terminal/command line access
- Postman or similar tool for API testing

## Project Setup
### Step 1: Initialize the Project
Create a clone of your Express server repo and/or project directory (I'd highly recommend making a separate repo for this):
Now, install the required dependencies in the new project directory:

```
npm install express ejs
```

### Step 2: Create the Project Structure

Create the following directory structure (many of these will already be present from you express-0server):

```
project-root/
├── app.js             # Main application file
├── package.json       # Project configuration
├── public/            # Static files
│   ├── css/           # Stylesheets
│   │   └── style.css
│   └── js/            # Client-side JavaScript
│       └── main.js
├── data/              # Data storage
│   └── products.json
├── routes/            # Route handlers
│   └── products.js
└── views/             # View templates
    ├── layouts/
    │   └── main.ejs
    ├── products/
    │   ├── index.ejs
    │   ├── show.ejs
    │   └── form.ejs
    └── error.ejs
```
#### What are these ejs nonsense files?
First of all, how dare you. Nonsense?

## Data Persistence Implementation
### Step 3: Create Initial Data and Storage Module
First, add some initial product data to `data/products.json`. Teh examples below are for structure only! Make your own dang products!

```json
{
  "products": [
    {
      "id": 1,
      "name": "Laptop Pro",
      "description": "Powerful laptop for professionals",
      "price": 1299.99,
      "category": "electronics"
    },
    {
      "id": 2,
      "name": "Smartphone X",
      "description": "Latest smartphone with advanced features",
      "price": 799.99,
      "category": "electronics"
    },
    {
      "id": 3,
      "name": "Coffee Maker",
      "description": "Automatic coffee maker with timer",
      "price": 49.99,
      "category": "home"
    }
  ]
}
```

Now, create a data access module to handle file operations. Create a new file `models/productModel.js`:

```javascript
const fs = require('fs').promises;
const path = require('path');

const dataFile = path.join(__dirname, '../data/products.json');

// Get all products
async function getAllProducts() {
  try {
    const data = await fs.readFile(dataFile, 'utf8');
    return JSON.parse(data).products;
  } catch (err) {
    if (err.code === 'ENOENT') {
      // If file doesn't exist, return empty array
      return [];
    }
    throw err;
  }
}

// Get a single product by ID
async function getProductById(id) {
  const products = await getAllProducts();
  return products.find(product => product.id === parseInt(id));
}

// Create a new product
async function createProduct(product) {
  const products = await getAllProducts();
  
  // Generate new ID (max ID + 1)
  const newId = products.length > 0 
    ? Math.max(...products.map(p => p.id)) + 1 
    : 1;
  
  const newProduct = { id: newId, ...product };
  products.push(newProduct);
  
  await fs.writeFile(
    dataFile, 
    JSON.stringify({ products }, null, 2)
  );
  
  return newProduct;
}

// Update an existing product
async function updateProduct(id, updatedProduct) {
  const products = await getAllProducts();
  const index = products.findIndex(product => product.id === parseInt(id));
  
  if (index === -1) return null;
  
  products[index] = { ...products[index], ...updatedProduct };
  
  await fs.writeFile(
    dataFile, 
    JSON.stringify({ products }, null, 2)
  );
  
  return products[index];
}

// Delete a product
async function deleteProduct(id) {
  const products = await getAllProducts();
  const index = products.findIndex(product => product.id === parseInt(id));
  
  if (index === -1) return false;
  
  products.splice(index, 1);
  
  await fs.writeFile(
    dataFile, 
    JSON.stringify({ products }, null, 2)
  );
  
  return true;
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
```

*Ensure you create the models directory.*

## API Routes Implementation
### Step 4: Create the Product Routes

Edit the `routes/products.js` file to implement the RESTful API endpoints:

```javascript
const express = require('express');
const router = express.Router();
const productModel = require('../models/productModel');

// Middleware for validating product input
const validateProduct = (req, res, next) => {
  const { name, price, category } = req.body;
  const errors = [];

  if (!name || name.trim() === '') {
    errors.push('Product name is required');
  }

  if (!price || isNaN(price) || price <= 0) {
    errors.push('Product price must be a positive number');
  }

  if (!category || category.trim() === '') {
    errors.push('Product category is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

// GET all products
router.get('/', async (req, res) => {
  try {
    const products = await productModel.getAllProducts();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

// GET a single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await productModel.getProductById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve product' });
  }
});

// POST create a new product
router.post('/', validateProduct, async (req, res) => {
  try {
    const newProduct = await productModel.createProduct(req.body);
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT update a product
router.put('/:id', validateProduct, async (req, res) => {
  try {
    const updatedProduct = await productModel.updateProduct(req.params.id, req.body);
    
    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE a product
router.delete('/:id', async (req, res) => {
  try {
    const success = await productModel.deleteProduct(req.params.id);
    
    if (!success) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
```

## View Templates Implementation
### Step 5: Create View Templates

First, let's create a layout template in `views/layouts/main.ejs`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Product Management System</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <header>
    <nav>
      <div class="container">
        <h1>Product Management System</h1>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/products">Products</a></li>
          <li><a href="/products/new">Add Product</a></li>
        </ul>
      </div>
    </nav>
  </header>
  
  <main class="container">
    <%- body %>
  </main>
  
  <footer>
    <div class="container">
      <p>&copy; 2025 Product API Demo</p>
    </div>
  </footer>
  
  <script src="/js/main.js"></script>
</body>
</html>
```

Create the products list template in `views/products/index.ejs`:

```html
<section class="products-list">
  <h2>Products List</h2>
  
  <div class="filters">
    <input type="text" id="search" placeholder="Search products...">
    <select id="category-filter">
      <option value="">All Categories</option>
      <option value="electronics">Electronics</option>
      <option value="home">Home</option>
      <option value="clothing">Clothing</option>
    </select>
  </div>
  
  <div class="products-grid">
    <% products.forEach(product => { %>
      <div class="product-card">
        <h3><%= product.name %></h3>
        <p class="price">$<%= product.price.toFixed(2) %></p>
        <p class="category"><%= product.category %></p>
        <p class="description"><%= product.description %></p>
        <div class="actions">
          <a href="/products/<%= product.id %>" class="btn view-btn">View</a>
          <a href="/products/<%= product.id %>/edit" class="btn edit-btn">Edit</a>
          <button class="btn delete-btn" data-id="<%= product.id %>">Delete</button>
        </div>
      </div>
    <% }) %>
  </div>
</section>
```

Create the product detail template in `views/products/show.ejs`:

```html
<section class="product-details">
  <h2><%= product.name %></h2>
  
  <div class="product-info">
    <p class="price">Price: $<%= product.price.toFixed(2) %></p>
    <p class="category">Category: <%= product.category %></p>
    <p class="description"><%= product.description %></p>
  </div>
  
  <div class="actions">
    <a href="/products" class="btn">Back to Products</a>
    <a href="/products/<%= product.id %>/edit" class="btn edit-btn">Edit</a>
    <button class="btn delete-btn" data-id="<%= product.id %>">Delete</button>
  </div>
</section>
```

Create the product form template in `views/products/form.ejs`:

```html
<section class="product-form">
  <h2><%= product ? 'Edit Product' : 'Add New Product' %></h2>
  
  <form id="productForm" method="POST" action="<%= product ? `/products/${product.id}?_method=PUT` : '/products' %>">
    <div class="form-group">
      <label for="name">Product Name</label>
      <input type="text" id="name" name="name" value="<%= product ? product.name : '' %>" required>
    </div>
    
    <div class="form-group">
      <label for="price">Price ($)</label>
      <input type="number" id="price" name="price" step="0.01" min="0" value="<%= product ? product.price : '' %>" required>
    </div>
    
    <div class="form-group">
      <label for="category">Category</label>
      <select id="category" name="category" required>
        <option value="">Select a category</option>
        <option value="electronics" <%= product && product.category === 'electronics' ? 'selected' : '' %>>Electronics</option>
        <option value="home" <%= product && product.category === 'home' ? 'selected' : '' %>>Home</option>
        <option value="clothing" <%= product && product.category === 'clothing' ? 'selected' : '' %>>Clothing</option>
      </select>
    </div>
    
    <div class="form-group">
      <label for="description">Description</label>
      <textarea id="description" name="description" rows="4"><%= product ? product.description : '' %></textarea>
    </div>
    
    <button type="submit" class="btn submit-btn"><%= product ? 'Update Product' : 'Add Product' %></button>
    <a href="/products" class="btn cancel-btn">Cancel</a>
  </form>
</section>
```

Create an error page template in `views/error.ejs`:

```html
<section class="error-page">
  <h2>Error</h2>
  <div class="error-message">
    <p><%= message || 'An error occurred' %></p>
    <% if (status) { %>
      <p>Status: <%= status %></p>
    <% } %>
  </div>
  <a href="/" class="btn">Return to Home</a>
</section>
```

## Static Files Setup (10 minutes)
### Step 6: Create CSS and Client-Side JavaScript

Add basic styling in `public/css/style.css`:

```css
/*a catchall like the bit below allows us to reset from anything that may have been present. Likely non-functional on 99% of use, but good for that 1 percent.*/
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f4f4f4;
}

.container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Header */
header {
  background-color: #333;
  color: #fff;
  padding: 1rem 0;
}

nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

nav h1 {
  font-size: 1.5rem;
}

nav ul {
  display: flex;
  list-style: none;
}

nav ul li {
  margin-left: 1rem;
}

nav a {
  color: #fff;
  text-decoration: none;
  padding: 0.5rem;
}

nav a:hover {
  color: #ddd;
}

/* Main Content */
main {
  padding: 2rem 0;
}

section {
  background: #fff;
  padding: 1.5rem;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

h2 {
  margin-bottom: 1.5rem;
  color: #333;
}

/* Products Grid */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.product-card {
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 1rem;
  transition: transform 0.3s ease;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.product-card h3 {
  margin-bottom: 0.5rem;
}

.price {
  font-weight: bold;
  color: #e63946;
  margin-bottom: 0.5rem;
}

.category {
  background: #f1faee;
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  margin-bottom: 0.5rem;
}

.description {
  color: #666;
  margin-bottom: 1rem;
}

/* Buttons and Forms */
.btn {
  display: inline-block;
  background: #333;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  margin-right: 0.5rem;
  border-radius: 3px;
  cursor: pointer;
  text-decoration: none;
  font-size: 1rem;
  font-family: inherit;
}

.view-btn {
  background: #457b9d;
}

.edit-btn {
  background: #2a9d8f;
}

.delete-btn {
  background: #e63946;
}

.btn:hover {
  opacity: 0.9;
}

.filters {
  display: flex;
  margin-bottom: 1.5rem;
}

.filters input, .filters select {
  padding: 0.5rem;
  margin-right: 1rem;
  border: 1px solid #ddd;
  border-radius: 3px;
}

/* Forms */
.form-group {
  margin-bottom: 1.2rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 1rem;
}

/* Footer */
footer {
  background: #333;
  color: #fff;
  text-align: center;
  padding: 1rem 0;
  margin-top: 2rem;
}
```

Add client-side JavaScript in `public/js/main.js`:

```javascript
document.addEventListener('DOMContentLoaded', () => {
  // Handle delete buttons
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const productId = e.target.dataset.id;
      
      if (confirm('Are you sure you want to delete this product?')) {
        try {
          const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            // Redirect to products list or remove from DOM
            if (window.location.pathname === '/products') {
              // Remove from DOM if on list page
              const productCard = e.target.closest('.product-card');
              productCard.remove();
            } else {
              // Redirect if on detail page
              window.location.href = '/products';
            }
          } else {
            alert('Failed to delete the product');
          }
        } catch (err) {
          console.error('Error:', err);
          alert('An error occurred while deleting the product');
        }
      }
    });
  });
  
  // Handle search functionality
  const searchInput = document.getElementById('search');
  if (searchInput) {
    searchInput.addEventListener('input', filterProducts);
  }
  
  // Handle category filter
  const categoryFilter = document.getElementById('category-filter');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', filterProducts);
  }
  
  function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value.toLowerCase();
    
    document.querySelectorAll('.product-card').forEach(product => {
      const name = product.querySelector('h3').textContent.toLowerCase();
      const productCategory = product.querySelector('.category').textContent.toLowerCase();
      const matchesSearch = name.includes(searchTerm);
      const matchesCategory = !category || productCategory.includes(category);
      
      if (matchesSearch && matchesCategory) {
        product.style.display = 'block';
      } else {
        product.style.display = 'none';
      }
    });
  }
  
  // Handle form submission with validation
  const productForm = document.getElementById('productForm');
  if (productForm) {
    productForm.addEventListener('submit', function(e) {
      const nameInput = document.getElementById('name');
      const priceInput = document.getElementById('price');
      const categoryInput = document.getElementById('category');
      
      let isValid = true;
      let errorMessage = '';
      
      if (!nameInput.value.trim()) {
        isValid = false;
        errorMessage += 'Product name is required\n';
      }
      
      if (!priceInput.value || isNaN(priceInput.value) || Number(priceInput.value) <= 0) {
        isValid = false;
        errorMessage += 'Price must be a positive number\n';
      }
      
      if (!categoryInput.value) {
        isValid = false;
        errorMessage += 'Please select a category\n';
      }
      
      if (!isValid) {
        e.preventDefault();
        alert(errorMessage);
      }
    });
  }
});
```

## Main Application Setup (15 minutes)
### Step 7: Create the Main Application File

Now, create the main application file `app.js`:

```javascript
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const ejs = require('ejs');
const expressLayouts = require('express-ejs-layouts');

// Import routes
const productRoutes = require('./routes/products');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

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
```

Install additional dependencies:
```
npm install express-ejs-layouts
```

Create a home page template in `views/home.ejs`:
```html
<section class="home-hero">
  <h2>Welcome to the Product Management System</h2>
  <p>This was built in an Advanced Web Programming Class by a very [insert compliment] student.</p>
  
  <div class="actions">
    <a href="/products" class="btn view-btn">View Products</a>
    <a href="/products/new" class="btn">Add New Product</a>
  </div>
</section>

<section class="features">
  <h3>Features</h3>
  <ul>
    <li>Complete CRUD operations for products</li>
    <li>File-based data persistence</li>
    <li>API endpoints for integration</li>
    <li>Responsive frontend interface</li>
    <li>Input validation and error handling</li>
  </ul>
</section>
```

## API Endpoints

| Method | Endpoint             | Description               | Request Body                                |
|--------|----------------------|---------------------------|---------------------------------------------|
| OPTIONS| /api/products        | Show all methods          | N/A                                         |
| GET    | /api/products        | Get all products          | N/A                                         |
| GET    | /api/products/:id    | Get a specific product    | N/A                                         |
| POST   | /api/products        | Create a new product      | {name, description, price, category}        |
| PUT    | /api/products/:id    | Update a product          | {name, description, price, category}        |
| PATCH  | /api/products/:id    | Update only specified keys| {insert specifc key-value pairs to update}  | 
| DELETE | /api/products/:id    | Delete a product          | N/A                                         |

## Web Routes

| Method | Endpoint             | Description               |
|--------|----------------------|---------------------------|
| GET    | /                    | Home page                 |
| GET    | /products            | View all products         |
| GET    | /products/new        | Form to create new product|
| GET    | /products/:id        | View a specific product   |
| GET    | /products/:id/edit   | Form to edit a product    |
| POST   | /products            | Submit new product form   |
| POST   | /products/:id        | Submit product edit form  |

## Project Structure

```
project-root/
├── app.js                 # Main application file
├── package.json           # Project configuration
├── public/                # Static files
│   ├── css/               # Stylesheets
│   │   └── style.css
│   └── js/                # Client-side JavaScript
│       └── main.js
├── data/                  # Data storage
│   └── products.json
├── models/                # Data models
│   └── productModel.js
├── routes/                # Route handlers
│   └── products.js
└── views/                 # View templates
    ├── layouts/
    │   └── main.ejs
    ├── products/
    │   ├── index.ejs
    │   ├── show.ejs
    │   └── form.ejs
    ├── home.ejs
    └── error.ejs
```
## Final Steps and Review
### Step 10: Add Method-Override for PUT/DELETE Requests

Since HTML forms *only support GET and POST methods natively*, we'll add method-override to enable PUT and DELETE requests from forms:

```
npm install method-override
```

Update `app.js` to include method-override:

```javascript
const methodOverride = require('method-override');

// Add this after the other middleware
app.use(methodOverride('_method'));
```

Update the form in `views/products/form.ejs`:

```html
<form id="productForm" method="POST" action="<%= product ? `/products/${product.id}?_method=PUT` : '/products' %>">
```

### Step 11: Final Review and Testing

1. Ensure all routes are working correctly
2. Test the frontend interface
3. Validate that data persistence works
4. Check that error handling is functioning properly
5. Verify that the application styles are applied correctly

### Submission Guidelines

For your homework submission:

1. Turn in your repo URL to D2L.

## Troubleshooting Common Issues
### Error: Cannot find module
If you encounter a "Cannot find module" error, make sure you have installed all required dependencies:
```
npm install express ejs express-ejs-layouts method-override
```

### Error: ENOENT: no such file or directory
If you encounter file not found errors, double-check your file paths and ensure all directories exist. The `ensureDataDirExists` function should handle creating the data directory, but verify it's working correctly.

### Port already in use
If port 3000 is already in use, change the port number in `app.js` or kill the process using that port:
```
// On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

// On macOS/Linux
lsof -i :3000
kill -9 <PID>
```

### Routes not matching
If your routes aren't matching as expected, check the order of your route definitions. Express processes routes in the order they are defined, so more specific routes should come before more general ones. Build in some console.logs in your express-server to log the method and parsed url. This generally reveals the problem.

### Data not persisting
If data isn't being saved correctly, check for errors in the file operations and ensure write permissions to the data directory.
