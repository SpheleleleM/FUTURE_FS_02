const db = require('./database');

const sampleLeads = [
  { name: 'Alice Johnson', email: 'alice@example.com', phone: '555-1234', source: 'website', status: 'new', notes: '' },
  { name: 'Bob Smith', email: 'bob@example.com', phone: '555-5678', source: 'referral', status: 'contacted', notes: 'Called on Monday, interested in the basic plan.' },
  { name: 'Carol White', email: 'carol@example.com', phone: '555-9999', source: 'social media', status: 'converted', notes: 'Signed up for the pro plan. Very happy!' }
];

db.serialize(() => {
  const stmt = db.prepare(`
    INSERT INTO leads (name, email, phone, source, status, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  sampleLeads.forEach(lead => {
    stmt.run(lead.name, lead.email, lead.phone, lead.source, lead.status, lead.notes);
  });

  stmt.finalize();
  console.log('Sample leads added successfully!');
});