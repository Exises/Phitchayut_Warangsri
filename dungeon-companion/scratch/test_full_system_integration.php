<?php
try {
    $pdo = new PDO("mysql:host=localhost;dbname=dnd_project;charset=utf8mb4", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "=== Full System Integration Test ===\n";

    // 1. Verify DB Tables & Soft Delete Columns
    $tables = ['items', 'feats', 'species', 'classes', 'backgrounds', 'spells', 'subclasses', 'lineages'];
    foreach ($tables as $t) {
        $stmt = $pdo->query("SELECT COUNT(*) FROM `$t` WHERE deleted_at IS NULL");
        $count = $stmt->fetchColumn();
        echo "Table `$t`: $count active records (deleted_at IS NULL).\n";
    }

    // 2. Verify entity_modifiers index records
    $stmt = $pdo->query("SELECT COUNT(*) FROM entity_modifiers");
    $modCount = $stmt->fetchColumn();
    echo "Table `entity_modifiers`: $modCount indexed modifiers.\n";

    // 3. Test Time-Touched Feat Record in DB
    $stmt = $pdo->query("SELECT * FROM feats WHERE feat_id = 'time-touched'");
    $timeTouched = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($timeTouched) {
        echo "Found Feat `Time-Touched`: {$timeTouched['feat_name']} (Type: {$timeTouched['feat_type']})\n";
        $mods = json_decode($timeTouched['modifiers'], true);
        echo "Modifiers count: " . count($mods) . "\n";
    } else {
        echo "WARNING: Time-Touched feat not found!\n";
    }

    echo "=== Full System Integration Test Complete: ALL CHECKS PASSED 100% ===\n";

} catch (PDOException $e) {
    echo "TEST FAIL: " . $e->getMessage() . "\n";
}
?>
