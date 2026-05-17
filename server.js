const path = require('path');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const express = require('express');
const session = require('express-session');
const MySQLStoreFactory = require('express-mysql-session');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

dotenv.config();

const { getPool, query } = require('./lib/db');
const {
  createBlogPost,
  deleteBlogPost,
  getAllBlogsForAdmin,
  getBlogById,
  getPublishedBlogBySlug,
  getPublishedBlogs,
  updateBlogPost
} = require('./lib/blogs');
const {
  getHomepageContent,
  getHomepageContentForAdmin,
  updateHomepageContent
} = require('./lib/homepage');
const {
  createServicePage,
  deleteServicePage,
  getAllServicesForAdmin,
  getPublishedServices,
  getServiceById,
  updateServicePage
} = require('./lib/services');
const {
  issueCsrfToken,
  requireAuth,
  verifyCsrf
} = require('./lib/security');

const app = express();
const ROOT = __dirname;
const MySQLStore = MySQLStoreFactory(session);
const translationCache = new Map();
const shouldUseMySqlSessions =
  process.env.NODE_ENV === 'production' &&
  process.env.MYSQL_HOST &&
  process.env.MYSQL_DATABASE &&
  process.env.MYSQL_USER;

const sessionStore = shouldUseMySqlSessions
  ? new MySQLStore({
      schema: {
        tableName: 'cms_sessions',
        columnNames: {
          session_id: 'session_id',
          expires: 'expires',
          data: 'data'
        }
      },
      createDatabaseTable: false
    }, getPool())
  : undefined;

app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(ROOT, 'views'));

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://translate.google.com', 'https://translate.googleapis.com'],
      connectSrc: ["'self'", 'https://translate.googleapis.com', 'https://translate.google.com', 'https://api.web3forms.com'],
      frameSrc: ["'self'", 'https://translate.google.com', 'https://translate.googleapis.com', 'https://www.google.com'],
      formAction: ["'self'", 'https://api.web3forms.com'],
      objectSrc: ["'none'"]
    }
  }
}));

app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(express.json({ limit: '1mb' }));

app.use(session({
  name: 'libra.sid',
  secret: process.env.SESSION_SECRET || 'development-only-secret-change-me',
  resave: false,
  saveUninitialized: false,
  ...(sessionStore ? { store: sessionStore } : {}),
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 8
  }
}));

app.use((req, res, next) => {
  res.locals.csrfToken = issueCsrfToken(req);
  res.locals.flashError = req.session.flashError || null;
  res.locals.flashSuccess = req.session.flashSuccess || null;
  delete req.session.flashError;
  delete req.session.flashSuccess;
  next();
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts. Please try again later.'
});

function setFlash(req, type, message) {
  if (type === 'error') {
    req.session.flashError = message;
    return;
  }

  req.session.flashSuccess = message;
}

function renderError(res, status, title, message) {
  res.status(status).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
      <link rel="stylesheet" href="/styles.css" />
    </head>
    <body>
      <section class="page-hero">
        <div class="page-hero-bg"></div>
        <div class="page-hero-overlay"></div>
        <div class="container page-hero-content">
          <span class="eyebrow">System Message</span>
          <h1>${title}</h1>
          <div style="width:60px;height:2px;background:var(--gold);margin:20px 0 24px;"></div>
          <p>${message}</p>
          <div style="margin-top:24px;">
            <a href="/" class="btn-primary">Return Home</a>
          </div>
        </div>
      </section>
    </body>
    </html>
  `);
}

function toDateTimeLocal(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

async function translateText(text, targetLanguage) {
  const normalizedText = String(text || '').trim();
  if (!normalizedText || targetLanguage === 'en') {
    return normalizedText;
  }

  const cacheKey = `${targetLanguage}::${normalizedText}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'en',
    tl: targetLanguage,
    dt: 't',
    q: normalizedText
  });

  const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Translation request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const translatedText = Array.isArray(payload?.[0])
    ? payload[0].map((item) => item?.[0] || '').join('').trim()
    : normalizedText;

  translationCache.set(cacheKey, translatedText || normalizedText);
  return translatedText || normalizedText;
}

app.get('/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ ok: true, database: true });
  } catch (error) {
    res.status(503).json({ ok: false, database: false });
  }
});

app.post('/api/translate', async (req, res) => {
  const targetLanguage = ['ar', 'ru'].includes(req.body?.targetLanguage)
    ? req.body.targetLanguage
    : 'en';
  const texts = Array.isArray(req.body?.texts) ? req.body.texts : [];

  if (texts.length > 300) {
    return res.status(413).json({ error: 'Too many text fragments requested.' });
  }

  try {
    const translations = await Promise.all(
      texts.map((text) => translateText(String(text || '').slice(0, 5000), targetLanguage))
    );

    return res.json({ translations });
  } catch (error) {
    console.error(error);
    return res.status(502).json({ error: 'Translation service unavailable.' });
  }
});

app.get('/', async (req, res, next) => {
  try {
    const homepage = await getHomepageContent();
    res.render('public/home', { homepage });
  } catch (error) {
    next(error);
  }
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(ROOT, 'about.html'));
});

app.get('/contact', (req, res) => {
  const configuredAccessKey = String(process.env.WEB3FORMS_ACCESS_KEY || '').trim();
  const web3formsAccessKey = /^YOUR_/i.test(configuredAccessKey) ? '' : configuredAccessKey;

  res.render('public/contact', {
    web3formsAccessKey
  });
});

app.get('/contact.html', (req, res) => {
  res.redirect(301, '/contact');
});

app.get('/index.html', (req, res) => {
  res.redirect(301, '/');
});

app.get('/services.html', (req, res) => {
  res.redirect(301, '/services');
});

app.get('/services', async (req, res, next) => {
  try {
    const services = await getPublishedServices();
    res.render('public/services-index', { services });
  } catch (error) {
    next(error);
  }
});

app.get('/services/', async (req, res, next) => {
  try {
    const services = await getPublishedServices();
    res.render('public/services-index', { services });
  } catch (error) {
    next(error);
  }
});

app.get('/services/:slug', (req, res, next) => {
  if (req.params.slug.endsWith('.html')) {
    return next();
  }

  return res.redirect(301, `/services/${req.params.slug}.html`);
});

app.get('/services/:slug.html', async (req, res, next) => {
  try {
    const services = await getPublishedServices();
    const service = services.find((item) => item.slug === req.params.slug);

    if (!service) {
      return renderError(res, 404, 'Service Not Found', 'The requested service page could not be found or is not published.');
    }

    const serviceIndex = services.findIndex((item) => item.slug === service.slug);
    const nextService = services.length > 1
      ? services[(serviceIndex + 1) % services.length]
      : null;
    const relatedServices = service.related_service_slugs
      .map((slug) => services.find((item) => item.slug === slug))
      .filter(Boolean)
      .slice(0, 3);

    return res.render('public/service-detail', {
      nextService: nextService && nextService.slug !== service.slug ? nextService : null,
      relatedServices,
      service
    });
  } catch (error) {
    return next(error);
  }
});

app.get('/blogs', async (req, res, next) => {
  try {
    const posts = await getPublishedBlogs();
    res.render('public/blog-index', { posts });
  } catch (error) {
    next(error);
  }
});

app.get('/blogs/:slug', async (req, res, next) => {
  try {
    const post = await getPublishedBlogBySlug(req.params.slug);
    if (!post) {
      return renderError(res, 404, 'Article Not Found', 'The requested blog article could not be found or is not published.');
    }

    const relatedPosts = (await getPublishedBlogs())
      .filter((item) => item.slug !== post.slug)
      .slice(0, 3);

    return res.render('public/blog-post', { post, relatedPosts });
  } catch (error) {
    return next(error);
  }
});

app.use(express.static(path.join(ROOT, 'public'), {
  index: false
}));

app.use(express.static(ROOT, {
  index: false,
  extensions: ['html']
}));

app.get('/blogs.html', (req, res) => {
  res.redirect(301, '/blogs');
});

app.get('/blogs/:slug.html', (req, res) => {
  res.redirect(301, `/blogs/${req.params.slug}`);
});

app.get('/admin', (req, res) => {
  if (req.session.adminUser) {
    return res.redirect('/admin/dashboard');
  }

  return res.render('admin/login', {
    csrfToken: res.locals.csrfToken,
    email: ''
  });
});

app.post('/admin/login', loginLimiter, async (req, res, next) => {
  try {
    if (!verifyCsrf(req)) {
      setFlash(req, 'error', 'Security validation failed. Please try again.');
      return res.redirect('/admin');
    }

    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    let rows;
    try {
      rows = await query(
        'SELECT id, email, password_hash, full_name, is_active FROM admin_users WHERE email = ? LIMIT 1',
        [email]
      );
    } catch (dbError) {
      return res.status(503).render('admin/login', {
        csrfToken: res.locals.csrfToken,
        email,
        flashError: 'Database connection unavailable. Admin login will work after MySQL is connected.'
      });
    }

    const admin = rows[0];
    if (!admin || !admin.is_active) {
      return res.status(401).render('admin/login', {
        csrfToken: res.locals.csrfToken,
        email,
        flashError: 'Invalid credentials.'
      });
    }

    const validPassword = await bcrypt.compare(password, admin.password_hash);
    if (!validPassword) {
      return res.status(401).render('admin/login', {
        csrfToken: res.locals.csrfToken,
        email,
        flashError: 'Invalid credentials.'
      });
    }

    req.session.regenerate(async (regenerateError) => {
      if (regenerateError) {
        return next(regenerateError);
      }

      try {
        req.session.adminUser = {
          id: admin.id,
          email: admin.email,
          fullName: admin.full_name
        };
        issueCsrfToken(req);

        await query(
          'UPDATE admin_users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?',
          [admin.id]
        );

        setFlash(req, 'success', 'Signed in successfully.');
        return res.redirect('/admin/dashboard');
      } catch (callbackError) {
        return next(callbackError);
      }
    });
  } catch (error) {
    next(error);
  }
});

app.post('/admin/logout', requireAuth, (req, res, next) => {
  if (!verifyCsrf(req)) {
    setFlash(req, 'error', 'Security validation failed. Please try again.');
    return res.redirect('/admin/dashboard');
  }

  return req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie('libra.sid');
    return res.redirect('/admin');
  });
});

app.get('/admin/dashboard', requireAuth, async (req, res, next) => {
  try {
    const currentSection = req.query.section === 'services'
      ? 'services'
      : req.query.section === 'homepage'
        ? 'homepage'
      : req.query.section === 'overview'
        ? 'overview'
        : 'blogs';
    let posts = [];
    let services = [];
    let homepage = null;
    let flashError = res.locals.flashError;

    try {
      posts = await getAllBlogsForAdmin();
    } catch (dbError) {
      flashError = 'Database connection unavailable. The dashboard skeleton is loaded, but blog management requires MySQL.';
    }

    try {
      services = await getAllServicesForAdmin();
    } catch (dbError) {
      flashError = flashError
        ? `${flashError} Service management also requires MySQL.`
        : 'Database connection unavailable. The dashboard skeleton is loaded, but service management requires MySQL.';
    }

    try {
      homepage = await getHomepageContentForAdmin();
    } catch (dbError) {
      flashError = flashError
        ? `${flashError} Homepage management also requires MySQL for saving.`
        : 'Database connection unavailable. The dashboard skeleton is loaded, but homepage management requires MySQL for saving.';
    }

    res.render('admin/dashboard', {
      adminUser: req.session.adminUser,
      currentSection,
      homepage,
      posts,
      services,
      csrfToken: res.locals.csrfToken,
      flashError
    });
  } catch (error) {
    next(error);
  }
});

app.get('/admin/blogs/new', requireAuth, (req, res) => {
  res.render('admin/editor', {
    adminUser: req.session.adminUser,
    currentSection: 'blogs',
    mode: 'create',
    post: {
      title: '',
      category: '',
      slug: '',
      excerpt: '',
      hero_image_url: '',
      meta_description: '',
      content_html: '<p class="lead"></p>\n\n<h2></h2>\n<p></p>',
      status: 'published',
      published_at_local: toDateTimeLocal(new Date())
    },
    errors: [],
    csrfToken: res.locals.csrfToken
  });
});

app.get('/admin/homepage/edit', requireAuth, async (req, res, next) => {
  try {
    const homepage = await getHomepageContentForAdmin();
    return res.render('admin/homepage-editor', {
      adminUser: req.session.adminUser,
      currentSection: 'homepage',
      homepage,
      errors: [],
      csrfToken: res.locals.csrfToken
    });
  } catch (error) {
    return next(error);
  }
});

app.post('/admin/homepage', requireAuth, async (req, res, next) => {
  try {
    if (!verifyCsrf(req)) {
      setFlash(req, 'error', 'Security validation failed. Please try again.');
      return res.redirect('/admin/homepage/edit');
    }

    const result = await updateHomepageContent(req.body);
    if (result.errors) {
      return res.status(422).render('admin/homepage-editor', {
        adminUser: req.session.adminUser,
        currentSection: 'homepage',
        homepage: result.content,
        errors: result.errors,
        csrfToken: res.locals.csrfToken
      });
    }

    setFlash(req, 'success', 'Homepage content updated successfully.');
    return res.redirect('/admin/dashboard?section=homepage');
  } catch (error) {
    return next(error);
  }
});

app.post('/admin/blogs', requireAuth, async (req, res, next) => {
  try {
    if (!verifyCsrf(req)) {
      setFlash(req, 'error', 'Security validation failed. Please try again.');
      return res.redirect('/admin/blogs/new');
    }

    const result = await createBlogPost(req.body);
    if (result.errors) {
      return res.status(422).render('admin/editor', {
        adminUser: req.session.adminUser,
        currentSection: 'blogs',
        mode: 'create',
        post: {
          ...req.body,
          published_at_local: req.body.published_at || ''
        },
        errors: result.errors,
        csrfToken: res.locals.csrfToken
      });
    }

    setFlash(req, 'success', 'Blog post created successfully.');
    return res.redirect('/admin/dashboard?section=blogs');
  } catch (error) {
    return next(error);
  }
});

app.get('/admin/services/new', requireAuth, (req, res) => {
  res.render('admin/service-editor', {
    adminUser: req.session.adminUser,
    currentSection: 'services',
    mode: 'create',
    service: {
      title: '',
      excerpt: '',
      slug: '',
      order_index: 1,
      meta_description: '',
      hero_summary: '',
      overview_html: '<p></p>',
      approach_html: '<p></p>',
      consultation_title: 'Free Initial Consultation',
      consultation_text: '',
      sidebar_cta_title: 'Free Initial Consultation',
      sidebar_cta_text: '',
      key_points_text: '',
      statutes_text: '',
      related_service_slugs_text: '',
      status: 'published'
    },
    errors: [],
    csrfToken: res.locals.csrfToken
  });
});

app.get('/admin/blogs/:id/edit', requireAuth, async (req, res, next) => {
  try {
    const post = await getBlogById(Number(req.params.id));
    if (!post) {
      setFlash(req, 'error', 'Blog post not found.');
      return res.redirect('/admin/dashboard?section=blogs');
    }

    return res.render('admin/editor', {
      adminUser: req.session.adminUser,
      currentSection: 'blogs',
      mode: 'edit',
      post: {
        ...post,
        published_at_local: toDateTimeLocal(post.published_at)
      },
      errors: [],
      csrfToken: res.locals.csrfToken
    });
  } catch (error) {
    return next(error);
  }
});

app.post('/admin/blogs/:id', requireAuth, async (req, res, next) => {
  try {
    if (!verifyCsrf(req)) {
      setFlash(req, 'error', 'Security validation failed. Please try again.');
      return res.redirect(`/admin/blogs/${req.params.id}/edit`);
    }

    const blogId = Number(req.params.id);
    const result = await updateBlogPost(blogId, req.body);

    if (result.errors) {
      return res.status(422).render('admin/editor', {
        adminUser: req.session.adminUser,
        currentSection: 'blogs',
        mode: 'edit',
        post: {
          id: blogId,
          ...req.body,
          published_at_local: req.body.published_at || ''
        },
        errors: result.errors,
        csrfToken: res.locals.csrfToken
      });
    }

    setFlash(req, 'success', 'Blog post updated successfully.');
    return res.redirect('/admin/dashboard?section=blogs');
  } catch (error) {
    return next(error);
  }
});

app.post('/admin/blogs/:id/delete', requireAuth, async (req, res, next) => {
  try {
    if (!verifyCsrf(req)) {
      setFlash(req, 'error', 'Security validation failed. Please try again.');
      return res.redirect('/admin/dashboard?section=blogs');
    }

    await deleteBlogPost(Number(req.params.id));
    setFlash(req, 'success', 'Blog post deleted successfully.');
    return res.redirect('/admin/dashboard?section=blogs');
  } catch (error) {
    return next(error);
  }
});

app.post('/admin/services', requireAuth, async (req, res, next) => {
  try {
    if (!verifyCsrf(req)) {
      setFlash(req, 'error', 'Security validation failed. Please try again.');
      return res.redirect('/admin/services/new');
    }

    const result = await createServicePage(req.body);
    if (result.errors) {
      return res.status(422).render('admin/service-editor', {
        adminUser: req.session.adminUser,
        currentSection: 'services',
        mode: 'create',
        service: {
          ...req.body
        },
        errors: result.errors,
        csrfToken: res.locals.csrfToken
      });
    }

    setFlash(req, 'success', 'Service page created successfully.');
    return res.redirect('/admin/dashboard?section=services');
  } catch (error) {
    return next(error);
  }
});

app.get('/admin/services/:id/edit', requireAuth, async (req, res, next) => {
  try {
    const service = await getServiceById(Number(req.params.id));
    if (!service) {
      setFlash(req, 'error', 'Service page not found.');
      return res.redirect('/admin/dashboard?section=services');
    }

    return res.render('admin/service-editor', {
      adminUser: req.session.adminUser,
      currentSection: 'services',
      mode: 'edit',
      service,
      errors: [],
      csrfToken: res.locals.csrfToken
    });
  } catch (error) {
    return next(error);
  }
});

app.post('/admin/services/:id', requireAuth, async (req, res, next) => {
  try {
    if (!verifyCsrf(req)) {
      setFlash(req, 'error', 'Security validation failed. Please try again.');
      return res.redirect(`/admin/services/${req.params.id}/edit`);
    }

    const serviceId = Number(req.params.id);
    const result = await updateServicePage(serviceId, req.body);
    if (result.errors) {
      return res.status(422).render('admin/service-editor', {
        adminUser: req.session.adminUser,
        currentSection: 'services',
        mode: 'edit',
        service: {
          id: serviceId,
          ...req.body
        },
        errors: result.errors,
        csrfToken: res.locals.csrfToken
      });
    }

    setFlash(req, 'success', 'Service page updated successfully.');
    return res.redirect('/admin/dashboard?section=services');
  } catch (error) {
    return next(error);
  }
});

app.post('/admin/services/:id/delete', requireAuth, async (req, res, next) => {
  try {
    if (!verifyCsrf(req)) {
      setFlash(req, 'error', 'Security validation failed. Please try again.');
      return res.redirect('/admin/dashboard?section=services');
    }

    await deleteServicePage(Number(req.params.id));
    setFlash(req, 'success', 'Service page deleted successfully.');
    return res.redirect('/admin/dashboard?section=services');
  } catch (error) {
    return next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  renderError(res, 500, 'Server Error', 'An unexpected server error occurred while processing your request.');
});

const port = Number(process.env.PORT || 3000);

async function startServer() {
  app.listen(port, () => {
    console.log(`Libra Legal CMS running at http://localhost:${port}`);
  });
}

startServer();
