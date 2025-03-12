/**
 * Import the Express.js framework
 * Q: What is Express.js and why use it instead of plain Node.js?
 * A: Express is a minimal, flexible Node.js web application framework that provides
 *    a robust set of features for web and mobile applications. It abstracts away
 *    many of the complexities of the raw Node.js HTTP module, making it easier to
 *    create routes, handle requests, and manage middleware.
 */
const express = require('express');

/**
 * Create an Express application instance
 * Q: What does this line do and why is it necessary?
 * A: This creates a new Express application object that we'll use to configure
 *    our server and define routes. It's the core object in any Express application
 *    that provides methods for routing HTTP requests, configuring middleware, etc.
 */
const app = express();

/**
 * Define the port number for the server to listen on
 * Q: Why might we want to use a variable for the port instead of hardcoding it?
 * A: Using a variable allows for flexibility - we can easily change it in one place,
 *    and it enables us to use environment variables (like process.env.PORT) when
 *    deploying to cloud platforms that assign their own ports. It also enables us to use
 *    it as a string to communicate state like in the console.log that prints the IP/Port.
 */
const port = 3001;

/**
 * Express Middleware: Static File Serving
 * This middleware serves static files from the 'public' directory
 * 
 * Q: What are static files and why do we need this middleware?
 * A: Static files are client-side files like HTML, CSS, JavaScript, images, etc.,
 *    that don't change based on request parameters. This middleware automatically
 *    serves these files when requested, allowing us to build a complete frontend
 *    without additional route handlers.
 * 
 * Q: How would a client access a file in the public folder?
 * A: If there's a file at public/css/style.css, it would be accessible at 
 *    http://localhost:3001/css/style.css
 */
app.use(express.static('public'));

/**
 * Express Middleware: JSON Body Parser
 * This middleware parses incoming JSON requests and puts the parsed data in req.body
 * 
 * Q: What does this middleware do and why is it important?
 * A: It automatically parses JSON data sent in request bodies (like in POST/PUT requests)
 *    and makes it available as a JavaScript object in req.body. Without this middleware,
 *    we'd have to manually parse JSON from the request stream.
 * 
 * Note: The comment above this line in the original code mentions checking 'main',
 * but that's actually unrelated to the express.json() middleware.
 */
app.use(express.json());

/**
 * Custom Logging Middleware
 * This middleware logs information about every incoming request
 * 
 * Q: What is middleware in Express and how does it work?
 * A: Middleware functions are functions that have access to the request object (req),
 *    the response object (res), and the next middleware function in the application's
 *    request-response cycle. They can execute code, modify req and res objects,
 *    end the request-response cycle, or call the next middleware.
 * 
 * Q: Why is the next() function call important here?
 * A: Without calling next(), the request processing would stop at this middleware
 *    and never reach the route handlers or other middleware. next() passes control
 *    to the next middleware in the stack.
 */
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

/**
 * Route Handler: About Page
 * Responds to GET requests to the /about path with a simple text message
 * 
 * Q: What is a route in Express?
 * A: A route defines how an application responds to a client request to a specific
 *    endpoint, which is a URI (or path) and a specific HTTP request method (GET, POST, etc.).
 *    Each route can have one or more handler functions that are executed when the route is matched.
 * 
 * Q: What does app.get() do specifically?
 * A: app.get() registers a route handler for HTTP GET requests to the specified path.
 *    Similarly, app.post(), app.put(), etc. handle other HTTP methods.
 */
app.get('/about', (req, res) => {
  res.send('About Us: We are learning to build web servers!');
});

/**
 * API Route: List Users
 * Returns a JSON array of user objects when a GET request is made to /api/users
 * 
 * Q: What does res.json() do differently from res.send()?
 * A: res.json() automatically sets the Content-Type header to application/json
 *    and converts the JavaScript object into a JSON string. While res.send() can also
 *    send JSON, res.json() is more explicit about the intent to send JSON data.
 * 
 * Q: What is a RESTful API and how does this route reflect REST principles?
 * A: REST (Representational State Transfer) is an architectural style for designing
 *    networked applications. This route follows REST by using a GET method to retrieve
 *    a collection of resources (users) at a logical endpoint (/api/users).
 */
app.get('/api/users', (req, res) => {
  res.json({
    users: [
      { id: 0, name: 'Tashfeen' },
      { id: 1, name: 'Reed' },
      { id: 2, name: 'Maxwell' },
      { id: 3, name: 'Anga' }
    ]
  });
});

/**
 * API Route: Handle POST Data
 * Accepts JSON data sent to /api/data and responds with a success message
 * 
 * Q: What is the difference between GET and POST methods?
 * A: GET requests are primarily for retrieving data, while POST requests are for
 *    submitting data to be processed. POST requests typically include a request body
 *    with the data being submitted, while GET requests typically don't have a body.
 * 
 * Q: What does status(201) indicate?
 * A: HTTP status code 201 means "Created" - it indicates that the request has been
 *    fulfilled and has resulted in a new resource being created. It's the appropriate
 *    response for successful POST requests that create new resources.
 */
app.post('/api/data', (req, res) => {
  res.status(201).json({
    message: 'Data received successfully',
    data: req.body
  });
});

/**
 * API Route: Products Endpoint
 * Returns an empty JSON object for GET requests to /api/products
 * 
 * Q: Why might we have an endpoint that returns an empty object?
 * A: This is where we will place the logic for our RESTful API server
 * 
 * Q: What does status(200) indicate?
 * A: HTTP status code 200 means "OK" - it's the standard success response for
 *    HTTP requests. While Express defaults to status 200 for successful responses,
 *    setting it explicitly can make the code more readable and self-documenting.
 */
app.get('/api/products', (req, res) => {
  res.status(200).json({
  })
})

/**
 * Route with URL Parameters: Get User by ID
 * Demonstrates how to capture and use dynamic segments in the URL path
 * 
 * Q: What are URL parameters and how do they work in Express?
 * A: URL parameters are named segments in the URL path that are used to capture values
 *    specified at their position in the URL. They're defined by prefixing a colon to the
 *    parameter name in the route path (like :id) and are accessible via req.params.
 * 
 * Q: How would a client access this endpoint with a specific user ID?
 * A: To get user with ID 42, the client would request: GET http://localhost:3001/api/users/42
 */
app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  res.json({
    user: { id: userId, name: `User ${userId}` }
  });
});

/**
 * Route with Query Parameters: Search
 * Demonstrates how to access query string parameters in the URL
 * 
 * Q: What's the difference between URL parameters and query parameters?
 * A: URL parameters are part of the path structure (like /users/:id), while
 *    query parameters come after the ? in a URL (like /search?q=term&limit=10).
 *    URL parameters are typically used for identifying specific resources,
 *    while query parameters are used for filtering, sorting, or pagination.
 * 
 * Q: How would a client make a search request with this endpoint?
 * A: They would request: GET http://localhost:3001/search?q=express
 *    This would return: "Search results for: express"
 */
app.get('/search', (req, res) => {
  const query = req.query.q || 'No search term provided';
  res.send(`Search results for: ${query}`);
});

/**
 * 404 Handler Middleware
 * Catches any requests that don't match the defined routes
 * 
 * Q: Why must this be the last route defined?
 * A: Express processes routes in the order they're defined. If this catch-all
 *    middleware were placed earlier, it would intercept requests before they
 *    could reach routes defined after it, essentially making those routes unreachable.
 * 
 * Q: What's the difference between app.get() and app.use() for defining routes?
 * A: app.get() (and app.post(), etc.) match specific HTTP methods and paths.
 *    app.use() matches any HTTP method, making it suitable for middleware that
 *    should run for all requests or for catch-all handlers like this 404 handler.
 */
app.use((req, res) => {
  res.status(404).send('404 - Not Found');
});

/**
 * Start the Server
 * Begins listening for incoming HTTP requests on the specified port
 * 
 * Q: What does the listen() method do?
 * A: It binds and listens for connections on the specified host and port.
 *    This effectively starts the web server, making it ready to accept incoming
 *    HTTP requests from clients.
 * 
 * Q: What is the purpose of the callback function passed to listen()?
 * A: The callback function runs once the server has started successfully.
 *    It's commonly used to log a message indicating that the server is running,
 *    which is helpful for developers during development and troubleshooting.
 *    Another good reason to why we used a variable for the port number.
 */
app.listen(port, () => {
  console.log(`Express server running at http://localhost:${port}/`);
});