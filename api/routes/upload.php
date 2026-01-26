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
    $validTypes = ['images', 'pdfs', 'audio', 'forms'];

    if (!in_array($type, $validTypes)) {
        http_response_code(400);
        return ['error' => 'Invalid file type'];
    }

    // Decode URL-encoded filename and sanitize to prevent directory traversal
    $filename = urldecode($filename);

    // Sanitize to prevent directory traversal
    $filename = str_replace(['..', '.\\', './'], '', $filename);
    $filename = ltrim($filename, '/'); // Remove leading slash

    // For safety, ensure we are not trying to delete outside the upload dir for that type
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

/**
 * Delete a file given its full URL
 * Extracts the path from the URL and deletes from UPLOAD_DIR
 * @param string $url The full URL of the file
 * @return bool True if deleted, false otherwise
 */
function deleteFileByUrl($url)
{
    if (empty($url)) {
        return false;
    }

    // Extract path after /uploads/
    $pattern = '/\/uploads\/(.+)$/';
    if (!preg_match($pattern, $url, $matches)) {
        return false;
    }

    $relativePath = $matches[1];
    // Sanitize to prevent directory traversal
    $relativePath = str_replace('..', '', $relativePath);
    $filepath = UPLOAD_DIR . $relativePath;

    if (file_exists($filepath) && is_file($filepath)) {
        return unlink($filepath);
    }

    return false;
}

/**
 * Recursively delete a directory and all its contents
 * @param string $dir The directory path to delete
 * @return bool True if deleted, false otherwise
 */
function deleteDirectory($dir)
{
    if (!is_dir($dir)) {
        return false;
    }

    $files = array_diff(scandir($dir), ['.', '..']);
    foreach ($files as $file) {
        $path = $dir . '/' . $file;
        if (is_dir($path)) {
            deleteDirectory($path);
        } else {
            unlink($path);
        }
    }

    return rmdir($dir);
}

/**
 * Delete all files in a form's upload directory
 * @param string $formId The form ID
 * @return bool True if deleted or didn't exist, false on error
 */
function deleteFormFiles($formId)
{
    if (empty($formId)) {
        return false;
    }

    // Sanitize form ID same way as upload
    $sanitizedFormId = preg_replace('/[^a-z0-9-]/i', '', $formId);
    $formDir = UPLOAD_DIR . 'forms/' . $sanitizedFormId;

    if (is_dir($formDir)) {
        return deleteDirectory($formDir);
    }

    return true; // Directory doesn't exist, nothing to delete
}

/**
 * Delete files from a form response's data
 * Parses the response JSON and deletes any file URLs found
 * @param array $responseData The decoded response data
 * @return int Number of files deleted
 */
function deleteResponseFiles($responseData)
{
    if (!is_array($responseData)) {
        return 0;
    }

    $deleted = 0;
    foreach ($responseData as $value) {
        if (is_string($value) && strpos($value, '/uploads/') !== false) {
            // Single file URL
            if (deleteFileByUrl($value)) {
                $deleted++;
            }
        } elseif (is_array($value)) {
            // Array of file URLs (e.g., multiple file upload)
            foreach ($value as $item) {
                if (is_string($item) && strpos($item, '/uploads/') !== false) {
                    if (deleteFileByUrl($item)) {
                        $deleted++;
                    }
                }
            }
        }
    }

    return $deleted;
}
