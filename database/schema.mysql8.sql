CREATE DATABASE IF NOT EXISTS `libra_legal_cms`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE `libra_legal_cms`;

CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(190) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(120) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_login_at` DATETIME NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admin_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `blog_posts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(190) NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `category` VARCHAR(80) NOT NULL,
  `excerpt` VARCHAR(500) NOT NULL,
  `hero_image_url` VARCHAR(2048) NOT NULL,
  `meta_description` VARCHAR(255) NOT NULL,
  `content_html` LONGTEXT NOT NULL,
  `status` ENUM('draft', 'published') NOT NULL DEFAULT 'published',
  `published_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_blog_posts_slug` (`slug`),
  KEY `idx_blog_posts_status_published_at` (`status`, `published_at` DESC),
  KEY `idx_blog_posts_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `service_pages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(190) NOT NULL,
  `order_index` INT UNSIGNED NOT NULL DEFAULT 1,
  `title` VARCHAR(180) NOT NULL,
  `excerpt` VARCHAR(500) NOT NULL,
  `meta_description` VARCHAR(255) NOT NULL,
  `hero_summary` VARCHAR(500) NOT NULL,
  `overview_html` LONGTEXT NOT NULL,
  `approach_html` LONGTEXT NOT NULL,
  `consultation_title` VARCHAR(160) NOT NULL,
  `consultation_text` TEXT NOT NULL,
  `sidebar_cta_title` VARCHAR(160) NOT NULL,
  `sidebar_cta_text` TEXT NOT NULL,
  `key_points_json` LONGTEXT NOT NULL,
  `statutes_json` LONGTEXT NOT NULL,
  `related_service_slugs_json` LONGTEXT NOT NULL,
  `status` ENUM('draft', 'published') NOT NULL DEFAULT 'published',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_service_pages_slug` (`slug`),
  KEY `idx_service_pages_status_order` (`status`, `order_index`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `cms_sessions` (
  `session_id` VARCHAR(128) NOT NULL,
  `expires` BIGINT UNSIGNED NOT NULL,
  `data` MEDIUMTEXT NOT NULL,
  PRIMARY KEY (`session_id`),
  KEY `idx_cms_sessions_expires` (`expires`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `admin_users` (`email`, `password_hash`, `full_name`)
VALUES ('libralegalconsultancy@gmail.com', '$2a$12$9Y0/1Zf2X4O3Q6K7R8S9T.uVwXxYyZz0123456789abcdefghijk', 'Libra Legal Admin');
