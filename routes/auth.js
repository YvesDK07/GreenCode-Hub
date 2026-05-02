const express = require('express');
const bcrypt = require('bcryptjs');
const { requireAuth } = require('../middleware/auth');

module.exports = function(db) {
  const router = express.Router();

  // GET /register
  router.get('/register', (req, res) => {
    if (req.session.userId) return res.redirect('/');
    res.render('register', { error: null });
  });

  // POST /register
  router.post('/register', (req, res) => {
    const { username, email, password, password_confirm } = req.body;
    if (!username || !email || !password) {
      return res.render('register', { error: 'Tous les champs sont obligatoires.' });
    }
    if (password !== password_confirm) {
      return res.render('register', { error: 'Les mots de passe ne correspondent pas.' });
    }
    if (password.length < 6) {
      return res.render('register', { error: 'Le mot de passe doit faire au moins 6 caractères.' });
    }
    // Check uniqueness
    const exists = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (exists) {
      return res.render('register', { error: 'Ce nom d\'utilisateur ou email est déjà pris.' });
    }
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)').run(username, email, hash);
    req.session.userId = result.lastInsertRowid;
    req.session.role = 'user';
    res.redirect('/');
  });

  // GET /login
  router.get('/login', (req, res) => {
    if (req.session.userId) return res.redirect('/');
    res.render('login', { error: null });
  });

  // POST /login
  router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT id, email, password_hash, role FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.render('login', { error: 'Email ou mot de passe incorrect.' });
    }
    req.session.userId = user.id;
    req.session.role = user.role;
    res.redirect('/');
  });

  // GET /logout
  router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
  });

  // GET /profile
  router.get('/profile', requireAuth, (req, res) => {
    const user = db.prepare('SELECT id, username, email, password_hash, role, created_at FROM users WHERE id = ?').get(req.session.userId);
    const snippets = db.prepare(`
      SELECT s.id, s.title, s.language, s.created_at, c.name as category_name,
        (SELECT COUNT(*) FROM votes WHERE snippet_id = s.id) as vote_count
      FROM snippets s
      JOIN categories c ON s.category_id = c.id
      WHERE s.author_id = ?
      ORDER BY s.created_at DESC
    `).all(req.session.userId);
    const voteCount = db.prepare('SELECT COUNT(*) as c FROM votes WHERE user_id = ?').get(req.session.userId);
    res.render('profile', { profile: user, snippets, voteCount: voteCount.c, error: null, success: null });
  });

  // POST /profile
  router.post('/profile', requireAuth, (req, res) => {
    const { username, email, password, password_new } = req.body;
    const user = db.prepare('SELECT id, username, email, password_hash, role, created_at FROM users WHERE id = ?').get(req.session.userId);

    // Check current password
    if (!bcrypt.compareSync(password, user.password_hash)) {
      const snippets = db.prepare('SELECT s.id, s.title, s.language, c.name as category_name, (SELECT COUNT(*) FROM votes WHERE snippet_id = s.id) as vote_count FROM snippets s JOIN categories c ON s.category_id = c.id WHERE s.author_id = ? ORDER BY s.created_at DESC').all(req.session.userId);
      const voteCount = db.prepare('SELECT COUNT(*) as c FROM votes WHERE user_id = ?').get(req.session.userId);
      return res.render('profile', { profile: user, snippets, voteCount: voteCount.c, error: 'Mot de passe actuel incorrect.', success: null });
    }

    // Check uniqueness
    const dup = db.prepare('SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?').get(username, email, user.id);
    if (dup) {
      const snippets = db.prepare('SELECT s.id, s.title, s.language, c.name as category_name, (SELECT COUNT(*) FROM votes WHERE snippet_id = s.id) as vote_count FROM snippets s JOIN categories c ON s.category_id = c.id WHERE s.author_id = ? ORDER BY s.created_at DESC').all(req.session.userId);
      const voteCount = db.prepare('SELECT COUNT(*) as c FROM votes WHERE user_id = ?').get(req.session.userId);
      return res.render('profile', { profile: user, snippets, voteCount: voteCount.c, error: 'Nom d\'utilisateur ou email déjà pris.', success: null });
    }

    if (password_new && password_new.length >= 6) {
      const newHash = bcrypt.hashSync(password_new, 10);
      db.prepare('UPDATE users SET username = ?, email = ?, password_hash = ? WHERE id = ?').run(username, email, newHash, user.id);
    } else {
      db.prepare('UPDATE users SET username = ?, email = ? WHERE id = ?').run(username, email, user.id);
    }

    res.redirect('/profile');
  });

  // POST /profile/delete
  router.post('/profile/delete', requireAuth, (req, res) => {
    db.prepare('DELETE FROM votes WHERE user_id = ?').run(req.session.userId);
    // Set author to null-ish (keep snippets but anonymize)
    db.prepare('UPDATE snippets SET author_id = 0 WHERE author_id = ?').run(req.session.userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(req.session.userId);
    req.session.destroy();
    res.redirect('/');
  });

  return router;
};
