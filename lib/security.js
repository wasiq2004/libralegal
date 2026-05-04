const crypto = require('crypto');
const sanitizeHtml = require('sanitize-html');

function slugify(input) {
  return String(input || '')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generateToken(size = 32) {
  return crypto.randomBytes(size).toString('hex');
}

function issueCsrfToken(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateToken(24);
  }

  return req.session.csrfToken;
}

function verifyCsrf(req) {
  if (
    !req.session ||
    !req.session.csrfToken ||
    !req.body ||
    typeof req.body._csrf !== 'string'
  ) {
    return false;
  }

  const sessionToken = Buffer.from(req.session.csrfToken);
  const submittedToken = Buffer.from(req.body._csrf);

  if (sessionToken.length !== submittedToken.length) {
    return false;
  }

  return Boolean(
    crypto.timingSafeEqual(sessionToken, submittedToken)
  );
}

function sanitizeBlogHtml(html) {
  return sanitizeHtml(html || '', {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u', 'blockquote',
      'h2', 'h3', 'h4',
      'ul', 'ol', 'li',
      'a'
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer'
      }, true)
    }
  });
}

function stripHtml(input) {
  return sanitizeHtml(input || '', {
    allowedTags: [],
    allowedAttributes: {}
  }).trim();
}

function requireAuth(req, res, next) {
  if (!req.session || !req.session.adminUser) {
    return res.redirect('/admin');
  }

  return next();
}

module.exports = {
  generateToken,
  issueCsrfToken,
  verifyCsrf,
  slugify,
  sanitizeBlogHtml,
  stripHtml,
  requireAuth
};
