<?php
/**
 * Forms API Routes
 * Handles form CRUD, fields management, responses, and export
 */

// === FORMS CRUD ===

function getAllForms()
{
    $db = getDB();

    // Get forms with response counts
    $sql = "
        SELECT f.*,
               (SELECT COUNT(*) FROM form_responses WHERE form_id = f.id) as response_count
        FROM forms f
        ORDER BY f.created_at DESC
    ";
    $stmt = $db->query($sql);
    $forms = $stmt->fetchAll();

    return array_map('mapForm', $forms);
}

function getFormById($id)
{
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM forms WHERE id = ? OR slug = ?");
    $stmt->execute([$id, $id]);
    $form = $stmt->fetch();

    if (!$form) {
        http_response_code(404);
        return ['error' => 'Form not found'];
    }

    // Also fetch fields
    $fieldStmt = $db->prepare("SELECT * FROM form_fields WHERE form_id = ? ORDER BY display_order ASC");
    $fieldStmt->execute([$form['id']]);
    $fields = $fieldStmt->fetchAll();

    // Get response count
    $countStmt = $db->prepare("SELECT COUNT(*) FROM form_responses WHERE form_id = ?");
    $countStmt->execute([$form['id']]);
    $responseCount = $countStmt->fetchColumn();

    $result = mapForm($form);
    $result['fields'] = array_map('mapFormField', $fields);
    $result['responseCount'] = (int) $responseCount;
    return $result;
}

function getPublicForm($slugOrId)
{
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM forms WHERE (id = ? OR slug = ?) AND is_published = 1");
    $stmt->execute([$slugOrId, $slugOrId]);
    $form = $stmt->fetch();

    if (!$form) {
        http_response_code(404);
        return ['error' => 'Form not found or not published'];
    }

    // Check response limit
    if ($form['response_limit']) {
        $countStmt = $db->prepare("SELECT COUNT(*) FROM form_responses WHERE form_id = ?");
        $countStmt->execute([$form['id']]);
        $count = $countStmt->fetchColumn();
        if ($count >= $form['response_limit']) {
            http_response_code(403);
            return ['error' => 'This form has reached its response limit'];
        }
    }

    // Check expiry
    if ($form['expires_at'] && strtotime($form['expires_at']) < time()) {
        http_response_code(403);
        return ['error' => 'This form has expired'];
    }

    if (!$form['accept_responses']) {
        http_response_code(403);
        return ['error' => 'This form is not accepting responses'];
    }

    // Fetch fields
    $fieldStmt = $db->prepare("SELECT * FROM form_fields WHERE form_id = ? ORDER BY display_order ASC");
    $fieldStmt->execute([$form['id']]);
    $fields = $fieldStmt->fetchAll();

    $result = mapForm($form);
    $result['fields'] = array_map('mapFormField', $fields);
    return $result;
}

function createForm()
{
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['title'])) {
        http_response_code(400);
        return ['error' => 'Title is required'];
    }

    $db = getDB();
    $id = generateFormUUID();
    $slug = createFormSlug($data['title'], $db);

    $stmt = $db->prepare("
        INSERT INTO forms (id, title, description, slug, banner_image, theme_primary_color, theme_background, theme_background_image, is_published, accept_responses, success_message, response_limit, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $expiresAt = null;
    if (!empty($data['expiresAt'])) {
        $expiresAt = date('Y-m-d H:i:s', $data['expiresAt'] / 1000);
    }

    $stmt->execute([
        $id,
        $data['title'],
        $data['description'] ?? null,
        $slug,
        $data['bannerImage'] ?? null,
        $data['themePrimaryColor'] ?? '#ff3b3b',
        $data['themeBackground'] ?? '#fafafa',
        $data['themeBackgroundImage'] ?? null,
        isset($data['isPublished']) ? ($data['isPublished'] ? 1 : 0) : 0,
        isset($data['acceptResponses']) ? ($data['acceptResponses'] ? 1 : 0) : 1,
        $data['successMessage'] ?? 'Thank you for your submission!',
        $data['responseLimit'] ?? null,
        $expiresAt
    ]);

    http_response_code(201);
    return getFormById($id);
}

function updateForm($id)
{
    $data = json_decode(file_get_contents('php://input'), true);
    $db = getDB();

    // Check if exists
    $stmt = $db->prepare("SELECT id FROM forms WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        return ['error' => 'Form not found'];
    }

    $updates = [];
    $params = [];

    $fieldMap = [
        'title' => 'title',
        'description' => 'description',
        'bannerImage' => 'banner_image',
        'themePrimaryColor' => 'theme_primary_color',
        'themeBackground' => 'theme_background',
        'themeBackgroundImage' => 'theme_background_image',
        'isPublished' => 'is_published',
        'acceptResponses' => 'accept_responses',
        'successMessage' => 'success_message',
        'responseLimit' => 'response_limit',
        'slug' => 'slug'
    ];

    // Handle slug uniqueness if changed
    if (isset($data['slug']) && $data['slug'] !== ($form['slug'] ?? '')) {
        $newSlug = preg_replace('/[^a-z0-9]+/', '-', strtolower($data['slug']));
        $newSlug = trim($newSlug, '-');
        if (empty($newSlug))
            $newSlug = 'form';

        // Check if taken by another form
        $checkStmt = $db->prepare("SELECT id FROM forms WHERE slug = ? AND id != ?");
        $checkStmt->execute([$newSlug, $id]);
        if ($checkStmt->fetch()) {
            http_response_code(400);
            return ['error' => 'URL slug is already taken'];
        }
        $data['slug'] = $newSlug; // Use sanitized slug
    }

    foreach ($fieldMap as $jsKey => $dbKey) {
        if (array_key_exists($jsKey, $data)) {
            $updates[] = "$dbKey = ?";
            $value = $data[$jsKey];
            if (in_array($jsKey, ['isPublished', 'acceptResponses'])) {
                $value = $value ? 1 : 0;
            }
            $params[] = $value;
        }
    }

    // Handle expiresAt separately (timestamp conversion)
    if (array_key_exists('expiresAt', $data)) {
        $updates[] = 'expires_at = ?';
        $params[] = $data['expiresAt'] ? date('Y-m-d H:i:s', $data['expiresAt'] / 1000) : null;
    }

    if (empty($updates)) {
        return getFormById($id);
    }

    $params[] = $id;
    $sql = "UPDATE forms SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    return getFormById($id);
}

function deleteForm($id)
{
    $db = getDB();

    $stmt = $db->prepare("SELECT id FROM forms WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        return ['error' => 'Form not found'];
    }

    $stmt = $db->prepare("DELETE FROM forms WHERE id = ?");
    $stmt->execute([$id]);

    return ['message' => 'Form deleted successfully'];
}

// === FORM FIELDS ===

function updateFormFields($formId)
{
    $data = json_decode(file_get_contents('php://input'), true);
    $fields = $data['fields'] ?? [];

    $db = getDB();

    // Check if form exists
    $stmt = $db->prepare("SELECT id FROM forms WHERE id = ?");
    $stmt->execute([$formId]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        return ['error' => 'Form not found'];
    }

    // Delete existing fields
    $deleteStmt = $db->prepare("DELETE FROM form_fields WHERE form_id = ?");
    $deleteStmt->execute([$formId]);

    // Insert new fields
    $insertStmt = $db->prepare("
        INSERT INTO form_fields (id, form_id, type, label, placeholder, help_text, is_required, options, validation_rules, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    foreach ($fields as $index => $field) {
        $insertStmt->execute([
            $field['id'] ?? generateFormUUID(),
            $formId,
            $field['type'],
            $field['label'],
            $field['placeholder'] ?? null,
            $field['helpText'] ?? null,
            isset($field['isRequired']) ? ($field['isRequired'] ? 1 : 0) : 0,
            isset($field['options']) ? json_encode($field['options']) : null,
            isset($field['validationRules']) ? json_encode($field['validationRules']) : null,
            $index
        ]);
    }

    return getFormById($formId);
}

// === RESPONSES ===

function getFormResponses($formId)
{
    $db = getDB();

    // Get form to check it exists
    $formStmt = $db->prepare("SELECT id, title FROM forms WHERE id = ?");
    $formStmt->execute([$formId]);
    if (!$formStmt->fetch()) {
        http_response_code(404);
        return ['error' => 'Form not found'];
    }

    // Get responses with pagination
    $page = isset($_GET['page']) ? max(1, (int) $_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? min((int) $_GET['limit'], 100) : 50;
    $offset = ($page - 1) * $limit;

    $countStmt = $db->prepare("SELECT COUNT(*) FROM form_responses WHERE form_id = ?");
    $countStmt->execute([$formId]);
    $total = $countStmt->fetchColumn();

    $stmt = $db->prepare("
        SELECT * FROM form_responses
        WHERE form_id = ?
        ORDER BY submitted_at DESC
        LIMIT ? OFFSET ?
    ");
    $stmt->bindValue(1, $formId, PDO::PARAM_STR);
    $stmt->bindValue(2, $limit, PDO::PARAM_INT);
    $stmt->bindValue(3, $offset, PDO::PARAM_INT);
    $stmt->execute();
    $responses = $stmt->fetchAll();

    return [
        'responses' => array_map('mapFormResponse', $responses),
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => (int) $total,
            'totalPages' => (int) ceil($total / $limit)
        ]
    ];
}

function submitFormResponse($formId)
{
    $data = json_decode(file_get_contents('php://input'), true);
    $db = getDB();

    // Get form and validate
    $formStmt = $db->prepare("SELECT * FROM forms WHERE id = ? OR slug = ?");
    $formStmt->execute([$formId, $formId]);
    $form = $formStmt->fetch();

    if (!$form) {
        http_response_code(404);
        return ['error' => 'Form not found'];
    }

    if (!$form['is_published']) {
        http_response_code(403);
        return ['error' => 'Form is not published'];
    }

    if (!$form['accept_responses']) {
        http_response_code(403);
        return ['error' => 'Form is not accepting responses'];
    }

    // Check response limit
    if ($form['response_limit']) {
        $countStmt = $db->prepare("SELECT COUNT(*) FROM form_responses WHERE form_id = ?");
        $countStmt->execute([$form['id']]);
        $count = $countStmt->fetchColumn();
        if ($count >= $form['response_limit']) {
            http_response_code(403);
            return ['error' => 'This form has reached its response limit'];
        }
    }

    // Check expiry
    if ($form['expires_at'] && strtotime($form['expires_at']) < time()) {
        http_response_code(403);
        return ['error' => 'This form has expired'];
    }

    // Validate required fields
    $fieldStmt = $db->prepare("SELECT * FROM form_fields WHERE form_id = ?");
    $fieldStmt->execute([$form['id']]);
    $fields = $fieldStmt->fetchAll();

    $responseData = $data['responses'] ?? [];
    $errors = [];

    foreach ($fields as $field) {
        $value = $responseData[$field['id']] ?? null;
        if ($field['is_required']) {
            $isEmpty = is_null($value) || $value === '' || (is_array($value) && count($value) === 0);
            if ($isEmpty) {
                $errors[$field['id']] = $field['label'] . ' is required';
            }
        }
    }

    if (!empty($errors)) {
        http_response_code(400);
        return ['error' => 'Validation failed', 'fieldErrors' => $errors];
    }

    // Store response
    $id = generateFormUUID();
    $stmt = $db->prepare("
        INSERT INTO form_responses (id, form_id, response_data, submitter_ip)
        VALUES (?, ?, ?, ?)
    ");

    $stmt->execute([
        $id,
        $form['id'],
        json_encode($responseData),
        $_SERVER['REMOTE_ADDR'] ?? null
    ]);

    http_response_code(201);
    return [
        'success' => true,
        'message' => $form['success_message'] ?? 'Thank you for your submission!'
    ];
}

function getFormResponse($formId, $responseId)
{
    $db = getDB();

    $stmt = $db->prepare("SELECT * FROM form_responses WHERE id = ? AND form_id = ?");
    $stmt->execute([$responseId, $formId]);
    $response = $stmt->fetch();

    if (!$response) {
        http_response_code(404);
        return ['error' => 'Response not found'];
    }

    return mapFormResponse($response);
}

function updateFormResponse($formId, $responseId)
{
    $data = json_decode(file_get_contents('php://input'), true);
    $db = getDB();

    $stmt = $db->prepare("SELECT id FROM form_responses WHERE id = ? AND form_id = ?");
    $stmt->execute([$responseId, $formId]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        return ['error' => 'Response not found'];
    }

    $responseData = $data['responseData'] ?? [];

    $stmt = $db->prepare("UPDATE form_responses SET response_data = ? WHERE id = ?");
    $stmt->execute([json_encode($responseData), $responseId]);

    return getFormResponse($formId, $responseId);
}

function deleteFormResponse($formId, $responseId)
{
    $db = getDB();

    $stmt = $db->prepare("SELECT id FROM form_responses WHERE id = ? AND form_id = ?");
    $stmt->execute([$responseId, $formId]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        return ['error' => 'Response not found'];
    }

    $stmt = $db->prepare("DELETE FROM form_responses WHERE id = ?");
    $stmt->execute([$responseId]);

    return ['message' => 'Response deleted successfully'];
}

function exportFormResponses($formId)
{
    $format = $_GET['format'] ?? 'csv';
    $db = getDB();

    // Get form and fields
    $formStmt = $db->prepare("SELECT * FROM forms WHERE id = ?");
    $formStmt->execute([$formId]);
    $form = $formStmt->fetch();

    if (!$form) {
        http_response_code(404);
        return ['error' => 'Form not found'];
    }

    $fieldStmt = $db->prepare("SELECT * FROM form_fields WHERE form_id = ? ORDER BY display_order");
    $fieldStmt->execute([$formId]);
    $fields = $fieldStmt->fetchAll();

    // Get all responses
    $respStmt = $db->prepare("SELECT * FROM form_responses WHERE form_id = ? ORDER BY submitted_at DESC");
    $respStmt->execute([$formId]);
    $responses = $respStmt->fetchAll();

    if ($format === 'csv') {
        exportAsCSV($form, $fields, $responses);
        exit;
    }

    // Return JSON by default
    return [
        'form' => mapForm($form),
        'fields' => array_map('mapFormField', $fields),
        'responses' => array_map('mapFormResponse', $responses)
    ];
}

// === HELPER FUNCTIONS ===

function mapForm($row)
{
    $result = [
        'id' => $row['id'],
        'title' => $row['title'],
        'description' => $row['description'],
        'slug' => $row['slug'],
        'bannerImage' => $row['banner_image'] ?? null,
        'themePrimaryColor' => $row['theme_primary_color'] ?? '#ff3b3b',
        'themeBackground' => $row['theme_background'] ?? '#fafafa',
        'themeBackgroundImage' => $row['theme_background_image'] ?? null,
        'isPublished' => (bool) $row['is_published'],
        'acceptResponses' => (bool) $row['accept_responses'],
        'successMessage' => $row['success_message'],
        'responseLimit' => $row['response_limit'] ? (int) $row['response_limit'] : null,
        'expiresAt' => $row['expires_at'] ? strtotime($row['expires_at']) * 1000 : null,
        'createdAt' => $row['created_at'] ? strtotime($row['created_at']) * 1000 : null,
        'updatedAt' => $row['updated_at'] ? strtotime($row['updated_at']) * 1000 : null
    ];

    // Include response count if available
    if (isset($row['response_count'])) {
        $result['responseCount'] = (int) $row['response_count'];
    }

    return $result;
}

function mapFormField($row)
{
    return [
        'id' => $row['id'],
        'formId' => $row['form_id'],
        'type' => $row['type'],
        'label' => $row['label'],
        'placeholder' => $row['placeholder'],
        'helpText' => $row['help_text'],
        'isRequired' => (bool) $row['is_required'],
        'options' => $row['options'] ? json_decode($row['options'], true) : null,
        'validationRules' => $row['validation_rules'] ? json_decode($row['validation_rules'], true) : null,
        'displayOrder' => (int) $row['display_order']
    ];
}

function mapFormResponse($row)
{
    return [
        'id' => $row['id'],
        'formId' => $row['form_id'],
        'responseData' => json_decode($row['response_data'], true),
        'submittedAt' => $row['submitted_at'] ? strtotime($row['submitted_at']) * 1000 : null
    ];
}

function generateFormUUID()
{
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0xffff)
    );
}

function createFormSlug($title, $db)
{
    $slug = preg_replace('/[^a-z0-9]+/', '-', strtolower($title));
    $slug = trim($slug, '-');

    if (empty($slug)) {
        $slug = 'form';
    }

    // Check uniqueness
    $baseSlug = $slug;
    $counter = 1;
    while (true) {
        $stmt = $db->prepare("SELECT id FROM forms WHERE slug = ?");
        $stmt->execute([$slug]);
        if (!$stmt->fetch())
            break;
        $slug = $baseSlug . '-' . $counter++;
    }
    return $slug;
}

function exportAsCSV($form, $fields, $responses)
{
    // Clear any previous output
    ob_clean();

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $form['slug'] . '-responses.csv"');
    header('Pragma: no-cache');
    header('Expires: 0');

    $output = fopen('php://output', 'w');

    // Add BOM for Excel UTF-8 compatibility
    fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

    // Header row
    $headers = ['Submitted At'];
    foreach ($fields as $field) {
        $headers[] = $field['label'];
    }
    fputcsv($output, $headers);

    // Data rows
    foreach ($responses as $response) {
        $row = [date('Y-m-d H:i:s', strtotime($response['submitted_at']))];
        $data = json_decode($response['response_data'], true);
        foreach ($fields as $field) {
            $value = $data[$field['id']] ?? '';
            if (is_array($value)) {
                $value = implode(', ', $value);
            }
            $row[] = $value;
        }
        fputcsv($output, $row);
    }

    fclose($output);
}
