const express = require("express");
const pool = require("./db"); // Neon DB connection
const cors = require("cors"); 
const app = express();
const PORT = 5006;
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json()); // for parsing JSON

const authRoutes = require('./routes/auth');
const productsRouter = require('./routes/products');
app.use('/auth', authRoutes);
app.use('/products', productsRouter);


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
