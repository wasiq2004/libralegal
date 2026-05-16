const { query } = require('./db');
const { stripHtml } = require('./security');

const DEFAULT_HOMEPAGE_CONTENT = {
  meta_description: 'Libra Legal Consultancy is a UAE-based legal advisory firm delivering expert counsel across the full spectrum of commercial, regulatory, and private client matters.',
  hero: {
    eyebrow: 'Excellence in Legal Solutions',
    title: 'Comprehensive Legal Counsel for Businesses and Individuals Across the UAE',
    intro: 'Libra Legal Consultancy is a UAE-based legal advisory firm delivering refined counsel across business, regulatory, and personal legal matters. We advise businesses and individuals on their most significant legal challenges. Our approach pairs careful legal examination with straightforward guidance, helping our clients reach their goals with confidence and ease. From first meeting to final outcome, we remain actively engaged, offering steady legal support throughout every phase of their matter.',
    primary_label: 'Speak to Our Legal Team',
    primary_href: 'contact.html',
    secondary_label: 'Our Practice Areas',
    secondary_href: 'services.html',
    background_image_url: 'https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?w=1600&q=80'
  },
  practice: {
    label: 'The Practice',
    title: 'A Full-Service Practice of Proven Expertise, Refined Judgment, and Measured Excellence',
    paragraph_1: 'A UAE-based specialist legal consultancy combining deep local expertise with international standards.',
    paragraph_2: 'We provide strategic, commercially focused legal solutions across a range of sectors, supporting clients with regulatory compliance, corporate structuring, dispute resolution, and risk management. Our approach is rooted in practical insight, responsiveness, and a commitment to delivering clear, results-driven advice',
    cta_label: 'About the Firm',
    cta_href: 'about.html',
    image_url: '/assets/image2.jpg'
  },
  expertise: {
    label: 'Expertise',
    title: 'Practice of Areas',
    cta_label: 'View All Services →',
    cta_href: 'services.html',
    active_index: 2,
    items: [
      {
        number: '01',
        title: 'Healthcare & Medico-Legal',
        image_url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&q=80',
        image_alt: 'Healthcare & Medico-Legal',
        href: 'services/healthcare_medical.html'
      },
      {
        number: '02',
        title: 'Real Estate & Property Law',
        image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80',
        image_alt: 'Real Estate & Property Law',
        href: 'services/real_estate.html'
      },
      {
        number: '03',
        title: 'Contract Drafting & Legal Review',
        image_url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&q=80',
        image_alt: 'Contract Drafting & Legal Review',
        href: 'services/contract_drafting.html'
      },
      {
        number: '04',
        title: 'Debt Recovery and Legal Enforcement',
        image_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80',
        image_alt: 'Debt Recovery and Legal Enforcement',
        href: 'services/debt_recovery.html'
      },
      {
        number: '05',
        title: 'Insurance Law',
        image_url: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80',
        image_alt: 'Insurance Law',
        href: 'services/insurance_risk.html'
      },
      {
        number: '06',
        title: 'UAE Company Formation',
        image_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80',
        image_alt: 'UAE Company Formation',
        href: 'services/uae_company_formation.html'
      }
    ]
  },
  why: {
    label: 'Why Libra',
    title: 'Why Libra Legal Consultancy',
    quote: 'In a world shaped by legal rules, regulatory shifts, and unseen risks, we stand as a steady guide — offering our clients clarity, precision, and the confidence to move forward decisively.',
    items: [
      {
        number: '01',
        title: 'Regulatory Depth',
        text: "Our team has extensive experience navigating the UAE's regulatory environment. We advise with precision, ensuring you stay compliant and your interests remain safeguarded."
      },
      {
        number: '02',
        title: 'Strategic Approach',
        text: 'We pair deep legal knowledge with practical insight. Every matter is assessed with a clear view of your situation, the risks involved, and the outcome you need so you can move forward with confidence.'
      },
      {
        number: '03',
        title: 'Dispute Expertise',
        text: 'When conflicts arise, we handle them from early negotiation through to formal proceedings and enforcement. We represent clients across the UAE and beyond, focused on resolving matters efficiently and protecting what matters to you.'
      },
      {
        number: '04',
        title: 'Client-Focused Execution',
        text: 'From the outset through to resolution, we stay responsive and transparent. You work directly with senior lawyers and legal professionals who keep you informed and supported at every step'
      }
    ]
  },
  testimonials: {
    label: 'Client Testimonials',
    title: 'Trusted by Clients Across Complex Legal Matters',
    intro: 'Our clients value clear advice, steady execution, and practical legal support that protects their position when the stakes are high.',
    items: [
      {
        text: 'Libra Legal Consultancy handled our regulatory matter with clarity and discipline. Their advice was practical, commercially sound, and delivered with real urgency when we needed it most.',
        name: 'Sarah M.',
        role: 'Healthcare Executive',
        photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
        photo_alt: 'Sarah M.'
      },
      {
        text: 'Their team guided us through a sensitive contract review with precision and speed. We felt informed at every stage, and the final outcome gave us confidence to move forward.',
        name: 'Ahmed R.',
        role: 'Managing Director',
        photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
        photo_alt: 'Ahmed R.'
      },
      {
        text: 'What stood out most was the combination of legal depth and commercial judgment. They were responsive, strategic, and always clear about the risks and next steps.',
        name: 'Leila K.',
        role: 'Property Investor',
        photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
        photo_alt: 'Leila K.'
      },
      {
        text: 'From early negotiation through enforcement, the firm stayed calm, focused, and exceptionally well prepared. Their support made a difficult dispute far more manageable for our business.',
        name: 'James T.',
        role: 'Operations Partner',
        photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80',
        photo_alt: 'James T.'
      },
      {
        text: 'We appreciated the direct access to senior legal professionals and the transparency throughout the matter. Every recommendation was measured, thoughtful, and easy to act on.',
        name: 'Nadia F.',
        role: 'Corporate Client',
        photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&q=80',
        photo_alt: 'Nadia F.'
      },
      {
        text: 'Their company formation support was efficient from start to finish. The process felt structured, the advice was clear, and we always knew exactly what was required at each step.',
        name: 'Omar H.',
        role: 'Founder',
        photo_url: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&q=80',
        photo_alt: 'Omar H.'
      }
    ]
  },
  cta: {
    label: 'Case Briefing',
    title: 'Speak to Our Legal Team',
    text: 'Whether you need legal advice, regulatory guidance, dispute resolution, corporate structuring, risk management, or any other legal matter — our team is ready to assist.',
    button_label: 'Request a Free Consultation',
    button_href: 'contact.html',
    background_image_url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600&q=80'
  }
};

let ensureHomepageTablePromise = null;

function cloneDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_HOMEPAGE_CONTENT));
}

function cleanText(value, maxLength = 4000) {
  return stripHtml(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function cleanHref(value, fallback) {
  const href = cleanText(value, 2048);
  return href || fallback;
}

function cleanImage(value, fallback) {
  const image = cleanText(value, 2048);
  return image || fallback;
}

function mergeSection(defaultSection, incomingSection) {
  return {
    ...defaultSection,
    ...(incomingSection || {})
  };
}

function mergeList(defaultItems, incomingItems, mapItem) {
  return defaultItems.map((defaultItem, index) => {
    const merged = {
      ...defaultItem,
      ...((incomingItems || [])[index] || {})
    };
    return mapItem ? mapItem(merged, index) : merged;
  });
}

function mergeHomepageContent(storedContent) {
  const defaults = cloneDefaults();
  const content = storedContent || {};

  return {
    meta_description: content.meta_description || defaults.meta_description,
    hero: mergeSection(defaults.hero, content.hero),
    practice: mergeSection(defaults.practice, content.practice),
    expertise: {
      ...mergeSection(defaults.expertise, content.expertise),
      items: mergeList(defaults.expertise.items, content.expertise?.items)
    },
    why: {
      ...mergeSection(defaults.why, content.why),
      items: mergeList(defaults.why.items, content.why?.items)
    },
    testimonials: {
      ...mergeSection(defaults.testimonials, content.testimonials),
      items: mergeList(defaults.testimonials.items, content.testimonials?.items)
    },
    cta: mergeSection(defaults.cta, content.cta)
  };
}

function parseStoredContent(payloadJson) {
  if (!payloadJson) {
    return cloneDefaults();
  }

  try {
    return mergeHomepageContent(JSON.parse(payloadJson));
  } catch (error) {
    return cloneDefaults();
  }
}

async function ensureHomepageTable() {
  if (!ensureHomepageTablePromise) {
    ensureHomepageTablePromise = query(`
      CREATE TABLE IF NOT EXISTS homepage_content (
        id TINYINT UNSIGNED NOT NULL,
        payload_json LONGTEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `).catch((error) => {
      ensureHomepageTablePromise = null;
      throw error;
    });
  }

  return ensureHomepageTablePromise;
}

function buildAdminShape(content, updatedAt = null) {
  const merged = mergeHomepageContent(content);
  return {
    ...merged,
    updated_at: updatedAt
  };
}

function normalizeHomepageInput(input) {
  const defaults = cloneDefaults();
  const expertiseItems = defaults.expertise.items.map((item, index) => ({
    number: cleanText(input[`expertise_number_${index + 1}`], 10) || item.number,
    title: cleanText(input[`expertise_title_${index + 1}`], 180),
    image_url: cleanImage(input[`expertise_image_url_${index + 1}`], item.image_url),
    image_alt: cleanText(input[`expertise_image_alt_${index + 1}`], 180) || cleanText(input[`expertise_title_${index + 1}`], 180) || item.image_alt,
    href: cleanHref(input[`expertise_href_${index + 1}`], item.href)
  }));

  const whyItems = defaults.why.items.map((item, index) => ({
    number: cleanText(input[`why_number_${index + 1}`], 10) || item.number,
    title: cleanText(input[`why_title_${index + 1}`], 180),
    text: cleanText(input[`why_text_${index + 1}`], 2000)
  }));

  const testimonialItems = defaults.testimonials.items.map((item, index) => ({
    text: cleanText(input[`testimonial_text_${index + 1}`], 2500),
    name: cleanText(input[`testimonial_name_${index + 1}`], 160),
    role: cleanText(input[`testimonial_role_${index + 1}`], 160),
    photo_url: cleanImage(input[`testimonial_photo_url_${index + 1}`], item.photo_url),
    photo_alt: cleanText(input[`testimonial_photo_alt_${index + 1}`], 160) || cleanText(input[`testimonial_name_${index + 1}`], 160) || item.photo_alt
  }));

  const content = {
    meta_description: cleanText(input.meta_description, 255) || defaults.meta_description,
    hero: {
      eyebrow: cleanText(input.hero_eyebrow, 120) || defaults.hero.eyebrow,
      title: cleanText(input.hero_title, 220),
      intro: cleanText(input.hero_intro, 4000),
      primary_label: cleanText(input.hero_primary_label, 120) || defaults.hero.primary_label,
      primary_href: cleanHref(input.hero_primary_href, defaults.hero.primary_href),
      secondary_label: cleanText(input.hero_secondary_label, 120) || defaults.hero.secondary_label,
      secondary_href: cleanHref(input.hero_secondary_href, defaults.hero.secondary_href),
      background_image_url: cleanImage(input.hero_background_image_url, defaults.hero.background_image_url)
    },
    practice: {
      label: cleanText(input.practice_label, 120) || defaults.practice.label,
      title: cleanText(input.practice_title, 240),
      paragraph_1: cleanText(input.practice_paragraph_1, 3000),
      paragraph_2: cleanText(input.practice_paragraph_2, 3000),
      cta_label: cleanText(input.practice_cta_label, 120) || defaults.practice.cta_label,
      cta_href: cleanHref(input.practice_cta_href, defaults.practice.cta_href),
      image_url: cleanImage(input.practice_image_url, defaults.practice.image_url)
    },
    expertise: {
      label: cleanText(input.expertise_label, 120) || defaults.expertise.label,
      title: cleanText(input.expertise_title, 220),
      cta_label: cleanText(input.expertise_cta_label, 120) || defaults.expertise.cta_label,
      cta_href: cleanHref(input.expertise_cta_href, defaults.expertise.cta_href),
      active_index: Math.min(6, Math.max(1, Number.parseInt(input.expertise_active_index, 10) || defaults.expertise.active_index)),
      items: expertiseItems
    },
    why: {
      label: cleanText(input.why_label, 120) || defaults.why.label,
      title: cleanText(input.why_title, 220),
      quote: cleanText(input.why_quote, 3000),
      items: whyItems
    },
    testimonials: {
      label: cleanText(input.testimonials_label, 120) || defaults.testimonials.label,
      title: cleanText(input.testimonials_title, 220),
      intro: cleanText(input.testimonials_intro, 2500),
      items: testimonialItems
    },
    cta: {
      label: cleanText(input.cta_label, 120) || defaults.cta.label,
      title: cleanText(input.cta_title, 220),
      text: cleanText(input.cta_text, 3000),
      button_label: cleanText(input.cta_button_label, 120) || defaults.cta.button_label,
      button_href: cleanHref(input.cta_button_href, defaults.cta.button_href),
      background_image_url: cleanImage(input.cta_background_image_url, defaults.cta.background_image_url)
    }
  };

  const errors = [];

  if (!content.hero.title) errors.push('Hero title is required.');
  if (!content.hero.intro) errors.push('Hero intro is required.');
  if (!content.practice.title) errors.push('Practice section title is required.');
  if (!content.practice.paragraph_1) errors.push('Practice section first paragraph is required.');
  if (!content.practice.paragraph_2) errors.push('Practice section second paragraph is required.');
  if (!content.expertise.title) errors.push('Expertise section title is required.');
  if (content.expertise.items.some((item) => !item.title)) errors.push('All six expertise card titles are required.');
  if (!content.why.title) errors.push('Why Libra section title is required.');
  if (content.why.items.some((item) => !item.title || !item.text)) errors.push('All Why Libra cards require both a title and description.');
  if (!content.testimonials.title) errors.push('Testimonials section title is required.');
  if (!content.testimonials.intro) errors.push('Testimonials intro is required.');
  if (content.testimonials.items.some((item) => !item.text || !item.name || !item.role)) errors.push('All six testimonials require text, client name, and role.');
  if (!content.cta.title) errors.push('CTA title is required.');
  if (!content.cta.text) errors.push('CTA text is required.');

  return {
    errors,
    value: content
  };
}

async function getHomepageContent() {
  try {
    await ensureHomepageTable();
    const rows = await query(
      'SELECT payload_json FROM homepage_content WHERE id = 1 LIMIT 1'
    );

    if (!rows.length) {
      return cloneDefaults();
    }

    return parseStoredContent(rows[0].payload_json);
  } catch (error) {
    return cloneDefaults();
  }
}

async function getHomepageContentForAdmin() {
  try {
    await ensureHomepageTable();
    const rows = await query(
      'SELECT payload_json, updated_at FROM homepage_content WHERE id = 1 LIMIT 1'
    );

    if (!rows.length) {
      return buildAdminShape(cloneDefaults(), null);
    }

    return buildAdminShape(parseStoredContent(rows[0].payload_json), rows[0].updated_at || null);
  } catch (error) {
    return buildAdminShape(cloneDefaults(), null);
  }
}

async function updateHomepageContent(input) {
  await ensureHomepageTable();
  const { errors, value } = normalizeHomepageInput(input);
  if (errors.length) {
    return { errors, content: buildAdminShape(value, null) };
  }

  try {
    await query(
      `INSERT INTO homepage_content (id, payload_json)
       VALUES (1, ?)
       ON DUPLICATE KEY UPDATE payload_json = VALUES(payload_json)`,
      [JSON.stringify(value)]
    );

    return { content: buildAdminShape(value, new Date()) };
  } catch (error) {
    return { errors: ['Database connection unavailable. Homepage changes cannot be saved until MySQL is connected.'], content: buildAdminShape(value, null) };
  }
}

module.exports = {
  getHomepageContent,
  getHomepageContentForAdmin,
  updateHomepageContent
};
