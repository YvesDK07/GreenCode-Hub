const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');

module.exports = function(db) {
  const router = express.Router();

  // GET /catalogue
  router.get('/catalogue', (req, res) => {
    const { category, language, sort } = req.query;
    let sql = `
      SELECT s.id, s.title, s.language, s.energy_score, s.complexity_time, s.created_at,
        c.name as category_name, u.username as author_name,
        (SELECT COUNT(*) FROM votes WHERE snippet_id = s.id) as vote_count
      FROM snippets s
      JOIN categories c ON s.category_id = c.id
      LEFT JOIN users u ON s.author_id = u.id
    `;
    const conditions = [];
    const params = [];

    if (category) {
      conditions.push('s.category_id = ?');
      params.push(category);
    }
    if (language) {
      conditions.push('LOWER(s.language) = LOWER(?)');
      params.push(language);
    }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');

    if (sort === 'votes') sql += ' ORDER BY vote_count DESC';
    else if (sort === 'score') sql += ' ORDER BY s.energy_score DESC';
    else sql += ' ORDER BY s.created_at DESC';

    const snippets = db.prepare(sql).all(...params);
    const categories = db.prepare('SELECT id, name FROM categories ORDER BY name').all();
    const languages = db.prepare('SELECT DISTINCT language FROM snippets ORDER BY language').all().map(r => r.language);

    res.render('catalogue', { snippets, categories, languages, filters: { category, language, sort } });
  });

  // GET /snippet/:id
  router.get('/snippet/:id', (req, res) => {
    const snippet = db.prepare(`
      SELECT s.id, s.title, s.language, s.energy_score, s.complexity_time, s.created_at,
        c.name as category_name, u.username as author_name,
        (SELECT COUNT(*) FROM votes WHERE snippet_id = s.id) as vote_count
      FROM snippets s
      JOIN categories c ON s.category_id = c.id
      LEFT JOIN users u ON s.author_id = u.id
      WHERE s.id = ?
    `).get(req.params.id);

    if (!snippet) return res.status(404).send('Snippet non trouvé');

    let userVoted = false;
    if (req.session.userId) {
      const vote = db.prepare('SELECT id FROM votes WHERE user_id = ? AND snippet_id = ?').get(req.session.userId, snippet.id);
      userVoted = !!vote;
    }

    res.render('snippet', { snippet, userVoted });
  });

  // GET /snippet/new
  router.get('/new', requireAuth, (req, res) => {
    const categories = db.prepare('SELECT id, name FROM categories ORDER BY name').all();
    res.render('new-snippet', { categories, error: null });
  });

  // POST /snippet/new
  router.post('/new', requireAuth, (req, res) => {
    const { title, language, code, category_id, complexity_time, complexity_space, energy_score } = req.body;
    if (!title || !language || !code || !category_id || !complexity_time || !energy_score) {
      const categories = db.prepare('SELECT id, name FROM categories ORDER BY name').all();
      return res.render('new-snippet', { categories, error: 'Tous les champs obligatoires doivent être remplis.' });
    }
    const result = db.prepare(`
      INSERT INTO snippets (title, language, code, category_id, complexity_time, complexity_space, energy_score, author_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, language, code, category_id, complexity_time, complexity_space || null, parseInt(energy_score), req.session.userId);

    res.redirect('/snippet/' + result.lastInsertRowid);
  });

  // GET /snippet/:id/edit
  router.get('/snippet/:id/edit', requireAuth, (req, res) => {
    const snippet = db.prepare('SELECT id, title, language, code, category_id, complexity_time, complexity_space, energy_score, author_id FROM snippets WHERE id = ?').get(req.params.id);
    if (!snippet) return res.status(404).send('Snippet non trouvé');
    if (snippet.author_id !== req.session.userId && req.session.role !== 'admin') {
      return res.status(403).send('Accès interdit');
    }
    const categories = db.prepare('SELECT id, name FROM categories ORDER BY name').all();
    res.render('edit-snippet', { snippet, categories, error: null });
  });

  // POST /snippet/:id/edit
  router.post('/snippet/:id/edit', requireAuth, (req, res) => {
    const snippet = db.prepare('SELECT id, title, language, code, category_id, complexity_time, complexity_space, energy_score, author_id FROM snippets WHERE id = ?').get(req.params.id);
    if (!snippet || (snippet.author_id !== req.session.userId && req.session.role !== 'admin')) {
      return res.status(403).send('Accès interdit');
    }
    const { title, language, code, category_id, complexity_time, complexity_space, energy_score } = req.body;
    db.prepare(`
      UPDATE snippets SET title=?, language=?, code=?, category_id=?, complexity_time=?, complexity_space=?, energy_score=?
      WHERE id=?
    `).run(title, language, code, category_id, complexity_time, complexity_space || null, parseInt(energy_score), req.params.id);

    res.redirect('/snippet/' + req.params.id);
  });

  // POST /snippet/:id/delete
  router.post('/snippet/:id/delete', requireAuth, (req, res) => {
    const snippet = db.prepare('SELECT id, title, language, code, category_id, complexity_time, complexity_space, energy_score, author_id FROM snippets WHERE id = ?').get(req.params.id);
    if (!snippet || (snippet.author_id !== req.session.userId && req.session.role !== 'admin')) {
      return res.status(403).send('Accès interdit');
    }
    db.prepare('DELETE FROM votes WHERE snippet_id = ?').run(req.params.id);
    db.prepare('DELETE FROM snippets WHERE id = ?').run(req.params.id);
    res.redirect('/catalogue');
  });

  // POST /snippet/:id/vote
  router.post('/snippet/:id/vote', requireAuth, (req, res) => {
    const existing = db.prepare('SELECT id FROM votes WHERE user_id = ? AND snippet_id = ?').get(req.session.userId, req.params.id);
    if (existing) {
      // Unvote
      db.prepare('DELETE FROM votes WHERE id = ?').run(existing.id);
    } else {
      db.prepare('INSERT INTO votes (user_id, snippet_id) VALUES (?, ?)').run(req.session.userId, req.params.id);
    }
    res.redirect('/snippet/' + req.params.id);
  });

  return router;
};
