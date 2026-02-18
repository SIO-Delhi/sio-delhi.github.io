<?php
/**
 * Server-Side Short Link Redirect
 * Fetches post metadata to serve Open Graph tags before redirecting.
 */

// Enable error reporting for debugging (disable in production)
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Path to API files
// Assuming directory structure:
// /root
//   /api
//   /public
//     s.php
// Check if config exists in current directory (Production/cPanel /api folder)
if (file_exists(__DIR__ . '/config.php')) {
    require_once __DIR__ . '/config.php';
    require_once __DIR__ . '/db.php';
} else {
    // Fallback to local dev structure (public/ -> api/)
    require_once __DIR__ . '/../api/config.php';
    require_once __DIR__ . '/../api/db.php';
}

// Get code from query string (via .htaccess rewrite) or path info
$code = $_GET['code'] ?? '';

// Fallback: Check PATH_INFO if code is empty
if (empty($code) && isset($_SERVER['PATH_INFO'])) {
    $code = ltrim($_SERVER['PATH_INFO'], '/');
}

// Basic validation
if (empty($code) || !preg_match('/^[a-zA-Z0-9]+$/', $code)) {
    // Redirect to home if invalid
    header("Location: /");
    exit();
}

try {
    $db = getDB();

    // Fetch Short Link + Post Data
    $stmt = $db->prepare("
        SELECT sl.full_url, sl.short_code, p.title, p.subtitle, p.image, p.content 
        FROM short_links sl
        LEFT JOIN posts p ON sl.post_id = p.id
        WHERE sl.short_code = ?
        LIMIT 1
    ");
    $stmt->execute([$code]);
    $link = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$link) {
        // Link not found - let the frontend handle the 404 or redirect to home
        header("Location: /s/" . $code);
        exit();
    }

    // Prepare Meta Data
    $destination = $link['full_url'];
    $title = $link['title'] ?? 'SIO Delhi';
    $description = $link['subtitle'] ?? substr(strip_tags($link['content'] ?? ''), 0, 160);
    $image = $link['image'] ?? 'https://siodelhi.org/siodel-cricular.png'; // Default fallback

    // Ensure image URL is absolute
    if ($image && strpos($image, 'http') !== 0) {
        $image = 'https://siodelhi.org' . $image;
    }

    // Increment click count (optional, can be done async or here)
    // We'll let the frontend API call also count it? 
    // Actually, if we redirect here, the frontend won't hit the 'resolve' API endpoint naturally unless we redirect to the specialized /s/ route.
    // BUT the goal is to redirect to the *final* destination.
    // If we redirect to `siodelhi.org/s/CODE` (the React route), we might loop if we are intercepting that route!
    // So we should redirect to `$destination` directly.

    // However, we still want to count the click.
    $updateStmt = $db->prepare("UPDATE short_links SET click_count = click_count + 1 WHERE short_code = ?");
    $updateStmt->execute([$code]);

} catch (Exception $e) {
    // On error, fallback to simple redirect loop to let frontend handle it (or home)
    header("Location: /");
    exit();
}

// Output HTML with OG Tags
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>
        <?php echo htmlspecialchars($title); ?>
    </title>
    <meta name="description" content="<?php echo htmlspecialchars($description); ?>">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="<?php echo htmlspecialchars($destination); ?>">
    <meta property="og:title" content="<?php echo htmlspecialchars($title); ?>">
    <meta property="og:description" content="<?php echo htmlspecialchars($description); ?>">
    <meta property="og:image" content="<?php echo htmlspecialchars($image); ?>">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="<?php echo htmlspecialchars($destination); ?>">
    <meta property="twitter:title" content="<?php echo htmlspecialchars($title); ?>">
    <meta property="twitter:description" content="<?php echo htmlspecialchars($description); ?>">
    <meta property="twitter:image" content="<?php echo htmlspecialchars($image); ?>">

    <!-- Redirect -->
    <meta http-equiv="refresh" content="0;url=<?php echo htmlspecialchars($destination); ?>">

    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            background: #09090b;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }

        .loader {
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top: 3px solid #ff3b3b;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% {
                transform: rotate(0deg);
            }

            100% {
                transform: rotate(360deg);
            }
        }
    </style>
</head>

<body>
    <div style="text-align: center;">
        <div class="loader" style="margin: 0 auto 20px;"></div>
        <p>Redirecting to content...</p>
        <p><a href="<?php echo htmlspecialchars($destination); ?>" style="color: #ff3b3b;">Click here if not
                redirected</a></p>
    </div>

    <script>
        // Use replace to simulate a redirect without keeping this intermediate page in history
        window.location.replace("<?php echo $destination; ?>");
    </script>
</body>

</html>