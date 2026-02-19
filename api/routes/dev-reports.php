<?php
/**
 * Dev Reports API Routes
 * Allows users to report bugs/issues from the utilities pages
 */

/**
 * POST /dev-reports
 * Submit a bug report or issue
 * Body: { name, email, issueType, description, pageUrl, browserInfo }
 */
function submitDevReport(): array
{
    $data = json_decode(file_get_contents('php://input'), true);

    $name = trim($data['name'] ?? '');
    $email = trim($data['email'] ?? '');
    $issueType = $data['issueType'] ?? 'bug';
    $description = trim($data['description'] ?? '');
    $pageUrl = trim($data['pageUrl'] ?? '');
    $browserInfo = trim($data['browserInfo'] ?? '');

    // Validate required fields
    if (empty($name) || strlen($name) > 255) {
        http_response_code(400);
        return ['error' => 'Name is required (max 255 characters)'];
    }

    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        return ['error' => 'A valid email is required'];
    }

    if (empty($description) || strlen($description) < 10) {
        http_response_code(400);
        return ['error' => 'Description must be at least 10 characters'];
    }

    if (strlen($description) > 5000) {
        http_response_code(400);
        return ['error' => 'Description too long (max 5000 characters)'];
    }

    // Validate issue type
    $validTypes = ['bug', 'suggestion', 'question', 'other'];
    if (!in_array($issueType, $validTypes)) {
        $issueType = 'bug';
    }

    // Sanitize
    $name = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
    $pageUrl = filter_var($pageUrl, FILTER_SANITIZE_URL);
    if (strlen($pageUrl) > 2048) {
        $pageUrl = substr($pageUrl, 0, 2048);
    }
    $browserInfo = htmlspecialchars(substr($browserInfo, 0, 1000), ENT_QUOTES, 'UTF-8');

    $db = getDB();

    // Store in database
    $stmt = $db->prepare(
        "INSERT INTO dev_reports (name, email, issue_type, page_url, description, browser_info)
         VALUES (?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([$name, $email, $issueType, $pageUrl, $description, $browserInfo]);

    // Send email notification
    $typeLabel = ucfirst($issueType);
    $subject = "[SIO Delhi] {$typeLabel}: " . substr(strip_tags($description), 0, 60);

    $body = "
<html><body style='font-family: sans-serif; color: #333;'>
<h2 style='color: #ff3b3b;'>New {$typeLabel} Report</h2>
<table style='border-collapse: collapse; width: 100%;'>
<tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Name</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{$name}</td></tr>
<tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Email</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{$email}</td></tr>
<tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Type</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{$typeLabel}</td></tr>
<tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Page URL</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{$pageUrl}</td></tr>
<tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Browser</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{$browserInfo}</td></tr>
</table>
<h3 style='margin-top: 20px;'>Description</h3>
<div style='background: #f5f5f5; padding: 16px; border-radius: 8px; white-space: pre-wrap;'>" . htmlspecialchars($description, ENT_QUOTES, 'UTF-8') . "</div>
</body></html>";

    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=UTF-8\r\n";
    $headers .= "From: noreply@siodelhi.org\r\n";
    $headers .= "Reply-To: {$email}\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

    $mailSent = mail('dev@siodelhi.org', $subject, $body, $headers, '-f noreply@siodelhi.org');

    return ['message' => 'Report submitted successfully', 'emailSent' => $mailSent];
}

/**
 * GET /dev-reports
 * List all dev reports (admin only)
 */
function getDevReports(): array
{
    $db = getDB();
    $stmt = $db->query("SELECT * FROM dev_reports ORDER BY created_at DESC");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * DELETE /dev-reports/:id
 * Delete a dev report (admin only)
 */
function deleteDevReport(string $id): array
{
    $db = getDB();
    $stmt = $db->prepare("DELETE FROM dev_reports WHERE id = ?");
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        return ['error' => 'Report not found'];
    }

    return ['message' => 'Report deleted'];
}
