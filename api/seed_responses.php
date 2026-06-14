<?php
/**
 * Seed 300 random responses for a portal performance form.
 * Usage: php api/seed_responses.php <form_id>
 * Or via web: curl "https://api.siodelhi.org/seed_responses.php?form_id=..."
 */

ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/routes/portal.php';

if (php_sapi_name() === 'cli') {
    $formId = $argv[1] ?? '';
} else {
    header('Content-Type: text/plain');
    $formId = $_GET['form_id'] ?? '';
}

if (!$formId) {
    die("Usage: php seed_responses.php <form_id>\n");
}

$db = getDB();

// Check form exists
$stmt = $db->prepare("SELECT id, title FROM portal_perf_forms WHERE id = ?");
$stmt->execute([$formId]);
$form = $stmt->fetch();
if (!$form) {
    die("Form not found: $formId\n");
}

// Get fields
$stmt = $db->prepare("SELECT * FROM portal_perf_fields WHERE form_id = ? ORDER BY display_order");
$stmt->execute([$formId]);
$fields = $stmt->fetchAll();
if (empty($fields)) {
    die("No fields found for form.\n");
}

echo "Form: {$form['title']} ($formId)\n";
echo "Fields: " . count($fields) . "\n";
echo "Seeding 300 responses...\n\n";

// Get portal users for member_id references
$stmt = $db->query("SELECT id FROM portal_users ORDER BY RAND() LIMIT 300");
$users = $stmt->fetchAll(PDO::FETCH_COLUMN);
if (count($users) < 300) {
    echo "Warning: Only " . count($users) . " users available, reusing IDs.\n";
}

// Sample data generators
$firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Pranav', 'Dhruv', 'Krishna', 'Shaurya', 'Advik', 'Kabir', 'Reyansh', 'Ayaan', 'Atharva', 'Anaya', 'Diya', 'Myra', 'Ishita', 'Aadhya', 'Sara', 'Aanya', 'Ananya', 'Avni', 'Paridhi', 'Ira', 'Sia', 'Riya', 'Jiya', 'Navya', 'Aisha', 'Fatima', 'Sana', 'Zara', 'Inaya', 'Amina', 'Kavya', 'Noor', 'Hazel', 'Kiara'];
$lastNames = ['Sharma', 'Verma', 'Singh', 'Kumar', 'Patel', 'Gupta', 'Khan', 'Ali', 'Shaikh', 'Ansari', 'Reddy', 'Pillai', 'Menon', 'Nair', 'Das', 'Sen', 'Bose', 'Iyer', 'Joshi', 'Deshmukh'];
$cities = ['Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad', 'Pune', 'Jaipur', 'Lucknow', 'Aligarh', 'Amroha', 'Sambhal', 'Moradabad', 'Bareilly'];
$states = ['DL', 'MH', 'KA', 'TS', 'TN', 'WB', 'GJ', 'RJ', 'UP', 'HR', 'PB', 'BR'];
$products = ['Booklet', 'Poster', 'Registration', 'Magazine', 'Sticker', 'Badge'];
$sampleOptions = ['Option A', 'Option B', 'Option C', 'Option D'];

function randDate() {
    $days = rand(0, 365);
    return date('Y-m-d', strtotime("-$days days"));
}
function randPhone() {
    return '+91' . rand(7000000000, 9999999999);
}
function randEmail() {
    $domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'proton.me'];
    return strtolower(explode(' ', $GLOBALS['firstNames'][array_rand($GLOBALS['firstNames'])])[0]) . rand(10, 99) . '@' . $domains[array_rand($domains)];
}

function generateValue(array $field) {
    switch ($field['type']) {
        case 'full_name':
            return ['first' => $GLOBALS['firstNames'][array_rand($GLOBALS['firstNames'])], 'last' => $GLOBALS['lastNames'][array_rand($GLOBALS['lastNames'])]];
        case 'short_text':
        case 'fill_blank':
            return 'Sample answer ' . rand(1, 999);
        case 'long_text':
        case 'subjective':
            return 'This is a sample response generated for testing purposes. ' . str_repeat('More detail here. ', rand(1, 5));
        case 'email':
            return randEmail();
        case 'phone':
            return randPhone();
        case 'address':
            return ['street' => rand(1, 999) . ' ' . ['Main St', 'Park Ave', 'Market Rd', 'Lake View', 'Green Lane'][array_rand(['Main St', 'Park Ave', 'Market Rd', 'Lake View', 'Green Lane'])], 'city' => $GLOBALS['cities'][array_rand($GLOBALS['cities'])], 'state' => $GLOBALS['states'][array_rand($GLOBALS['states'])], 'pin' => str_pad(rand(100001, 999999), 6, '0', STR_PAD_LEFT)];
        case 'date':
            return randDate();
        case 'appointment':
            return randDate() . 'T' . str_pad(rand(9, 17), 2, '0', STR_PAD_LEFT) . ':' . str_pad(rand(0, 59), 2, '0', STR_PAD_LEFT);
        case 'time':
            return str_pad(rand(9, 17), 2, '0', STR_PAD_LEFT) . ':' . str_pad(rand(0, 59), 2, '0', STR_PAD_LEFT);
        case 'number':
            return rand(0, $field['max_value'] ?? 100);
        case 'rating':
        case 'scale_rating':
        case 'star_rating':
            return rand(1, $field['max_value'] ?? 5);
        case 'spinner':
            return rand(0, $field['max_value'] ?? 99);
        case 'checkbox':
            return (bool) rand(0, 1);
        case 'mcq':
        case 'dropdown':
            $options = $field['options'] ? json_decode($field['options'], true) : $GLOBALS['sampleOptions'];
            return $options[array_rand($options)];
        case 'msq':
            $options = $field['options'] ? json_decode($field['options'], true) : $GLOBALS['sampleOptions'];
            $count = rand(0, min(count($options), rand(0, count($options))));
            if ($count === 0) return [];
            $keys = array_rand($options, $count);
            return is_array($keys) ? array_map(fn($k) => $options[$k], $keys) : [$options[$keys]];
        case 'product_list':
            $options = $field['options'] ? json_decode($field['options'], true) : $GLOBALS['products'];
            $result = [];
            foreach ($options as $p) {
                if (rand(0, 1)) $result[$p] = rand(0, 10);
            }
            return $result;
        case 'input_table':
            $options = $field['options'] ? json_decode($field['options'], true) : ['Name', 'Role', 'Contact'];
            return array_map(function () use ($options) {
                return array_map(function () {
                    return 'Sample ' . rand(1, 99);
                }, $options);
            }, range(1, 3));
        case 'file_upload':
            return ['report_' . rand(1, 99) . '.pdf', 'photo_' . rand(1, 99) . '.jpg'];
        case 'signature':
            return 'data:image/png;base64,' . base64_encode('fake_signature_' . rand(1000, 9999));
        case 'captcha':
            return 'SIO';
        default:
            return null;
    }
}

$insert = $db->prepare("INSERT INTO portal_perf_responses (id, form_id, member_id, response_data) VALUES (?, ?, ?, ?)");
$count = 0;
$errors = 0;

for ($i = 0; $i < 300; $i++) {
    $responseData = [];
    foreach ($fields as $field) {
        $val = generateValue($field);
        if ($val !== null) {
            $responseData[$field['id']] = $val;
        }
    }
    $memberId = $users[$i % count($users)];
    try {
        $insert->execute([uuid(), $formId, $memberId, json_encode($responseData)]);
        $count++;
    } catch (Exception $e) {
        // Likely duplicate (form_id + member_id unique constraint), skip
        $errors++;
    }
    if ($i % 50 === 49) echo "  $i+1 responses inserted...\n";
}

echo "\nDone: $count responses inserted";
if ($errors) echo ", $errors skipped (duplicates)";
echo "\n";
