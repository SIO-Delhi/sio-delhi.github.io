<?php
/**
 * File Upload API Routes
 */

function uploadImage()
{
    $folder = isset($_POST['formId']) ? 'forms/' . preg_replace('/[^a-z0-9-]/i', '', $_POST['formId']) : 'images';
    if (isset($_POST['userName']) && isset($_POST['formId'])) {
        $name = preg_replace('/[^a-z0-9-]/i', '_', $_POST['userName']); // Sanitize heavily
        $folder .= '/' . $name;
    }
    return handleUpload($folder, ALLOWED_IMAGE_EXT, MAX_IMAGE_SIZE);
}

function uploadPdf()
{
    $folder = isset($_POST['formId']) ? 'forms/' . preg_replace('/[^a-z0-9-]/i', '', $_POST['formId']) : 'pdfs';
    if (isset($_POST['userName']) && isset($_POST['formId'])) {
        $name = preg_replace('/[^a-z0-9-]/i', '_', $_POST['userName']);
        $folder .= '/' . $name;
    }
    return handleUpload($folder, ALLOWED_PDF_EXT, MAX_PDF_SIZE);
}

function uploadAudio()
{
    // Audio usually global, but support formId just in case
    $folder = isset($_POST['formId']) ? 'forms/' . preg_replace('/[^a-z0-9-]/i', '', $_POST['formId']) : 'audio';
    return handleUpload($folder, ALLOWED_AUDIO_EXT, MAX_AUDIO_SIZE);
}

function deleteFile($type, $filename)
{
    $validTypes = ['images', 'pdfs', 'audio'];

    if (!in_array($type, $validTypes)) {
        http_response_code(400);
        return ['error' => 'Invalid file type'];
    }

    // Decode URL-encoded filename and sanitize to prevent directory traversal
    $filename = basename(urldecode($filename));
    $filepath = UPLOAD_DIR . $type . '/' . $filename;

    if (!file_exists($filepath)) {
        http_response_code(404);
        return ['error' => 'File not found'];
    }

    // Attempt to delete
    if (!unlink($filepath)) {
        $error = error_get_last();
        error_log("Failed to delete file $filepath: " . ($error['message'] ?? 'Unknown error'));
        http_response_code(500);
        return ['error' => 'Failed to delete file: ' . ($error['message'] ?? 'Unknown error')];
    }

    return ['message' => 'File deleted successfully'];
}

function downloadFile($type, $filename)
{
    $validTypes = ['images', 'pdfs', 'audio'];

    if (!in_array($type, $validTypes)) {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Invalid file type']);
        exit;
    }

    // Sanitize filename to prevent directory traversal
    $filename = basename($filename);
    $filepath = UPLOAD_DIR . $type . '/' . $filename;

    if (!file_exists($filepath)) {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'File not found']);
        exit;
    }

    // Get MIME type
    $mimeType = mime_content_type($filepath);
    $filesize = filesize($filepath);

    // Clear any previous output
    ob_clean();

    // Set headers for download
    header('Content-Type: ' . $mimeType);
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . $filesize);
    header('Cache-Control: no-cache, must-revalidate');
    header('Pragma: public');

    // Output file
    readfile($filepath);
    exit;
}

// Helper function to handle file uploads
function handleUpload($folder, $allowedExtensions, $maxSize)
{
    if (!isset($_FILES['file'])) {
        http_response_code(400);
        return ['error' => 'No file provided'];
    }

    $file = $_FILES['file'];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        return ['error' => 'Upload error: ' . getUploadErrorMessage($file['error'])];
    }

    if ($file['size'] > $maxSize) {
        http_response_code(400);
        return ['error' => 'File too large. Maximum size: ' . formatBytes($maxSize)];
    }

    // Get file extension
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

    if (!in_array($ext, $allowedExtensions)) {
        http_response_code(400);
        return ['error' => 'File type not allowed. Allowed: ' . implode(', ', $allowedExtensions)];
    }

    // Generate unique filename
    $filename = time() . '-' . substr(uniqid(), -8) . '.' . $ext;

    // Create directory if it doesn't exist
    $uploadPath = UPLOAD_DIR . $folder . '/';
    if (!is_dir($uploadPath)) {
        mkdir($uploadPath, 0755, true);
    }

    $filepath = $uploadPath . $filename;

    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        http_response_code(500);
        return ['error' => 'Failed to save file'];
    }

    $url = BASE_URL . '/uploads/' . $folder . '/' . $filename;

    http_response_code(201);
    return [
        'url' => $url,
        'filename' => $filename
    ];
}

function getUploadErrorMessage($errorCode)
{
    switch ($errorCode) {
        case UPLOAD_ERR_INI_SIZE:
            return 'File exceeds upload_max_filesize directive';
        case UPLOAD_ERR_FORM_SIZE:
            return 'File exceeds MAX_FILE_SIZE directive';
        case UPLOAD_ERR_PARTIAL:
            return 'File was only partially uploaded';
        case UPLOAD_ERR_NO_FILE:
            return 'No file was uploaded';
        case UPLOAD_ERR_NO_TMP_DIR:
            return 'Missing temporary folder';
        case UPLOAD_ERR_CANT_WRITE:
            return 'Failed to write file to disk';
        case UPLOAD_ERR_EXTENSION:
            return 'File upload stopped by extension';
        default:
            return 'Unknown upload error';
    }
}

function formatBytes($bytes)
{
    if ($bytes >= 1048576) {
        return round($bytes / 1048576, 2) . ' MB';
    }
    if ($bytes >= 1024) {
        return round($bytes / 1024, 2) . ' KB';
    }
    return $bytes . ' bytes';
}
