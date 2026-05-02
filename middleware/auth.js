// Middleware: require login
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

// Middleware: require admin
function requireAdmin(req, res, next) {
  if (!req.session.userId || req.session.role !== 'admin') {
    return res.status(403).send('Accès interdit');
  }
  next();
}

// Middleware: inject user into all views
function injectUser(db) {
  return (req, res, next) => {
    res.locals.user = null;
    if (req.session.userId) {
      res.locals.user = db.prepare('SELECT id, username, email, role FROM users WHERE id = ?').get(req.session.userId);
    }
    next();
  };
}

module.exports = { requireAuth, requireAdmin, injectUser };
