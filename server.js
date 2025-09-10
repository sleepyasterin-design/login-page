// const express = require("express");
// const cors = require("cors");
// const fs = require("fs");
// const path = require("path");
// const bcryptjs = require("bcryptjs");
// const jwt = require("jsonwebtoken");

// const app = express();
// const PORT = 3000;
// const SECRET = "super_secret_key";
// const USERS_FILE = path.join(__dirname, "user.json");

// // middlewares
// app.use(cors());
// app.use(express.json());
// app.use(express.static("public"));
// app.use(express.static(path.join(__dirname, "public")));
// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "index.html"));
// });
// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "index1.html"));
// });
// /*app.listen(PORT, () => console.log(`🚀 Running at http://localhost:${PORT}`))
//    .on('error', err => {
//        if(err.code === 'EADDRINUSE') {
//            console.log(`⚠️ Port ${PORT} is busy. Try another port.`);
//        } else {
//            console.error(err);
//        }
//    });
// */
// app.use((req, res, next) => {
//   const log = {
//     time: new Date().toISOString(),
//     ip: req.ip,
//     path: req.originalUrl,
//     method: req.method,
//   };

//   // save logs in a file
//   const logFile = path.join(__dirname, "visits.json");
//   let logs = [];
//   if (fs.existsSync(logFile)) {
//     logs = JSON.parse(fs.readFileSync(logFile, "utf8"));
//   }
//   logs.push(log);
//   fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));

//   console.log("👀 Visitor:", log);
//   next();
// });

// // helpers
// function getUsers() {
//   if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]");
//   return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
// }
// function saveUsers(users) {
//   fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
// }

// // register
// app.post("/register", async (req, res) => {
//   const { username, email, password } = req.body;
//   if (!username || !email || !password) {
//     return res.status(400).json({ message: "All fields required" });
//   }

//   const users = getUsers();
//   if (users.find(u => u.username === username || u.email === email)) {
//     return res.status(400).json({ message: "User already exists" });
//   }

//   const hashed = await bcryptjs.hash(password, 10);
//   users.push({ username, email, password: hashed });
//   saveUsers(users);

//   res.json({ message: "✅ Registered successfully" });
// });

// // login
// app.post("/login", async (req, res) => {
//   const { username, password } = req.body;
//   if (!username || !password) {
//     return res.status(400).json({ message: "All fields required" });
//   }

//   const users = getUsers();
//   const user = users.find(u => u.username === username || u.email === username);
//   if (!user) return res.status(401).json({ message: "Invalid credentials" });

//   const match = await bcryptjs.compare(password, user.password);
//   if (!match) return res.status(401).json({ message: "Invalid credentials" });

//   const token = jwt.sign({ username: user.username }, SECRET, { expiresIn: "1h" });
//   res.json({ message: "✅ Login successful", token });
// });

// app.listen(PORT, () => console.log(`🚀 Running at http://localhost:${PORT}`));
const express = require("express");
const cors = require("cors");
const path = require("path");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./firebase"); // <-- using Firebase now!

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = "super_secret_key";

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// logging visits
app.use(async (req, res, next) => {
  const log = {
    time: new Date().toISOString(),
    ip: req.ip,
    path: req.originalUrl,
    method: req.method,
  };

  try {
    await db.collection("visits").add(log);
    console.log("👀 Visitor:", log);
  } catch (e) {
    console.error("Failed to log visit:", e);
  }

  next();
});

// register route
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    const existing = await db
      .collection("users")
      .where("username", "==", username)
      .get();

    if (!existing.empty) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcryptjs.hash(password, 10);
    await db.collection("users").add({ username, email, password: hashed });

    res.json({ message: "✅ Registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef
      .where("username", "==", username)
      .get();

    if (snapshot.empty) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    const match = await bcryptjs.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ username: user.username }, SECRET, { expiresIn: "1h" });

    // optional: log login
    await db.collection("visits").add({
      username,
      action: "login",
      timestamp: new Date()
    });

    res.json({ message: "✅ Login successful", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// run server
app.listen(PORT, () => console.log(`🚀 Running at http://localhost:${PORT}`));
