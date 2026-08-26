<?php
try {
    $pdo = new PDO("mysql:host=localhost;dbname=dnd_project;charset=utf8mb4", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "--- Phase 1: Backfilling entity_modifiers Index Table ---\n";

    $pdo->exec("TRUNCATE TABLE `entity_modifiers`");

    $count = 0;

    // 1. Feats Modifiers
    $feats = $pdo->query("SELECT feat_id, modifiers FROM feats WHERE modifiers IS NOT NULL AND modifiers != ''")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($feats as $f) {
        $mods = json_decode($f['modifiers'], true);
        if (is_array($mods)) {
            foreach ($mods as $m) {
                if (isset($m['type'])) {
                    $stmt = $pdo->prepare("INSERT INTO entity_modifiers (entity_type, entity_id, mod_type, mod_sub_type, mod_target, mod_value) VALUES ('feat', ?, ?, ?, ?, ?)");
                    $stmt->execute([
                        $f['feat_id'],
                        $m['type'] ?? 'bonus',
                        $m['sub_type'] ?? '',
                        $m['target'] ?? '',
                        is_array($m['value'] ?? '') ? json_encode($m['value']) : (string)($m['value'] ?? '1')
                    ]);
                    $count++;
                }
            }
        }
    }

    // 2. Items Mechanics Modifiers
    $items = $pdo->query("SELECT item_id, mechanics FROM items WHERE mechanics IS NOT NULL AND mechanics != ''")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($items as $it) {
        $mech = json_decode($it['mechanics'], true);
        if (is_array($mech) && isset($mech['modifiers']) && is_array($mech['modifiers'])) {
            foreach ($mech['modifiers'] as $m) {
                if (isset($m['type'])) {
                    $stmt = $pdo->prepare("INSERT INTO entity_modifiers (entity_type, entity_id, mod_type, mod_sub_type, mod_target, mod_value) VALUES ('item', ?, ?, ?, ?, ?)");
                    $stmt->execute([
                        $it['item_id'],
                        $m['type'] ?? 'bonus',
                        $m['sub_type'] ?? '',
                        $m['target'] ?? '',
                        is_array($m['value'] ?? '') ? json_encode($m['value']) : (string)($m['value'] ?? '1')
                    ]);
                    $count++;
                }
            }
        }
    }

    echo "Backfilled $count modifier records into `entity_modifiers` secondary index.\n";
    echo "--- Backfill Complete! ---\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
