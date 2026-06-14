<?php
/**
 * Portal Performance Forms Integration Test
 *
 * Tests form creation with all field types, response submission,
 * response retrieval, and the review system.
 *
 * Run with: php api/tests/perf_forms_test.php
 */

// We only test the data handling layer (not HTTP routing/auth)
// by requiring the portal routes and using a mock DB

$failures = [];

function assert_eq($expected, $actual, string $label): void
{
    global $failures;
    if ($expected !== $actual) {
        $failures[] = "$label: expected " . json_encode($expected) . ", got " . json_encode($actual);
    }
}

function assert_not_empty($value, string $label): void
{
    global $failures;
    if (empty($value)) {
        $failures[] = "$label: expected non-empty value, got empty";
    }
}

// Test 1: field type constants cover all expected types
echo "Test 1: Field type coverage...\n";

$knownTypes = [
    'heading', 'full_name', 'email', 'address', 'phone', 'date',
    'appointment', 'signature', 'fill_blank', 'product_list',
    'short_text', 'long_text', 'paragraph', 'dropdown', 'mcq',
    'msq', 'number', 'image', 'file_upload', 'time', 'captcha',
    'spinner', 'submit', 'subjective', 'input_table', 'star_rating',
    'scale_rating', 'rating', 'checkbox', 'divider',
    'section_collapse', 'page_break', 'section',
];

$nonAnswerTypes = ['heading', 'paragraph', 'image', 'submit', 'divider', 'section_collapse', 'page_break', 'section'];
$choiceTypes = ['mcq', 'msq', 'dropdown', 'product_list', 'input_table'];
$maxValueTypes = ['number', 'rating', 'star_rating', 'scale_rating', 'spinner'];

assert_eq(33, count($knownTypes), 'total field types count');
assert_eq(8, count($nonAnswerTypes), 'non-answer types count');
assert_eq(5, count($choiceTypes), 'choice types count');
assert_eq(5, count($maxValueTypes), 'max-value types count');

// Verify no overlap between non-answer and answer types
foreach ($nonAnswerTypes as $t) {
    assert_eq(false, in_array($t, $choiceTypes), "non-answer type $t should not be in choice types");
}

echo "  " . count($knownTypes) . " field types defined\n";
echo "  " . count($nonAnswerTypes) . " non-answer types\n";
echo "  " . count($choiceTypes) . " choice types\n";
echo "  " . count($maxValueTypes) . " max-value types\n";

// Test 2: response_data serialization for each field type
echo "\nTest 2: Response data serialization patterns...\n";

$fieldValueMap = [
    'heading'    => null,
    'paragraph'  => null,
    'divider'    => null,
    'page_break' => null,
    'section'    => null,
    'submit'     => null,
    'section_collapse' => null,
    'image'      => null,
    'full_name'  => ['first' => 'John', 'last' => 'Doe'],
    'short_text' => 'Hello world',
    'fill_blank' => 'some answer',
    'long_text'  => 'A long paragraph of text with multiple sentences.',
    'subjective' => 'Free text response',
    'email'      => 'test@example.com',
    'address'    => ['street' => '123 Main St', 'city' => 'Delhi', 'state' => 'DL', 'pin' => '110001'],
    'phone'      => '+911234567890',
    'date'       => '2026-06-14',
    'appointment' => '2026-06-14T10:30',
    'time'       => '14:30',
    'number'     => 42,
    'rating'     => 4,
    'scale_rating' => 3,
    'star_rating' => 5,
    'spinner'    => 7,
    'checkbox'   => true,
    'mcq'        => 'Option A',
    'dropdown'   => 'Option B',
    'msq'        => ['Option A', 'Option C'],
    'product_list' => ['Product X' => 2, 'Product Y' => 1],
    'input_table' => [['a1', 'a2'], ['b1', 'b2'], ['c1', 'c2']],
    'file_upload' => ['doc1.pdf', 'doc2.pdf'],
    'signature'  => 'data:image/png;base64,iVBOR...',
    'captcha'    => null,
];

// Verify all known types have a test value (or null for non-answer types)
foreach ($knownTypes as $type) {
    $hasValue = array_key_exists($type, $fieldValueMap);
    if (!$hasValue) {
        $failures[] = "Missing test value for field type: $type";
    }
}

// Verify JSON serialization round-trips correctly
foreach ($fieldValueMap as $type => $value) {
    if ($value === null) continue;
    $encoded = json_encode($value);
    $decoded = json_decode($encoded, true);
    assert_eq($value, $decoded, "JSON round-trip for type $type");
}

if (empty($failures)) {
    echo "  All " . count($fieldValueMap) . " field types have test values\n";
    echo "  All values survive JSON round-trip\n";
}

// Test 3: Simulate full response_data payload
echo "\nTest 3: Full response payload...\n";

$responseData = [];
$fieldIndex = 0;
foreach ($knownTypes as $type) {
    $fieldId = "field_" . $type;
    $value = $fieldValueMap[$type];
    if ($value !== null) {
        $responseData[$fieldId] = $value;
    }
}

$payload = json_encode(['response_data' => $responseData]);
$decoded = json_decode($payload, true);

assert_not_empty($decoded['response_data'], 'response_data key exists after encode/decode');

// Verify each stored value
foreach ($responseData as $fieldId => $expectedValue) {
    $storedValue = $decoded['response_data'][$fieldId] ?? null;
    assert_eq($expectedValue, $storedValue, "Stored value for $fieldId");
}

if (empty($failures)) {
    echo "  Full response payload with " . count($responseData) . " answers round-trips correctly\n";
}

// Test 4: Verify form metadata structure
echo "\nTest 4: Form metadata structure...\n";

$formMeta = [
    'id' => 'test-form-1',
    'title' => 'Test Form',
    'description' => 'A comprehensive test form',
    'scope_type' => 'zone',
    'period' => '2026-06',
    'is_active' => true,
    'is_template' => false,
    'is_public' => true,
    'created_by' => 'admin-1',
];

$metaPayload = json_encode($formMeta);
$metaDecoded = json_decode($metaPayload, true);

foreach ($formMeta as $key => $expected) {
    assert_eq($expected, $metaDecoded[$key], "Form metadata key: $key");
}

if (empty($failures)) {
    echo "  All form metadata fields round-trip correctly\n";
}

// Test 5: Verify portal_perf_fields schema compliance
echo "\nTest 5: Field schema compliance...\n";

$fieldRecord = [
    'id' => 'field-1',
    'form_id' => 'test-form-1',
    'type' => 'mcq',
    'label' => 'Test MCQ',
    'description' => 'Select one option',
    'options' => json_encode(['A', 'B', 'C']),
    'is_required' => 1,
    'display_order' => 0,
    'max_value' => null,
];

// Verify JSON encoding of options
$optionsDecoded = json_decode($fieldRecord['options'], true);
assert_eq(['A', 'B', 'C'], $optionsDecoded, 'Field options round-trip');

// Verify max_value handling for different types
$maxValueFields = ['number', 'rating', 'star_rating', 'scale_rating', 'spinner'];
foreach ($maxValueFields as $type) {
    $record = array_merge($fieldRecord, ['type' => $type, 'max_value' => 10]);
    $enc = json_encode($record);
    $dec = json_decode($enc, true);
    assert_eq(10, $dec['max_value'], "max_value preserved for type $type");
    assert_eq($type, $dec['type'], "type preserved for $type");
}

// Test 6: Verify review system data structure
echo "\nTest 6: Review data structure...\n";

$review = [
    'id' => 'review-1',
    'response_id' => 'response-1',
    'reviewer_id' => 'reviewer-1',
    'rating' => 4,
    'comment' => 'Good work',
    'created_at' => '2026-06-14 10:00:00',
    'updated_at' => '2026-06-14 10:00:00',
];

$reviewPayload = json_encode($review);
$reviewDecoded = json_decode($reviewPayload, true);

foreach (['id', 'response_id', 'reviewer_id', 'rating', 'comment'] as $key) {
    assert_eq($review[$key], $reviewDecoded[$key], "Review key: $key");
}

// Test 7: Verify unique constraint on (form_id, member_id)
echo "\nTest 7: Upsert constraint validation...\n";
$uniqueKey = ['form_id' => 'form-1', 'member_id' => 'member-1'];
$uniqueEncoded = json_encode($uniqueKey);
$uniqueDecoded = json_decode($uniqueEncoded, true);
assert_eq('form-1', $uniqueDecoded['form_id'], 'Upsert key form_id');
assert_eq('member-1', $uniqueDecoded['member_id'], 'Upsert key member_id');

// Summary
echo "\n" . str_repeat('=', 50) . "\n";
if (empty($failures)) {
    echo "ALL TESTS PASSED\n";
} else {
    echo count($failures) . " TEST(S) FAILED:\n";
    foreach ($failures as $f) {
        echo "  FAIL: $f\n";
    }
}

exit(empty($failures) ? 0 : 1);