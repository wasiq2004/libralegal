const { query } = require('./db');
const { slugify, sanitizeBlogHtml, stripHtml } = require('./security');
const fallbackBlogs = require('./fallback-blogs');

function formatMonthYear(dateValue) {
  const date = new Date(dateValue);
  return date.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

async function ensureUniqueSlug(baseSlug, excludeId = null) {
  const fallback = baseSlug || `blog-${Date.now()}`;
  let slug = fallback;
  let counter = 2;

  while (true) {
    const rows = await query(
      `SELECT id FROM blog_posts WHERE slug = ? ${excludeId ? 'AND id <> ?' : ''} LIMIT 1`,
      excludeId ? [slug, excludeId] : [slug]
    );

    if (rows.length === 0) {
      return slug;
    }

    slug = `${fallback}-${counter}`;
    counter += 1;
  }
}

function normalizePostInput(input) {
  const title = stripHtml(input.title).slice(0, 180);
  const category = stripHtml(input.category).slice(0, 80);
  const excerpt = stripHtml(input.excerpt).slice(0, 500);
  const metaDescription = stripHtml(input.meta_description || excerpt).slice(0, 255);
  const heroImageUrl = stripHtml(input.hero_image_url).slice(0, 2048);
  const contentHtml = sanitizeBlogHtml(input.content_html);
  const status = input.status === 'draft' ? 'draft' : 'published';
  const requestedSlug = slugify(input.slug || title);
  const publishedAt = input.published_at ? new Date(input.published_at) : new Date();

  const errors = [];

  if (!title) errors.push('Title is required.');
  if (!category) errors.push('Category is required.');
  if (!excerpt) errors.push('Excerpt is required.');
  if (!heroImageUrl) errors.push('Hero image URL is required.');
  if (!contentHtml || !stripHtml(contentHtml)) errors.push('Article content is required.');
  if (Number.isNaN(publishedAt.getTime())) errors.push('Published date is invalid.');

  if (heroImageUrl && !/^https?:\/\//i.test(heroImageUrl)) {
    errors.push('Hero image URL must start with http:// or https://.');
  }

  return {
    errors,
    value: {
      title,
      category,
      excerpt,
      metaDescription,
      heroImageUrl,
      contentHtml,
      status,
      requestedSlug,
      publishedAt
    }
  };
}

async function getPublishedBlogs() {
  try {
    const rows = await query(
      `SELECT id, slug, title, category, excerpt, hero_image_url, meta_description, content_html, published_at
       FROM blog_posts
       WHERE status = 'published'
       ORDER BY published_at DESC, id DESC`
    );

    return rows.map((row) => ({
      ...row,
      monthLabel: formatMonthYear(row.published_at)
    }));
  } catch (error) {
    return fallbackBlogs.map((row) => ({
      ...row,
      monthLabel: formatMonthYear(row.published_at)
    }));
  }
}

async function getAllBlogsForAdmin() {
  const rows = await query(
    `SELECT id, slug, title, category, status, published_at, created_at, updated_at
     FROM blog_posts
     ORDER BY published_at DESC, id DESC`
  );

  return rows.map((row) => ({
    ...row,
    monthLabel: formatMonthYear(row.published_at)
  }));
}

async function getPublishedBlogBySlug(slug) {
  try {
    const rows = await query(
      `SELECT id, slug, title, category, excerpt, hero_image_url, meta_description, content_html, published_at
       FROM blog_posts
       WHERE slug = ? AND status = 'published'
       LIMIT 1`,
      [slug]
    );

    if (!rows.length) {
      return null;
    }

    return {
      ...rows[0],
      monthLabel: formatMonthYear(rows[0].published_at)
    };
  } catch (error) {
    const match = fallbackBlogs.find((item) => item.slug === slug);
    return match ? { ...match, monthLabel: formatMonthYear(match.published_at) } : null;
  }
}

async function getBlogById(id) {
  try {
    const rows = await query(
      `SELECT id, slug, title, category, excerpt, hero_image_url, meta_description, content_html, status, published_at
       FROM blog_posts
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    return rows[0] || null;
  } catch (error) {
    return null;
  }
}

async function createBlogPost(input) {
  const { errors, value } = normalizePostInput(input);
  if (errors.length) {
    return { errors };
  }

  try {
    const slug = await ensureUniqueSlug(value.requestedSlug);

    const result = await query(
      `INSERT INTO blog_posts
       (slug, title, category, excerpt, hero_image_url, meta_description, content_html, status, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        slug,
        value.title,
        value.category,
        value.excerpt,
        value.heroImageUrl,
        value.metaDescription,
        value.contentHtml,
        value.status,
        value.publishedAt
      ]
    );

    return { id: result.insertId, slug };
  } catch (error) {
    return { errors: ['Database connection unavailable. Blog posts cannot be created until MySQL is connected.'] };
  }
}

async function updateBlogPost(id, input) {
  const { errors, value } = normalizePostInput(input);
  if (errors.length) {
    return { errors };
  }

  const slug = await ensureUniqueSlug(value.requestedSlug, id);

  try {
    await query(
      `UPDATE blog_posts
       SET slug = ?, title = ?, category = ?, excerpt = ?, hero_image_url = ?, meta_description = ?,
           content_html = ?, status = ?, published_at = ?
       WHERE id = ?`,
      [
        slug,
        value.title,
        value.category,
        value.excerpt,
        value.heroImageUrl,
        value.metaDescription,
        value.contentHtml,
        value.status,
        value.publishedAt,
        id
      ]
    );
  } catch (error) {
    return { errors: ['Database connection unavailable. Blog updates cannot be saved until MySQL is connected.'] };
  }

  return { id, slug };
}

async function deleteBlogPost(id) {
  await query('DELETE FROM blog_posts WHERE id = ? LIMIT 1', [id]);
}

module.exports = {
  createBlogPost,
  deleteBlogPost,
  getAllBlogsForAdmin,
  getBlogById,
  getPublishedBlogBySlug,
  getPublishedBlogs,
  updateBlogPost
};
