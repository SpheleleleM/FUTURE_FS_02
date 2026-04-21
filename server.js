const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const db = require('./database');
const path = require('path');

const app = express();
const PORT = 3000;

const ADMINS = [
  { username: 'Sphelele Mvubu', password: bcrypt.hashSync('594908', 10) },
  { username: 'Sbahle Gumede', password: bcrypt.hashSync('153508', 10) },
];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: 'crm-secret-key',
  resave: false,
  saveUninitialized: false
}));

function requireLogin(req, res, next) {
  if (req.session.isLoggedIn) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
}

// ─── AUTH ROUTES ────────────────────────────────────────────

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  const admin = ADMINS.find(a => a.username === username);

  if (!admin) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const passwordMatch = await bcrypt.compare(password, admin.password);

  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  req.session.isLoggedIn = true;
  req.session.adminName = username;
  res.json({ success: true });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth-status', (req, res) => {
  res.json({ isLoggedIn: !!req.session.isLoggedIn });
});

// ─── LEADS ROUTES ────────────────────────────────────────────

app.delete('/api/leads/:id', requireLogin, (req, res) => {
  db.run('DELETE FROM leads WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/leads/public', (req, res) => {
  const { name, email, phone, source, notes } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  db.run(
    `INSERT INTO leads (name, email, phone, source, status, notes)
     VALUES (?, ?, ?, ?, 'new', ?)`,
    [name, email, phone || '', source || 'website', notes || ''],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.get('/api/leads', requireLogin, (req, res) => {
  db.all('SELECT * FROM leads ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/leads/:id', requireLogin, (req, res) => {
  db.get('SELECT * FROM leads WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Lead not found' });
    res.json(row);
  });
});

app.post('/api/leads', requireLogin, (req, res) => {
  const { name, email, phone, source, status, notes } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  db.run(
    `INSERT INTO leads (name, email, phone, source, status, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, email, phone, source || 'website', status || 'new', notes || ''],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, success: true });
    }
  );
});

app.put('/api/leads/:id', requireLogin, (req, res) => {
  const { status, notes } = req.body;

  db.run(
    `UPDATE leads SET status = ?, notes = ? WHERE id = ?`,
    [status, notes, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// ─── START SERVER ────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`CRM server running at http://localhost:${PORT}`);
});