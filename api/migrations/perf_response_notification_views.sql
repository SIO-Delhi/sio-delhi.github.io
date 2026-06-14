-- Tracks which unreviewed performance responses have been dismissed from the notification bell.
CREATE TABLE IF NOT EXISTS portal_perf_response_notification_views (
    response_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (response_id, user_id),
    FOREIGN KEY (response_id) REFERENCES portal_perf_responses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES portal_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
