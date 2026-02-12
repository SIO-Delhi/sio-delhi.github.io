# Database Schema — SIO Delhi Portal

> MySQL on cPanel shared hosting. All tables use InnoDB with utf8mb4_unicode_ci.

## Tables

### portal_regions
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(36) PK | UUID |
| name | VARCHAR(255) | e.g. "Region - Vikram Tandon" |
| created_at | TIMESTAMP | |

### portal_units
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(36) PK | UUID |
| name | VARCHAR(255) UNIQUE | |
| region_id | VARCHAR(36) FK | → portal_regions.id, SET NULL |
| created_at | TIMESTAMP | |

### portal_circles
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(36) PK | UUID |
| name | VARCHAR(255) UNIQUE | |
| region_id | VARCHAR(36) FK | → portal_regions.id, SET NULL |
| created_at | TIMESTAMP | |

### portal_campuses
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(36) PK | UUID |
| name | VARCHAR(255) UNIQUE | |
| created_at | TIMESTAMP | |

### portal_users
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(36) PK | UUID |
| first_name | VARCHAR(128) NOT NULL | |
| middle_name | VARCHAR(128) | |
| last_name | VARCHAR(128) | Nullable for single-name |
| username | VARCHAR(64) UNIQUE | Auto-generated from name+DOB |
| phone | VARCHAR(20) UNIQUE | Primary identifier |
| alt_phone | VARCHAR(20) | |
| password | VARCHAR(255) | Plaintext (Clerk handles real auth) |
| date_of_birth | VARCHAR(8) | DDMMYYYY format |
| role | ENUM | admin, zonal_secretary, regional_president, unit_president, campus_president, member |
| unit_id | VARCHAR(36) FK | → portal_units.id |
| region_id | VARCHAR(36) FK | → portal_regions.id (for regional_president) |
| circle_id | VARCHAR(36) FK | → portal_circles.id |
| campus_id | VARCHAR(36) FK | → portal_campuses.id |
| membership_type | ENUM | unit, circle, campus |
| membership_id | VARCHAR(36) | Points to unit/circle/campus ID |
| permission_overrides | JSON | Custom permissions per user |
| avatar_url | TEXT | |
| title | VARCHAR(255) | e.g. "Joint Secretary" |
| title_assigned_by | VARCHAR(36) | Who assigned the title |
| title_assigned_at | TIMESTAMP | |
| title_color | VARCHAR(32) | CSS color for title badge |
| status | ENUM | active, inactive, migrated, revoked |
| inactivated_by | VARCHAR(36) | Who set inactive |
| inactive_reason | JSON | Checklist of reasons |
| inactivated_at | TIMESTAMP | |
| revoked_by | VARCHAR(36) | Who revoked membership |
| revoke_reason | TEXT | |
| revoked_at | TIMESTAMP | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | Auto-update |

**Indexes:** role, unit_id, circle_id, campus_id, phone, username, status, region_id

### portal_region_units
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(36) PK | UUID |
| regional_president_id | VARCHAR(36) FK | → portal_users.id, CASCADE |
| unit_id | VARCHAR(36) FK | → portal_units.id, CASCADE |
| created_at | TIMESTAMP | |

**Unique:** (regional_president_id, unit_id)

### portal_migration_requests
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(36) PK | UUID |
| member_id | VARCHAR(36) FK | → portal_users.id, CASCADE |
| from_unit_id | VARCHAR(36) FK | → portal_units.id |
| to_unit_id | VARCHAR(36) FK | Nullable (zone/location migration) |
| to_location | VARCHAR(255) | Free text destination |
| reason | TEXT | |
| status | ENUM | pending, approved, rejected |
| requested_by | VARCHAR(36) FK | → portal_users.id |
| resolved_by | VARCHAR(36) | |
| created_at | TIMESTAMP | |
| resolved_at | TIMESTAMP | |
| seen_at | TIMESTAMP | |

### portal_messages
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(36) PK | UUID |
| sender_id | VARCHAR(36) FK | → portal_users.id, CASCADE |
| recipient_id | VARCHAR(36) FK | Direct message target |
| recipient_role | ENUM | For role-targeted messages |
| subject | VARCHAR(500) | |
| body | TEXT | |
| is_broadcast | TINYINT(1) | |
| is_read | TINYINT(1) | |
| created_at | TIMESTAMP | |

**Indexes:** sender_id, recipient_id

### portal_perf_forms
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(36) PK | UUID |
| title | VARCHAR(255) | |
| description | TEXT | |
| created_by | VARCHAR(36) FK | → portal_users.id, CASCADE |
| scope_unit_id | VARCHAR(36) FK | NULL = zone-wide |
| period | VARCHAR(50) | e.g. "2026-01" |
| is_active | TINYINT(1) | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### portal_perf_fields
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(36) PK | UUID |
| form_id | VARCHAR(36) FK | → portal_perf_forms.id, CASCADE |
| type | ENUM | mcq, msq, subjective, checkbox, number, rating |
| label | VARCHAR(500) | |
| description | TEXT | |
| options | JSON | For mcq/msq |
| is_required | TINYINT(1) | |
| display_order | INT | |
| max_value | INT | For rating type |
| created_at | TIMESTAMP | |

### portal_perf_responses
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(36) PK | UUID |
| form_id | VARCHAR(36) FK | → portal_perf_forms.id, CASCADE |
| member_id | VARCHAR(36) FK | → portal_users.id, CASCADE |
| response_data | JSON | field_id → answer map |
| submitted_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**Unique:** (form_id, member_id)

### portal_perf_reviews
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(36) PK | UUID |
| response_id | VARCHAR(36) FK | → portal_perf_responses.id, CASCADE |
| reviewer_id | VARCHAR(36) FK | → portal_users.id, CASCADE |
| comment | TEXT | |
| rating | INT | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**Unique:** (response_id, reviewer_id)

### portal_edit_requests
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(36) PK | UUID |
| member_id | VARCHAR(36) FK | → portal_users.id, CASCADE |
| changes | JSON | { field: newValue } |
| status | ENUM | pending, approved, rejected |
| reviewed_by | VARCHAR(36) | |
| created_at | TIMESTAMP | |
| reviewed_at | TIMESTAMP | |

**Indexes:** member_id, status

### _migrations
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT PK | |
| filename | VARCHAR(255) UNIQUE | e.g. "001_initial_schema.sql" |
| applied_at | TIMESTAMP | |
