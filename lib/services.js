const fs = require('fs');
const path = require('path');

const { query } = require('./db');
const { sanitizeBlogHtml, slugify, stripHtml } = require('./security');

const ROOT = path.join(__dirname, '..');
const SERVICES_LIST_PATH = path.join(ROOT, 'services.html');
const SERVICES_DIR = path.join(ROOT, 'services');

let ensureServiceTablePromise = null;
let syncServicesPromise = null;
let fallbackServicesCache = null;

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&larr;|&#8592;/g, '<-')
    .replace(/&rarr;|&#8594;/g, '->')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function cleanText(value) {
  return decodeHtmlEntities(stripHtml(value)).replace(/\s+/g, ' ').trim();
}

function normalizeBlockHtml(value) {
  return sanitizeBlogHtml(value || '').trim();
}

function normalizeListInput(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map((item) => cleanText(item))
    .filter(Boolean);
}

function serializeList(list) {
  return JSON.stringify(Array.isArray(list) ? list : []);
}

function parseStoredList(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch (error) {
    return [];
  }
}

function formatServiceRecord(record) {
  return {
    ...record,
    key_points: parseStoredList(record.key_points_json),
    statutes: parseStoredList(record.statutes_json),
    related_service_slugs: parseStoredList(record.related_service_slugs_json),
    href: `/services/${record.slug}.html`,
    numberLabel: String(record.order_index || 0).padStart(2, '0')
  };
}

function matchOne(source, pattern) {
  const match = source.match(pattern);
  return match ? match[1].trim() : '';
}

function extractSectionHtml(source, startHeading, endHeading) {
  const escapedStart = startHeading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedEnd = endHeading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `<h2>${escapedStart}<\\/h2>([\\s\\S]*?)<h2>${escapedEnd}<\\/h2>`,
    'i'
  );

  const match = source.match(pattern);
  return match ? normalizeBlockHtml(match[1]) : '';
}

function extractListItems(source, pattern) {
  const section = matchOne(source, pattern);
  return Array.from(section.matchAll(/<li>([\s\S]*?)<\/li>/gi)).map((item) => cleanText(item[1]));
}

function extractRelatedSlugs(source) {
  const relatedSection = matchOne(
    source,
    /<div class="related-box" style="margin-top:24px;">[\s\S]*?<ul>([\s\S]*?)<\/ul>[\s\S]*?<\/div>/i
  );

  return Array.from(relatedSection.matchAll(/href="([^"]+)\.html"/gi))
    .map((item) => slugify(path.basename(item[1])));
}

function parseServiceDetail(slug) {
  const filePath = path.join(SERVICES_DIR, `${slug}.html`);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const source = fs.readFileSync(filePath, 'utf8');

  return {
    title: cleanText(matchOne(source, /<h1>([\s\S]*?)<\/h1>/i)),
    meta_description: cleanText(matchOne(source, /<meta name="description" content="([^"]*)"/i)),
    hero_summary: cleanText(
      matchOne(
        source,
        /<div class="page-hero-content">[\s\S]*?<div style="width:60px;height:2px;background:var\(--gold\);margin:20px 0 24px;"><\/div>\s*<p>([\s\S]*?)<\/p>/i
      )
    ),
    overview_html: extractSectionHtml(source, 'Overview', 'Strategic Approach'),
    approach_html: extractSectionHtml(source, 'Strategic Approach', 'Key Practice Areas'),
    consultation_title: cleanText(matchOne(source, /<h2>([\s\S]*?Free Initial Consultation[\s\S]*?)<\/h2>/i)) || 'Free Initial Consultation',
    consultation_text: cleanText(matchOne(source, /<h2>[\s\S]*?Free Initial Consultation[\s\S]*?<\/h2>\s*<p>([\s\S]*?)<\/p>/i)),
    sidebar_cta_title: cleanText(matchOne(source, /<div class="sidebar-cta-box">\s*<h3>([\s\S]*?)<\/h3>/i)) || 'Free Initial Consultation',
    sidebar_cta_text: cleanText(matchOne(source, /<div class="sidebar-cta-box">[\s\S]*?<p>([\s\S]*?)<\/p>/i)),
    key_points: extractListItems(source, /<h2>Key Practice Areas<\/h2>\s*<ul>([\s\S]*?)<\/ul>/i),
    statutes: extractListItems(source, /<section class="statutes-section">[\s\S]*?<ul>([\s\S]*?)<\/ul>/i),
    related_service_slugs: extractRelatedSlugs(source)
  };
}

function parseServiceListingMap() {
  const listingSource = fs.readFileSync(SERVICES_LIST_PATH, 'utf8');
  const listingMap = new Map();
  const itemPattern = /<a href="\/services\/([^"]+)\.html" class="service-item[\s\S]*?<span class="service-number">([^<]+)<\/span>[\s\S]*?<h3>([\s\S]*?)<\/h3>[\s\S]*?<p>([\s\S]*?)<\/p>[\s\S]*?<\/a>/gi;

  let match;
  while ((match = itemPattern.exec(listingSource)) !== null) {
    const slug = slugify(match[1]);
    listingMap.set(slug, {
      slug,
      orderIndex: Number.parseInt(match[2], 10) || listingMap.size + 1,
      title: cleanText(match[3]),
      excerpt: cleanText(match[4])
    });
  }

  return listingMap;
}

function parseFallbackServices() {
  if (fallbackServicesCache) {
    return fallbackServicesCache;
  }

  const listingMap = parseServiceListingMap();
  const serviceFiles = fs.readdirSync(SERVICES_DIR)
    .filter((fileName) => fileName.endsWith('.html'))
    .map((fileName) => slugify(path.basename(fileName, '.html')));
  const services = [];
  const orderedSlugs = [
    ...Array.from(listingMap.values()).sort((left, right) => left.orderIndex - right.orderIndex).map((item) => item.slug),
    ...serviceFiles.filter((slug) => !listingMap.has(slug)).sort()
  ];

  orderedSlugs.forEach((slug, index) => {
    const detail = parseServiceDetail(slug) || {};
    const listed = listingMap.get(slug);
    const excerpt = listed?.excerpt || detail.hero_summary || detail.meta_description || '';
    const title = listed?.title || detail.title || slug.replace(/_/g, ' ');

    services.push(formatServiceRecord({
      id: null,
      slug,
      order_index: listed?.orderIndex || index + 1,
      title,
      excerpt,
      meta_description: detail.meta_description || excerpt.slice(0, 255),
      hero_summary: detail.hero_summary || excerpt,
      overview_html: detail.overview_html || '<p></p>',
      approach_html: detail.approach_html || '<p></p>',
      consultation_title: detail.consultation_title || 'Free Initial Consultation',
      consultation_text: detail.consultation_text || '',
      sidebar_cta_title: detail.sidebar_cta_title || 'Free Initial Consultation',
      sidebar_cta_text: detail.sidebar_cta_text || '',
      key_points_json: serializeList(detail.key_points || []),
      statutes_json: serializeList(detail.statutes || []),
      related_service_slugs_json: serializeList(detail.related_service_slugs || []),
      status: 'published'
    }));
  });

  fallbackServicesCache = services.sort((left, right) => left.order_index - right.order_index);
  return fallbackServicesCache;
}

function mergeServicesWithFallback(primaryServices, fallbackServices) {
  const merged = new Map();

  fallbackServices.forEach((service) => {
    merged.set(service.slug, {
      ...service,
      id: service.id || null
    });
  });

  primaryServices.forEach((service) => {
    const fallback = merged.get(service.slug);
    merged.set(service.slug, {
      ...(fallback || {}),
      ...service,
      key_points: service.key_points || fallback?.key_points || [],
      statutes: service.statutes || fallback?.statutes || [],
      related_service_slugs: service.related_service_slugs || fallback?.related_service_slugs || [],
      href: `/services/${service.slug}.html`,
      numberLabel: String(service.order_index || fallback?.order_index || 0).padStart(2, '0')
    });
  });

  return Array.from(merged.values()).sort((left, right) => {
    if ((left.order_index || 0) !== (right.order_index || 0)) {
      return (left.order_index || 0) - (right.order_index || 0);
    }

    return String(left.slug).localeCompare(String(right.slug));
  });
}

async function ensureServiceTable() {
  if (!ensureServiceTablePromise) {
    ensureServiceTablePromise = query(`
      CREATE TABLE IF NOT EXISTS service_pages (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        slug VARCHAR(190) NOT NULL,
        order_index INT UNSIGNED NOT NULL DEFAULT 1,
        title VARCHAR(180) NOT NULL,
        excerpt VARCHAR(500) NOT NULL,
        meta_description VARCHAR(255) NOT NULL,
        hero_summary VARCHAR(500) NOT NULL,
        overview_html LONGTEXT NOT NULL,
        approach_html LONGTEXT NOT NULL,
        consultation_title VARCHAR(160) NOT NULL,
        consultation_text TEXT NOT NULL,
        sidebar_cta_title VARCHAR(160) NOT NULL,
        sidebar_cta_text TEXT NOT NULL,
        key_points_json LONGTEXT NOT NULL,
        statutes_json LONGTEXT NOT NULL,
        related_service_slugs_json LONGTEXT NOT NULL,
        status ENUM('draft', 'published') NOT NULL DEFAULT 'published',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_service_pages_slug (slug),
        KEY idx_service_pages_status_order (status, order_index, id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `).catch((error) => {
      ensureServiceTablePromise = null;
      throw error;
    });
  }

  return ensureServiceTablePromise;
}

async function syncServicesFromStaticFiles() {
  if (!syncServicesPromise) {
    syncServicesPromise = (async () => {
      await ensureServiceTable();
      const fallbackServices = parseFallbackServices();
      const existingRows = await query(
        `SELECT id, slug, title, excerpt, meta_description, hero_summary, overview_html, approach_html,
                consultation_title, consultation_text, sidebar_cta_title, sidebar_cta_text,
                key_points_json, statutes_json, related_service_slugs_json
         FROM service_pages`
      );
      const existingBySlug = new Map(existingRows.map((row) => [row.slug, row]));

      for (const service of fallbackServices) {
        const existing = existingBySlug.get(service.slug);

        if (!existing) {
          await query(
            `INSERT INTO service_pages
             (slug, order_index, title, excerpt, meta_description, hero_summary, overview_html, approach_html,
              consultation_title, consultation_text, sidebar_cta_title, sidebar_cta_text, key_points_json,
              statutes_json, related_service_slugs_json, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              service.slug,
              service.order_index,
              service.title,
              service.excerpt,
              service.meta_description,
              service.hero_summary,
              service.overview_html,
              service.approach_html,
              service.consultation_title,
              service.consultation_text,
              service.sidebar_cta_title,
              service.sidebar_cta_text,
              serializeList(service.key_points),
              serializeList(service.statutes),
              serializeList(service.related_service_slugs),
              service.status
            ]
          );

          continue;
        }

        const shouldHydrate =
          !cleanText(existing.title) ||
          !cleanText(existing.excerpt) ||
          !cleanText(existing.meta_description) ||
          !cleanText(existing.hero_summary) ||
          !cleanText(existing.consultation_title) ||
          !cleanText(existing.sidebar_cta_title) ||
          !stripHtml(existing.overview_html || '') ||
          !stripHtml(existing.approach_html || '') ||
          parseStoredList(existing.key_points_json).length === 0 ||
          parseStoredList(existing.statutes_json).length === 0;

        if (!shouldHydrate) {
          continue;
        }

        await query(
          `UPDATE service_pages
           SET title = ?, excerpt = ?, meta_description = ?, hero_summary = ?, overview_html = ?, approach_html = ?,
               consultation_title = ?, consultation_text = ?, sidebar_cta_title = ?, sidebar_cta_text = ?,
               key_points_json = ?, statutes_json = ?, related_service_slugs_json = ?
           WHERE id = ?`,
          [
            service.title,
            service.excerpt,
            service.meta_description,
            service.hero_summary,
            service.overview_html,
            service.approach_html,
            service.consultation_title,
            service.consultation_text,
            service.sidebar_cta_title,
            service.sidebar_cta_text,
            serializeList(service.key_points),
            serializeList(service.statutes),
            serializeList(service.related_service_slugs),
            existing.id
          ]
        );
      }
    })().finally(() => {
      syncServicesPromise = null;
    });
  }

  return syncServicesPromise;
}

async function ensureUniqueServiceSlug(baseSlug, excludeId = null) {
  await ensureServiceTable();

  const fallback = baseSlug || `service-${Date.now()}`;
  let slug = fallback;
  let counter = 2;

  while (true) {
    const rows = await query(
      `SELECT id FROM service_pages WHERE slug = ? ${excludeId ? 'AND id <> ?' : ''} LIMIT 1`,
      excludeId ? [slug, excludeId] : [slug]
    );

    if (rows.length === 0) {
      return slug;
    }

    slug = `${fallback}-${counter}`;
    counter += 1;
  }
}

function normalizeServiceInput(input) {
  const title = stripHtml(input.title).slice(0, 180);
  const excerpt = stripHtml(input.excerpt).slice(0, 500);
  const metaDescription = stripHtml(input.meta_description || input.excerpt).slice(0, 255);
  const heroSummary = stripHtml(input.hero_summary || input.excerpt).slice(0, 500);
  const overviewHtml = normalizeBlockHtml(input.overview_html);
  const approachHtml = normalizeBlockHtml(input.approach_html);
  const consultationTitle = stripHtml(input.consultation_title || 'Free Initial Consultation').slice(0, 160);
  const consultationText = stripHtml(input.consultation_text).slice(0, 4000);
  const sidebarCtaTitle = stripHtml(input.sidebar_cta_title || 'Free Initial Consultation').slice(0, 160);
  const sidebarCtaText = stripHtml(input.sidebar_cta_text).slice(0, 4000);
  const keyPoints = normalizeListInput(input.key_points_text);
  const statutes = normalizeListInput(input.statutes_text);
  const requestedSlug = slugify(input.slug || title);
  const relatedServiceSlugs = Array.from(new Set(
    normalizeListInput(input.related_service_slugs_text).map((item) => slugify(item)).filter(Boolean)
  ));
  const status = input.status === 'draft' ? 'draft' : 'published';
  const orderIndex = Number.parseInt(input.order_index, 10);

  const errors = [];

  if (!title) errors.push('Title is required.');
  if (!excerpt) errors.push('Listing excerpt is required.');
  if (!heroSummary) errors.push('Hero summary is required.');
  if (!overviewHtml || !stripHtml(overviewHtml)) errors.push('Overview content is required.');
  if (!approachHtml || !stripHtml(approachHtml)) errors.push('Strategic approach content is required.');
  if (!keyPoints.length) errors.push('At least one key practice area is required.');
  if (!statutes.length) errors.push('At least one statute is required.');
  if (!Number.isInteger(orderIndex) || orderIndex < 1) errors.push('Display order must be a positive number.');

  return {
    errors,
    value: {
      title,
      excerpt,
      metaDescription,
      heroSummary,
      overviewHtml,
      approachHtml,
      consultationTitle,
      consultationText,
      sidebarCtaTitle,
      sidebarCtaText,
      keyPoints,
      statutes,
      requestedSlug,
      relatedServiceSlugs,
      status,
      orderIndex
    }
  };
}

async function getPublishedServices() {
  const fallbackServices = parseFallbackServices().filter((service) => service.status === 'published');

  try {
    try {
      await syncServicesFromStaticFiles();
    } catch (error) {
      // Keep serving DB-backed services even if static-file hydration fails.
    }

    const rows = await query(
      `SELECT id, slug, order_index, title, excerpt, meta_description, hero_summary, overview_html, approach_html,
              consultation_title, consultation_text, sidebar_cta_title, sidebar_cta_text, key_points_json,
              statutes_json, related_service_slugs_json, status
       FROM service_pages
       WHERE status = 'published'
       ORDER BY order_index ASC, id ASC`
    );

    return mergeServicesWithFallback(rows.map(formatServiceRecord), fallbackServices);
  } catch (error) {
    return fallbackServices;
  }
}

async function getAllServicesForAdmin() {
  const fallbackServices = parseFallbackServices();

  try {
    try {
      await syncServicesFromStaticFiles();
    } catch (error) {
      // Keep showing DB-backed services in admin even if static-file hydration fails.
    }

    const rows = await query(
      `SELECT id, slug, order_index, title, status, updated_at
       FROM service_pages
       ORDER BY order_index ASC, id ASC`
    );

    const dbServices = rows.map((row) => ({
      ...row,
      numberLabel: String(row.order_index || 0).padStart(2, '0')
    }));

    return mergeServicesWithFallback(dbServices, fallbackServices).map((service) => ({
      id: service.id || null,
      slug: service.slug,
      order_index: service.order_index,
      title: service.title,
      status: service.status,
      updated_at: service.updated_at || null,
      numberLabel: service.numberLabel,
      isReadOnly: !service.id
    }));
  } catch (error) {
    return fallbackServices.map((service) => ({
      id: null,
      slug: service.slug,
      order_index: service.order_index,
      title: service.title,
      status: service.status,
      updated_at: null,
      numberLabel: service.numberLabel,
      isReadOnly: true
    }));
  }
}

async function getServiceById(id) {
  try {
    await syncServicesFromStaticFiles();
  } catch (error) {
    // Editing an existing DB service should still work even if static hydration fails.
  }

  const rows = await query(
    `SELECT id, slug, order_index, title, excerpt, meta_description, hero_summary, overview_html, approach_html,
            consultation_title, consultation_text, sidebar_cta_title, sidebar_cta_text, key_points_json,
            statutes_json, related_service_slugs_json, status
     FROM service_pages
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  if (!rows.length) {
    return null;
  }

  const fallback = parseFallbackServices().find((item) => item.slug === rows[0].slug);
  const service = mergeServicesWithFallback([formatServiceRecord(rows[0])], fallback ? [fallback] : [])[0];
  return {
    ...service,
    key_points_text: service.key_points.join('\n'),
    statutes_text: service.statutes.join('\n'),
    related_service_slugs_text: service.related_service_slugs.join('\n')
  };
}

async function createServicePage(input) {
  await ensureServiceTable();
  const { errors, value } = normalizeServiceInput(input);
  if (errors.length) {
    return { errors };
  }

  try {
    const slug = await ensureUniqueServiceSlug(value.requestedSlug);
    const result = await query(
      `INSERT INTO service_pages
       (slug, order_index, title, excerpt, meta_description, hero_summary, overview_html, approach_html,
        consultation_title, consultation_text, sidebar_cta_title, sidebar_cta_text, key_points_json,
        statutes_json, related_service_slugs_json, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        slug,
        value.orderIndex,
        value.title,
        value.excerpt,
        value.metaDescription,
        value.heroSummary,
        value.overviewHtml,
        value.approachHtml,
        value.consultationTitle,
        value.consultationText,
        value.sidebarCtaTitle,
        value.sidebarCtaText,
        serializeList(value.keyPoints),
        serializeList(value.statutes),
        serializeList(value.relatedServiceSlugs.filter((item) => item !== slug)),
        value.status
      ]
    );

    return { id: result.insertId, slug };
  } catch (error) {
    return { errors: ['Database connection unavailable. Service pages cannot be created until MySQL is connected.'] };
  }
}

async function updateServicePage(id, input) {
  await ensureServiceTable();
  const { errors, value } = normalizeServiceInput(input);
  if (errors.length) {
    return { errors };
  }

  try {
    const slug = await ensureUniqueServiceSlug(value.requestedSlug, id);
    await query(
      `UPDATE service_pages
       SET slug = ?, order_index = ?, title = ?, excerpt = ?, meta_description = ?, hero_summary = ?,
           overview_html = ?, approach_html = ?, consultation_title = ?, consultation_text = ?,
           sidebar_cta_title = ?, sidebar_cta_text = ?, key_points_json = ?, statutes_json = ?,
           related_service_slugs_json = ?, status = ?
       WHERE id = ?`,
      [
        slug,
        value.orderIndex,
        value.title,
        value.excerpt,
        value.metaDescription,
        value.heroSummary,
        value.overviewHtml,
        value.approachHtml,
        value.consultationTitle,
        value.consultationText,
        value.sidebarCtaTitle,
        value.sidebarCtaText,
        serializeList(value.keyPoints),
        serializeList(value.statutes),
        serializeList(value.relatedServiceSlugs.filter((item) => item !== slug)),
        value.status,
        id
      ]
    );

    return { id, slug };
  } catch (error) {
    return { errors: ['Database connection unavailable. Service page updates cannot be saved until MySQL is connected.'] };
  }
}

async function deleteServicePage(id) {
  await ensureServiceTable();
  await query('DELETE FROM service_pages WHERE id = ? LIMIT 1', [id]);
}

module.exports = {
  createServicePage,
  deleteServicePage,
  getAllServicesForAdmin,
  getPublishedServices,
  getServiceById,
  syncServicesFromStaticFiles,
  updateServicePage
};
