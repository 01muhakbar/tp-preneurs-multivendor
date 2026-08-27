-- ============================================================
-- Script SQL: Buat Tabel Duitku yang Hilang di Hostinger
-- Jalankan via phpMyAdmin atau SSH MySQL di server Hostinger
-- Aman dijalankan berulang kali (IF NOT EXISTS)
-- ============================================================

-- 1. Tabel utama untuk menyimpan percobaan pembayaran Duitku
CREATE TABLE IF NOT EXISTS `order_payment_attempts` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `provider` ENUM('DUITKU') NOT NULL DEFAULT 'DUITKU',
  `status` ENUM('CREATED','PENDING','PAID','FAILED','CANCELLED','EXPIRED','UNKNOWN') NOT NULL DEFAULT 'CREATED',
  `requires_manual_review` TINYINT(1) NOT NULL DEFAULT 0,
  `manual_review_reason` VARCHAR(120) DEFAULT NULL,
  `manual_review_created_at` DATETIME DEFAULT NULL,
  `manual_reviewed_by_user_id` INT UNSIGNED DEFAULT NULL,
  `manual_reviewed_at` DATETIME DEFAULT NULL,
  `merchant_order_id` VARCHAR(50) NOT NULL,
  `provider_reference` VARCHAR(160) DEFAULT NULL,
  `payment_url` TEXT DEFAULT NULL,
  `amount` BIGINT UNSIGNED NOT NULL,
  `currency` CHAR(3) NOT NULL DEFAULT 'IDR',
  `expiry_period_minutes` INT UNSIGNED NOT NULL DEFAULT 60,
  `expires_at` DATETIME DEFAULT NULL,
  `created_at_provider` DATETIME DEFAULT NULL,
  `paid_at` DATETIME DEFAULT NULL,
  `cancelled_at` DATETIME DEFAULT NULL,
  `expired_at` DATETIME DEFAULT NULL,
  `idempotency_key_hash` CHAR(64) NOT NULL,
  `request_fingerprint` CHAR(64) NOT NULL,
  `provider_last_code` VARCHAR(40) DEFAULT NULL,
  `provider_last_message` VARCHAR(255) DEFAULT NULL,
  `last_reconciled_at` DATETIME DEFAULT NULL,
  `reconcile_attempt_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `next_reconcile_at` DATETIME DEFAULT NULL,
  `last_reconcile_error_code` VARCHAR(64) DEFAULT NULL,
  `last_reconcile_error_at` DATETIME DEFAULT NULL,
  `created_by_user_id` INT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `merchant_order_id` (`merchant_order_id`),
  UNIQUE KEY `provider_reference` (`provider_reference`),
  KEY `order_id` (`order_id`),
  KEY `idempotency_key_hash` (`idempotency_key_hash`),
  CONSTRAINT `opa_order_fk` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `opa_user_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================

-- 2. Tabel untuk log event tiap percobaan pembayaran
CREATE TABLE IF NOT EXISTS `order_payment_attempt_events` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `payment_attempt_id` INT UNSIGNED NOT NULL,
  `duitku_callback_inbox_id` INT UNSIGNED DEFAULT NULL,
  `event_type` ENUM('CREATE_INVOICE','CALLBACK','RECONCILE','MANUAL_UPDATE') NOT NULL DEFAULT 'CREATE_INVOICE',
  `occurrence_key` CHAR(36) NOT NULL,
  `provider_call_id` CHAR(36) DEFAULT NULL,
  `merchant_order_id` VARCHAR(50) DEFAULT NULL,
  `provider_reference` VARCHAR(160) DEFAULT NULL,
  `amount_normalized` BIGINT DEFAULT NULL,
  `provider_status_code` VARCHAR(40) DEFAULT NULL,
  `payment_code` VARCHAR(40) DEFAULT NULL,
  `signature_state` ENUM('NOT_APPLICABLE','VALID','INVALID','MISSING') NOT NULL DEFAULT 'NOT_APPLICABLE',
  `processing_result` ENUM('APPLIED','IGNORED','QUARANTINED') NOT NULL DEFAULT 'APPLIED',
  `event_hash` CHAR(64) NOT NULL,
  `duplicate_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `occurrence_key` (`occurrence_key`),
  KEY `payment_attempt_id` (`payment_attempt_id`),
  CONSTRAINT `opae_attempt_fk` FOREIGN KEY (`payment_attempt_id`) REFERENCES `order_payment_attempts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================

-- 3. Tabel untuk claim koleksi pembayaran (QRIS / Duitku)
CREATE TABLE IF NOT EXISTS `order_collection_claims` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `rail` ENUM('DUITKU_POP','QRIS_STATIC') NOT NULL,
  `claim_state` ENUM('CLAIMED','PAID','FAILED','EXPIRED','CANCELLED') NOT NULL DEFAULT 'CLAIMED',
  `claim_source` ENUM('DUITKU_CREATE_INVOICE','QRIS_FALLBACK','ADMIN_RECOVERY') NOT NULL,
  `order_payment_attempt_id` INT UNSIGNED DEFAULT NULL,
  `claimed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `paid_at` DATETIME DEFAULT NULL,
  `terminal_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_id` (`order_id`),
  KEY `order_payment_attempt_id` (`order_payment_attempt_id`),
  CONSTRAINT `occ_order_fk` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `occ_attempt_fk` FOREIGN KEY (`order_payment_attempt_id`) REFERENCES `order_payment_attempts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Verifikasi: jalankan ini setelah script di atas
-- ============================================================
-- SHOW TABLES LIKE 'order_payment_attempts';
-- SHOW TABLES LIKE 'order_payment_attempt_events';
-- SHOW TABLES LIKE 'order_collection_claims';
