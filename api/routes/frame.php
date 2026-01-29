<?php
/**
 * Frame Tool API Routes
 * Applies PNG frames to images using GD library
 */

/**
 * Apply frame to multiple images and return ZIP
 * POST /api/frame/apply-bulk
 *
 * Expects multipart form data:
 * - frame: PNG file with transparency
 * - images[]: Array of image URLs to process
 */
function applyFrameBulk()
{
    // Increase memory limit for image processing
    ini_set('memory_limit', '256M');

    // Validate frame file
    if (!isset($_FILES['frame'])) {
        http_response_code(400);
        return ['error' => 'No frame file provided'];
    }

    $frame = $_FILES['frame'];

    if ($frame['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        return ['error' => 'Frame upload error'];
    }

    // Validate frame is PNG
    $frameExt = strtolower(pathinfo($frame['name'], PATHINFO_EXTENSION));
    if ($frameExt !== 'png') {
        http_response_code(400);
        return ['error' => 'Frame must be a PNG file'];
    }

    // Validate frame size (5MB max)
    if ($frame['size'] > MAX_IMAGE_SIZE) {
        http_response_code(400);
        return ['error' => 'Frame file too large. Maximum size: 5MB'];
    }

    // Get image URLs from POST data
    $imageUrls = $_POST['images'] ?? [];
    $fitMode = $_POST['fitMode'] ?? 'cover'; // cover, contain, fill
    $frameScale = floatval($_POST['frameScale'] ?? 1.0);
    $frameOffsetX = floatval($_POST['frameOffsetX'] ?? 0);
    $frameOffsetY = floatval($_POST['frameOffsetY'] ?? 0);

    if (empty($imageUrls)) {
        http_response_code(400);
        return ['error' => 'No images provided'];
    }

    if (!is_array($imageUrls)) {
        $imageUrls = [$imageUrls];
    }

    // Validate fit mode
    if (!in_array($fitMode, ['cover', 'contain', 'fill'])) {
        $fitMode = 'cover';
    }

    // Validate frame scale (0.5 to 2.0)
    $frameScale = max(0.5, min(2.0, $frameScale));

    // Validate frame offsets (-50 to 50)
    $frameOffsetX = max(-50, min(50, $frameOffsetX));
    $frameOffsetY = max(-50, min(50, $frameOffsetY));

    // Load frame image
    $frameImage = @imagecreatefrompng($frame['tmp_name']);
    if (!$frameImage) {
        http_response_code(400);
        return ['error' => 'Invalid PNG frame file'];
    }

    // Preserve alpha channel
    imagesavealpha($frameImage, true);
    imagealphablending($frameImage, true);

    $frameWidth = imagesx($frameImage);
    $frameHeight = imagesy($frameImage);

    // Create temp directory for outputs
    $tempDir = sys_get_temp_dir() . '/frame_' . uniqid();
    mkdir($tempDir, 0755, true);

    $results = [];
    $processedFiles = [];

    foreach ($imageUrls as $index => $imageUrl) {
        try {
            $result = processImage($imageUrl, $frameImage, $frameWidth, $frameHeight, $tempDir, $index, $fitMode, $frameScale, $frameOffsetX, $frameOffsetY);
            $results[] = [
                'originalUrl' => $imageUrl,
                'success' => true,
                'filename' => $result['filename']
            ];
            $processedFiles[] = $result['filepath'];
        } catch (Exception $e) {
            $results[] = [
                'originalUrl' => $imageUrl,
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    // Clean up frame image
    imagedestroy($frameImage);

    // Create ZIP file
    if (empty($processedFiles)) {
        // Clean up temp directory
        rmdir($tempDir);
        http_response_code(400);
        return ['error' => 'No images were processed successfully', 'results' => $results];
    }

    $zipFilename = 'framed_images_' . date('Y-m-d_His') . '.zip';
    $zipPath = $tempDir . '/' . $zipFilename;

    $zip = new ZipArchive();
    if ($zip->open($zipPath, ZipArchive::CREATE) !== true) {
        http_response_code(500);
        return ['error' => 'Failed to create ZIP file'];
    }

    foreach ($processedFiles as $file) {
        $zip->addFile($file, basename($file));
    }

    $zip->close();

    // Read ZIP and output directly
    $zipContent = file_get_contents($zipPath);
    $zipSize = filesize($zipPath);

    // Clean up temp files
    foreach ($processedFiles as $file) {
        @unlink($file);
    }
    @unlink($zipPath);
    @rmdir($tempDir);

    // Output ZIP file
    ob_clean();
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $zipFilename . '"');
    header('Content-Length: ' . $zipSize);
    header('Cache-Control: no-cache, must-revalidate');

    echo $zipContent;
    exit;
}

/**
 * Process a single image with the frame
 * Frame scale and offset apply to the FRAME overlay, not the photo
 */
function processImage($imageUrl, $frameImage, $frameWidth, $frameHeight, $tempDir, $index, $fitMode = 'cover', $frameScale = 1.0, $frameOffsetX = 0, $frameOffsetY = 0)
{
    // Load the source image
    $sourceImage = loadImageFromUrl($imageUrl);
    if (!$sourceImage) {
        throw new Exception('Failed to load image');
    }

    $sourceWidth = imagesx($sourceImage);
    $sourceHeight = imagesy($sourceImage);

    // Create output canvas at frame dimensions
    $output = imagecreatetruecolor($frameWidth, $frameHeight);
    imagesavealpha($output, true);
    imagealphablending($output, false);

    // Fill with white background (in case frame has transparency in photo area)
    $white = imagecolorallocate($output, 255, 255, 255);
    imagefill($output, 0, 0, $white);
    imagealphablending($output, true);

    // Calculate photo scaling based on fit mode (photo stays in place)
    $sourceRatio = $sourceWidth / $sourceHeight;
    $frameRatio = $frameWidth / $frameHeight;

    if ($fitMode === 'cover') {
        // Cover: scale to fill frame, crop overflow
        if ($sourceRatio > $frameRatio) {
            $destHeight = $frameHeight;
            $destWidth = (int)($frameHeight * $sourceRatio);
            $destX = (int)(($frameWidth - $destWidth) / 2);
            $destY = 0;
        } else {
            $destWidth = $frameWidth;
            $destHeight = (int)($frameWidth / $sourceRatio);
            $destX = 0;
            $destY = (int)(($frameHeight - $destHeight) / 2);
        }
    } elseif ($fitMode === 'contain') {
        // Contain: fit entirely within frame, show background
        if ($sourceRatio > $frameRatio) {
            $destWidth = $frameWidth;
            $destHeight = (int)($frameWidth / $sourceRatio);
            $destX = 0;
            $destY = (int)(($frameHeight - $destHeight) / 2);
        } else {
            $destHeight = $frameHeight;
            $destWidth = (int)($frameHeight * $sourceRatio);
            $destX = (int)(($frameWidth - $destWidth) / 2);
            $destY = 0;
        }
    } else {
        // Fill: stretch to fill exactly
        $destWidth = $frameWidth;
        $destHeight = $frameHeight;
        $destX = 0;
        $destY = 0;
    }

    // Draw photo (photo stays fixed based on fit mode)
    imagecopyresampled(
        $output, $sourceImage,
        $destX, $destY, 0, 0,
        $destWidth, $destHeight, $sourceWidth, $sourceHeight
    );

    // Calculate scaled frame dimensions
    $scaledFrameWidth = (int)($frameWidth * $frameScale);
    $scaledFrameHeight = (int)($frameHeight * $frameScale);

    // Calculate frame position (centered, then offset)
    $frameX = (int)(($frameWidth - $scaledFrameWidth) / 2 + ($frameOffsetX / 100) * $frameWidth);
    $frameY = (int)(($frameHeight - $scaledFrameHeight) / 2 + ($frameOffsetY / 100) * $frameHeight);

    // Draw scaled frame overlay on top
    imagecopyresampled(
        $output, $frameImage,
        $frameX, $frameY, 0, 0,
        $scaledFrameWidth, $scaledFrameHeight, $frameWidth, $frameHeight
    );

    // Generate output filename
    $filename = 'framed_' . ($index + 1) . '_' . time() . '.png';
    $filepath = $tempDir . '/' . $filename;

    // Save output as PNG to preserve quality
    imagepng($output, $filepath, 6);

    // Clean up
    imagedestroy($sourceImage);
    imagedestroy($output);

    return [
        'filename' => $filename,
        'filepath' => $filepath
    ];
}

/**
 * Load image from URL or local path
 */
function loadImageFromUrl($url)
{
    // Check if it's a local file (from our uploads)
    if (strpos($url, BASE_URL) === 0) {
        // Convert URL to local path
        $relativePath = str_replace(BASE_URL . '/', '', $url);
        $localPath = __DIR__ . '/../' . $relativePath;

        if (file_exists($localPath)) {
            return loadImageFromPath($localPath);
        }
    }

    // Fetch remote image
    $context = stream_context_create([
        'http' => [
            'timeout' => 30,
            'user_agent' => 'Mozilla/5.0 FrameTool/1.0'
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false
        ]
    ]);

    $imageData = @file_get_contents($url, false, $context);
    if (!$imageData) {
        return null;
    }

    $image = @imagecreatefromstring($imageData);
    return $image ?: null;
}

/**
 * Load image from local file path
 */
function loadImageFromPath($path)
{
    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));

    switch ($ext) {
        case 'jpg':
        case 'jpeg':
            return @imagecreatefromjpeg($path);
        case 'png':
            $img = @imagecreatefrompng($path);
            if ($img) {
                imagesavealpha($img, true);
                imagealphablending($img, true);
            }
            return $img;
        case 'gif':
            return @imagecreatefromgif($path);
        case 'webp':
            return @imagecreatefromwebp($path);
        default:
            // Try to detect from content
            return @imagecreatefromstring(file_get_contents($path));
    }
}
