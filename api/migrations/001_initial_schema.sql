-- Migration 001: Initial portal schema
-- Creates all core tables with current column definitions

CREATE TABLE IF NOT EXISTS portal_regions (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_units (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    region_id VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_portal_units_region FOREIGN KEY (region_id) REFERENCES portal_regions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_circles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    region_id VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_portal_circles_region FOREIGN KEY (region_id) REFERENCES portal_regions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_campuses (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_users (
    id VARCHAR(36) PRIMARY KEY,
    first_name VARCHAR(128) NOT NULL,
    middle_name VARCHAR(128),
    last_name VARCHAR(128),
    username VARCHAR(64) UNIQUE,
    phone VARCHAR(20) NULL UNIQUE,
    alt_phone VARCHAR(20) NULL,
    password VARCHAR(255) NOT NULL,
    date_of_birth VARCHAR(8),
    role ENUM('admin','zonal_secretary','regional_president','unit_president','campus_president','member') NOT NULL,
    unit_id VARCHAR(36),
    region_id VARCHAR(36) NULL,
    circle_id VARCHAR(36),
    campus_id VARCHAR(36),
    membership_type ENUM('unit','circle','campus') NULL,
    membership_id VARCHAR(36) NULL,
    permission_overrides JSON,
    avatar_url TEXT,
    title VARCHAR(255),
    title_assigned_by VARCHAR(36),
    title_assigned_at TIMESTAMP NULL,
    title_color VARCHAR(32) NULL,
    status ENUM('active','inactive','migrated','revoked') DEFAULT 'active',
    inactivated_by VARCHAR(36) NULL,
    inactive_reason JSON NULL,
    inactivated_at TIMESTAMP NULL,
    revoked_by VARCHAR(36) NULL,
    revoke_reason TEXT NULL,
    revoked_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES portal_units(id) ON DELETE SET NULL,
    FOREIGN KEY (region_id) REFERENCES portal_regions(id) ON DELETE SET NULL,
    FOREIGN KEY (circle_id) REFERENCES portal_circles(id) ON DELETE SET NULL,
    FOREIGN KEY (campus_id) REFERENCES portal_campuses(id) ON DELETE SET NULL,
    INDEX idx_pu_role (role),
    INDEX idx_pu_unit (unit_id),
    INDEX idx_pu_circle (circle_id),
    INDEX idx_pu_campus (campus_id),
    INDEX idx_pu_phone (phone),
    INDEX idx_pu_username (username),
    INDEX idx_pu_status (status),
    INDEX idx_pu_region (region_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_region_units (
    id VARCHAR(36) PRIMARY KEY,
    regional_president_id VARCHAR(36) NOT NULL,
    unit_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (regional_president_id) REFERENCES portal_users(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES portal_units(id) ON DELETE CASCADE,
    UNIQUE KEY uq_rg (regional_president_id, unit_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_migration_requests (
    id VARCHAR(36) PRIMARY KEY,
    member_id VARCHAR(36) NOT NULL,
    from_unit_id VARCHAR(36) NOT NULL,
    to_unit_id VARCHAR(36) NULL,
    to_location VARCHAR(255) NULL,
    reason TEXT NULL,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    requested_by VARCHAR(36) NOT NULL,
    resolved_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    seen_at TIMESTAMP NULL,
    FOREIGN KEY (member_id) REFERENCES portal_users(id) ON DELETE CASCADE,
    FOREIGN KEY (from_unit_id) REFERENCES portal_units(id),
    FOREIGN KEY (to_unit_id) REFERENCES portal_units(id),
    FOREIGN KEY (requested_by) REFERENCES portal_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_messages (
    id VARCHAR(36) PRIMARY KEY,
    sender_id VARCHAR(36) NOT NULL,
    recipient_id VARCHAR(36),
    recipient_role ENUM('admin','zonal_secretary','regional_president','unit_president','member'),
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    is_broadcast TINYINT(1) DEFAULT 0,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES portal_users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES portal_users(id) ON DELETE CASCADE,
    INDEX idx_pm_sender (sender_id),
    INDEX idx_pm_recipient (recipient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_perf_forms (
    id VARCHAR(36) PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_by VARCHAR(36) NOT NULL,
    scope_type VARCHAR(20) DEFAULT 'zone',
    scope_region_id VARCHAR(36) NULL,
    scope_region_ids TEXT NULL,
    scope_unit_id VARCHAR(36),
    scope_unit_ids TEXT NULL,
    scope_circle_id VARCHAR(36) NULL,
    scope_campus_id VARCHAR(36) NULL,
    period VARCHAR(50),
    is_active TINYINT(1) DEFAULT 1,
    is_template TINYINT(1) DEFAULT 0,
    template_key VARCHAR(100) NULL,
    is_public TINYINT(1) DEFAULT 0,
    banner_image VARCHAR(500) NULL,
    banner_text VARCHAR(120) NULL,
    banner_zone_text VARCHAR(80) NULL,
    theme_primary_color VARCHAR(20) DEFAULT '#2563eb',
    title_color VARCHAR(20) NULL,
    title_font_size INT NULL,
    title_font_weight VARCHAR(10) NULL,
    description_color VARCHAR(20) NULL,
    description_font_size INT NULL,
    description_font_weight VARCHAR(10) NULL,
    footer_bg_color VARCHAR(20) NULL,
    footer_text_color VARCHAR(20) NULL,
    footer_pattern_color VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES portal_users(id) ON DELETE CASCADE,
    FOREIGN KEY (scope_unit_id) REFERENCES portal_units(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_perf_fields (
    id VARCHAR(36) PRIMARY KEY,
    form_id VARCHAR(36) NOT NULL,
    type VARCHAR(32) NOT NULL,
    label VARCHAR(500) NOT NULL,
    description TEXT,
    options JSON,
    is_required TINYINT(1) DEFAULT 1,
    display_order INT DEFAULT 0,
    max_value INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES portal_perf_forms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_perf_responses (
    id VARCHAR(36) PRIMARY KEY,
    form_id VARCHAR(36) NOT NULL,
    member_id VARCHAR(36) NOT NULL,
    response_data JSON NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES portal_perf_forms(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES portal_users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_pr (form_id, member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_perf_reviews (
    id VARCHAR(36) PRIMARY KEY,
    response_id VARCHAR(36) NOT NULL,
    reviewer_id VARCHAR(36) NOT NULL,
    comment TEXT,
    rating INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (response_id) REFERENCES portal_perf_responses(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES portal_users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_perf_review (response_id, reviewer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_perf_response_notification_views (
    response_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (response_id, user_id),
    FOREIGN KEY (response_id) REFERENCES portal_perf_responses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES portal_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_edit_requests (
    id VARCHAR(36) PRIMARY KEY,
    member_id VARCHAR(36) NOT NULL,
    changes JSON NOT NULL,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    reviewed_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    FOREIGN KEY (member_id) REFERENCES portal_users(id) ON DELETE CASCADE,
    INDEX idx_per_member (member_id),
    INDEX idx_per_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
