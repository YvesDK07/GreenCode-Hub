const express = require('express');
const session = require('express-session');
const path = require('path');
const initDB = require('./db/init');
const { injectUser } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

async function start() {
  const db = await initDB();

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.urlencoded({ extended: true }));
  app.use(session({
    secret: 'greencode-hub-ti616-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
  }));
  app.use(injectUser(db));

  // Save DB on each write request
  app.use((req, res, next) => {
    const origEnd = res.end;
    res.end = function(...args) {
      if (['POST'].includes(req.method)) db.save();
      origEnd.apply(this, args);
    };
    next();
  });

  app.use('/', require('./routes/auth')(db));
  app.use('/', require('./routes/snippets')(db));

  app.get('/', (req, res) => {
    const popular = db.prepare(`
      SELECT s.id, s.title, s.language, s.energy_score, s.complexity_time, s.created_at,
        c.name as category_name, u.username as author_name,
        (SELECT COUNT(*) FROM votes WHERE snippet_id = s.id) as vote_count
      FROM snippets s JOIN categories c ON s.category_id = c.id
      LEFT JOIN users u ON s.author_id = u.id
      ORDER BY vote_count DESC, s.created_at DESC LIMIT 6
    `).all();
    const stats = {
      snippets: db.prepare('SELECT COUNT(*) as c FROM snippets').get().c,
      users: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
      votes: db.prepare('SELECT COUNT(*) as c FROM votes').get().c,
    };
    res.render('index', { popular, stats });
  });

  app.get('/about', (req, res) => res.render('about'));

  app.listen(PORT, () => {
    console.log(`\n  GreenCode Hub`);
    console.log(`  http://localhost:${PORT}\n`);
    console.log(`  Admin: admin@greencode.hub / admin123\n`);
  });
}

start().catch(err => { console.error('Erreur au demarrage:', err); process.exit(1); });
