-- Short Links table for URL shortening
CREATE TABLE IF NOT EXISTS short_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    short_code VARCHAR(8) NOT NULL UNIQUE,
    full_url VARCHAR(2048) NOT NULL,
    post_id VARCHAR(255) NULL,
    click_count INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_short_code (short_code),
    INDEX idx_post_id (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
