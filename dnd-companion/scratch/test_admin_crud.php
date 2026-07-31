<?php
$apiUrl = 'http://localhost/dnd-companion/api.php';
$adminId = 6; // user_id = 6 (EARTH) is admin

// Test: Create a new Feat
$createData = [
    'action' => 'create_compendium_item',
    'admin_id' => $adminId,
    'target_table' => 'feats',
    'item_data' => [
        'feat_id' => 'qa_test_feat',
        'feat_name' => 'QA Testing Feat',
        'feat_type' => 'General',
        'prerequisite' => 'None',
        'feat_desc' => 'A feat created for QA testing.'
    ]
];

$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($createData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
curl_close($ch);

echo "Create Response: " . $response . "\n";

// Test: Delete the Feat (Soft Delete)
$deleteData = [
    'action' => 'delete_compendium_item',
    'admin_id' => $adminId,
    'target_table' => 'feats',
    'item_id' => 'qa_test_feat'
];

$ch2 = curl_init($apiUrl);
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch2, CURLOPT_POST, true);
curl_setopt($ch2, CURLOPT_POSTFIELDS, json_encode($deleteData));
curl_setopt($ch2, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response2 = curl_exec($ch2);
curl_close($ch2);

echo "Delete Response: " . $response2 . "\n";
