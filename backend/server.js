const express = require("express");
const pool = require("./db"); // Neon DB connection
const cors = require("cors"); 
const app = express();
const PORT = 5006;
 app.use(cors({ origin: ["http://localhost:3000",  "https://agrifiles-frontend.vercel.app","https://agrifiles-frontend-kdznzieed-agrifiles-projects.vercel.app/", "https://agrifiles-frontend-git-main-agrifiles-projects.vercel.app"] }));
 app.use(express.json());
 
 // for parsing JSON
// const allowedOrigins = [
//   'http://localhost:3000',
//   'https://agri-files.onrender.com'  // add any other frontends you use
// ];

// app.use(cors({
//   origin: function(origin, callback){
//     // allow requests with no origin (curl, mobile, server-to-server)
//     if (!origin) return callback(null, true);
//     if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
//     return callback(new Error('CORS policy: origin not allowed'));
//   },
//   methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
//   allowedHeaders: ['Content-Type','Authorization','X-Requested-With','Accept'],
//   credentials: true, // if you use cookies/auth; otherwise set false
// }));

// ensure preflight requests are handled immediately
//app.options('*', cors());

const authRoutes = require('./routes/auth');
const productsRouter = require('./routes/products');
const filesRouter = require('./routes/files');
const filesV2Router = require('./routes/files-v2');
const billsRouter = require('./routes/bills');
const companySettingsRouter = require('./routes/company-settings');
app.use('/api/files', filesRouter);
app.use('/api/v2/files', filesV2Router);  // New v2 routes under /files prefix
app.use('/auth', authRoutes);
app.use('/products', productsRouter);
app.use('/api/bills', billsRouter);  // Contains both /api/bills (v1) and /api/v2/bills (v2)
app.use('/api/v2/bills', billsRouter);  // Also register at v2 path for new endpoints
app.use('/api/company-settings', companySettingsRouter);


//app.use('/api/files', filesRouter);  

// Test route to check DB connection
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ serverTime: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database connection failed");
  }
});

// Insert test data route
app.post("/insert-test", async (req, res) => {
  try {
    const { name, value } = req.body; // get data from JSON body
    if (!name || value === undefined) {
      return res.status(400).json({ error: "Name and value are required" });
    }

    const result = await pool.query(
      "INSERT INTO playing_with_neon (name, value) VALUES ($1, $2) RETURNING *",
      [name, value]
    );

    res.json({ message: "Data inserted!", data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to insert data" });
  }
});

// Fetch all rows route
app.get("/all", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM playing_with_neon ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
