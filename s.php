<?php
/**
 * Server-Side Short Link Redirect
 * Fetches post metadata via the API to serve Open Graph tags before redirecting.
 *
 * This file lives in public_html (siodelhi.org) and calls the API
 * at api.siodelhi.org to resolve short links. No local DB access needed.
 */

ini_set('display_errors', 0);
error_reporting(E_ALL);

define('API_BASE', 'https://api.siodelhi.org');
define('SITE_URL', 'https://siodelhi.org');

// Get code from query string (via .htaccess rewrite) or path info
$code = $_GET['code'] ?? '';

// Fallback: Check PATH_INFO if code is empty
if (empty($code) && isset($_SERVER['PATH_INFO'])) {
    $code = ltrim($_SERVER['PATH_INFO'], '/');
}

// Basic validation
if (empty($code) || !preg_match('/^[a-zA-Z0-9]+$/', $code)) {
    header("Location: /");
    exit();
}

try {
    // Resolve short link via API
    $apiUrl = API_BASE . '/api/short-links/resolve/' . urlencode($code);

    $ch = curl_init($apiUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 5,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        header("Location: /");
        exit();
    }

    $data = json_decode($response, true);
    if (!$data || empty($data['fullUrl'])) {
        header("Location: /");
        exit();
    }

    $destination = $data['fullUrl'];
    $postId = $data['postId'] ?? null;

    // If we have a post ID, fetch post metadata for OG tags
    $title = 'SIO Delhi';
    $description = 'The mission of the Students Islamic Organisation of India (SIO) is to prepare the students and youth for the reconstruction of the society in the light of Divine Guidance.';
    $image = SITE_URL . '/siodel-cricular.png';

    if ($postId) {
        $postUrl = API_BASE . '/api/posts/' . urlencode($postId);
        $ch2 = curl_init($postUrl);
        curl_setopt_array($ch2, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 5,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTPHEADER => ['Accept: application/json'],
        ]);
        $postResponse = curl_exec($ch2);
        $postHttpCode = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
        curl_close($ch2);

        if ($postHttpCode === 200 && $postResponse) {
            $post = json_decode($postResponse, true);
            if ($post) {
                $title = !empty($post['title']) ? $post['title'] : $title;

                $rawDesc = !empty($post['subtitle']) ? $post['subtitle'] : ($post['content'] ?? '');
                $desc = mb_substr(strip_tags($rawDesc), 0, 160);
                $desc = trim($desc);
                if (!empty($desc)) {
                    $description = $desc;
                }

                if (!empty($post['image'])) {
                    $img = $post['image'];
                    if (strpos($img, 'http') !== 0) {
                        $img = API_BASE . '/' . ltrim($img, '/');
                    }
                    $image = $img;
                }
            }
        }
    }

    // Video Embed Support (YouTube)
    $videoUrl = '';
    $videoType = '';
    $videoWidth = 1280;
    $videoHeight = 720;

    function getYoutubeId($url)
    {
        $pattern = '/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i';
        if (preg_match($pattern, $url, $matches)) {
            return $matches[1];
        }
        return null;
    }

    $ytId = getYoutubeId($destination);
    if (!$ytId && isset($post['content'])) {
        $ytId = getYoutubeId($post['content']);
    }

    if ($ytId) {
        $videoUrl = "https://www.youtube.com/embed/$ytId";
        $videoType = "text/html";
    }

    // DEBUG MODE
    if (isset($_GET['debug'])) {
        echo "<pre>";
        echo "<h1>Debug Mode</h1>";
        echo "<strong>Code:</strong> " . htmlspecialchars($code) . "\n";
        echo "<strong>Title:</strong> " . htmlspecialchars($title) . "\n";
        echo "<strong>Image:</strong> " . htmlspecialchars($image) . "\n";
        echo "<strong>Video URL:</strong> " . htmlspecialchars($videoUrl) . "\n";
        echo "<strong>Destination:</strong> " . htmlspecialchars($destination) . "\n";
        echo "<strong>Post ID:</strong> " . htmlspecialchars($postId ?? 'NULL') . "\n";
        echo "</pre>";
        exit();
    }

} catch (Exception $e) {
    if (isset($_GET['debug'])) {
        echo "Exception: " . $e->getMessage();
        exit();
    }
    header("Location: /");
    exit();
}

// Bot Detection
function isBot()
{
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $bots = [
        'facebookexternalhit',
        'WhatsApp',
        'Twitterbot',
        'TelegramBot',
        'Discordbot',
        'Slackbot',
        'LinkedInBot',
        'Pinterest',
        'Googlebot',
        'Bingbot'
    ];
    foreach ($bots as $bot) {
        if (stripos($ua, $bot) !== false)
            return true;
    }
    return false;
}

$isBot = isBot();
$shortUrl = SITE_URL . '/s/' . htmlspecialchars($code);
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title><?php echo htmlspecialchars($title); ?></title>
    <meta name="description" content="<?php echo htmlspecialchars($description); ?>">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="<?php echo !empty($videoUrl) ? 'video.other' : 'website'; ?>">
    <meta property="og:url" content="<?php echo $shortUrl; ?>">
    <meta property="og:title" content="<?php echo htmlspecialchars($title); ?>">
    <meta property="og:description" content="<?php echo htmlspecialchars($description); ?>">
    <meta property="og:image" content="<?php echo htmlspecialchars($image); ?>">
    <meta property="og:site_name" content="SIO Delhi">
    <?php if (preg_match('/\.webp$/i', $image)): ?>
        <meta property="og:image:type" content="image/webp">
    <?php else: ?>
        <meta property="og:image:type" content="image/jpeg">
    <?php endif; ?>

    <?php if (!empty($videoUrl)): ?>
        <meta property="og:video" content="<?php echo htmlspecialchars($videoUrl); ?>">
        <meta property="og:video:secure_url" content="<?php echo htmlspecialchars($videoUrl); ?>">
        <meta property="og:video:type" content="<?php echo $videoType; ?>">
        <meta property="og:video:width" content="<?php echo $videoWidth; ?>">
        <meta property="og:video:height" content="<?php echo $videoHeight; ?>">
    <?php endif; ?>

    <!-- Twitter -->
    <meta property="twitter:card" content="<?php echo !empty($videoUrl) ? 'player' : 'summary_large_image'; ?>">
    <meta property="twitter:url" content="<?php echo $shortUrl; ?>">
    <meta property="twitter:title" content="<?php echo htmlspecialchars($title); ?>">
    <meta property="twitter:description" content="<?php echo htmlspecialchars($description); ?>">
    <meta property="twitter:image" content="<?php echo htmlspecialchars($image); ?>">

    <?php if (!empty($videoUrl)): ?>
        <meta property="twitter:player" content="<?php echo htmlspecialchars($videoUrl); ?>">
        <meta property="twitter:player:width" content="<?php echo $videoWidth; ?>">
        <meta property="twitter:player:height" content="<?php echo $videoHeight; ?>">
    <?php endif; ?>

    <!-- Redirect (Only for humans) -->
    <?php if (!$isBot): ?>
        <meta http-equiv="refresh" content="0;url=<?php echo htmlspecialchars($destination); ?>">
    <?php endif; ?>

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
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>

<body>
    <div style="text-align: center;">
        <div class="loader" style="margin: 0 auto 20px;"></div>
        <p>Redirecting to content...</p>
        <p><a href="<?php echo htmlspecialchars($destination); ?>" style="color: #ff3b3b;">Click here if not redirected</a></p>
    </div>

    <script>
        <?php if (!$isBot): ?>
            window.location.replace("<?php echo htmlspecialchars($destination, ENT_QUOTES, 'UTF-8'); ?>");
        <?php endif; ?>
    </script>
</body>

</html>
