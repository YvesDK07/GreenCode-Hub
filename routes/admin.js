const express = require('express');
const { requireAdmin } = require('../middleware/auth');

module.exports = function(db) {
  const router = express.Router();

  // ============ Dashboard ============

  // GET /admin
  router.get('/admin', requireAdmin, (req, res) => {
    const stats = {
      users: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
      admins: db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'admin'").get().c,
      snippets: db.prepare('SELECT COUNT(*) as c FROM snippets').get().c,
      categories: db.prepare('SELECT COUNT(*) as c FROM categories').get().c,
      votes: db.prepare('SELECT COUNT(*) as c FROM votes').get().c,
    };
    res.render('admin', { stats });
  });

  // ============ Gestion utilisateurs ============

  // GET /admin/users (paginated, max 20 per page)
  router.get('/admin/users', requireAdmin, (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = 20;
    const offset = (page - 1) * perPage;

    const total = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    const users = db.prepare(`
      SELECT id, username, email, role, created_at,
        (SELECT COUNT(*) FROM snippets WHERE author_id = users.id) as snippet_count,
        (SELECT COUNT(*) FROM votes WHERE user_id = users.id) as vote_count
      FROM users
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(perPage, offset);

    const totalPages = Math.max(1, Math.ceil(total / perPage));
    res.render('admin-users', {
      users, page, totalPages, total,
      currentUserId: req.session.userId,
      error: null, success: null,
    });
  });

  // POST /admin/users/:id/role  (toggle user/admin)
  router.post('/admin/users/:id/role', requireAdmin, (req, res) => {
    const targetId = parseInt(req.params.id);
    const target = db.prepare('SELECT id, role FROM users WHERE id = ?').get(targetId);

    if (!target) return res.status(404).send('Utilisateur non trouvé');

    // Cannot change own role (self-demotion lockout)
    if (targetId === req.session.userId) {
      return res.redirect('/admin/users?err=self');
    }

    const newRole = target.role === 'admin' ? 'user' : 'admin';

    // If demoting an admin, ensure at least one admin remains
    if (target.role === 'admin' && newRole === 'user') {
      const adminCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'admin'").get().c;
      if (adminCount <= 1) {
        return res.redirect('/admin/users?err=lastadmin');
      }
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(newRole, targetId);
    res.redirect('/admin/users?ok=role');
  });

  // POST /admin/users/:id/delete
  router.post('/admin/users/:id/delete', requireAdmin, (req, res) => {
    const targetId = parseInt(req.params.id);
    const target = db.prepare('SELECT id, role FROM users WHERE id = ?').get(targetId);

    if (!target) return res.status(404).send('Utilisateur non trouvé');

    // Cannot delete self
    if (targetId === req.session.userId) {
      return res.redirect('/admin/users?err=self');
    }

    // Cannot delete the last admin
    if (target.role === 'admin') {
      const adminCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'admin'").get().c;
      if (adminCount <= 1) {
        return res.redirect('/admin/users?err=lastadmin');
      }
    }

    // Anonymize snippets, remove votes, then delete user
    db.prepare('DELETE FROM votes WHERE user_id = ?').run(targetId);
    db.prepare('UPDATE snippets SET author_id = 0 WHERE author_id = ?').run(targetId);
    db.prepare('DELETE FROM users WHERE id = ?').run(targetId);

    res.redirect('/admin/users?ok=del');
  });

  // ============ Gestion catégories ============

  // GET /admin/categories
  router.get('/admin/categories', requireAdmin, (req, res) => {
    const categories = db.prepare(`
      SELECT id, name, description,
        (SELECT COUNT(*) FROM snippets WHERE category_id = categories.id) as snippet_count
      FROM categories
      ORDER BY name
    `).all();
    res.render('admin-categories', {
      categories,
      error: null,
      success: null,
      editing: null,
    });
  });

  // POST /admin/categories  (create)
  router.post('/admin/categories', requireAdmin, (req, res) => {
    const { name, description } = req.body;
    if (!name || name.trim().length === 0) {
      return renderCategoriesWith(res, db, { error: 'Le nom de la catégorie est obligatoire.' });
    }
    const exists = db.prepare('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)').get(name.trim());
    if (exists) {
      return renderCategoriesWith(res, db, { error: 'Cette catégorie existe déjà.' });
    }
    db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)').run(name.trim(), description || '');
    res.redirect('/admin/categories?ok=create');
  });

  // POST /admin/categories/:id/edit
  router.post('/admin/categories/:id/edit', requireAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    const { name, description } = req.body;
    if (!name || name.trim().length === 0) {
      return renderCategoriesWith(res, db, { error: 'Le nom de la catégorie est obligatoire.' });
    }
    const cat = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
    if (!cat) return res.status(404).send('Catégorie non trouvée');

    const dup = db.prepare('SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id != ?').get(name.trim(), id);
    if (dup) {
      return renderCategoriesWith(res, db, { error: 'Une autre catégorie porte déjà ce nom.' });
    }
    db.prepare('UPDATE categories SET name = ?, description = ? WHERE id = ?').run(name.trim(), description || '', id);
    res.redirect('/admin/categories?ok=edit');
  });

  // POST /admin/categories/:id/delete
  router.post('/admin/categories/:id/delete', requireAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    const cat = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
    if (!cat) return res.status(404).send('Catégorie non trouvée');

    // Cannot delete a category that still contains snippets
    const used = db.prepare('SELECT COUNT(*) as c FROM snippets WHERE category_id = ?').get(id).c;
    if (used > 0) {
      return renderCategoriesWith(res, db, {
        error: `Impossible de supprimer : ${used} snippet(s) utilisent encore cette catégorie.`
      });
    }
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    res.redirect('/admin/categories?ok=del');
  });

  return router;
};

// Helper: re-render categories page with an error message
function renderCategoriesWith(res, db, opts) {
  const categories = db.prepare(`
    SELECT id, name, description,
      (SELECT COUNT(*) FROM snippets WHERE category_id = categories.id) as snippet_count
    FROM categories
    ORDER BY name
  `).all();
  res.render('admin-categories', {
    categories,
    error: opts.error || null,
    success: opts.success || null,
    editing: opts.editing || null,
  });
}
