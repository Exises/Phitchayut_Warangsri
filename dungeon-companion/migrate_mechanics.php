<?php
$host = 'localhost';
$dbname = 'dnd_project';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Connected to DB.\n";

    // --- 1. SPECIES MIGRATION ---
    echo "Migrating Species...\n";
    $stmt = $pdo->query("SELECT species_id, traits FROM species");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $traits = json_decode($row['traits'], true);
        if (is_array($traits)) {
            $updated = false;
            foreach ($traits as &$trait) {
                if (!isset($trait['modifiers']) || !is_array($trait['modifiers'])) {
                    $trait['modifiers'] = [];
                    $updated = true;
                }
                
                $name = strtolower($trait['name'] ?? '');
                if (strpos($name, 'darkvision') !== false && empty($trait['modifiers'])) {
                    $trait['modifiers'][] = ["type" => "sense", "sub_type" => "vision", "target" => "darkvision", "value" => "60"];
                    if (empty($trait['desc'])) $trait['desc'] = "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.";
                    $updated = true;
                }
                if (strpos($name, 'keen senses') !== false && empty($trait['modifiers'])) {
                    $trait['modifiers'][] = ["type" => "proficiency", "sub_type" => "skill", "target" => "perception", "value" => ""];
                    if (empty($trait['desc'])) $trait['desc'] = "You have proficiency in the Perception skill.";
                    $updated = true;
                }
                if (strpos($name, 'dwarven resilience') !== false && empty($trait['modifiers'])) {
                    $trait['modifiers'][] = ["type" => "resistance", "sub_type" => "damage", "target" => "poison", "value" => ""];
                    $trait['modifiers'][] = ["type" => "advantage", "sub_type" => "save", "target" => "poison", "value" => ""];
                    if (empty($trait['desc'])) $trait['desc'] = "You have advantage on saving throws against poison, and you have resistance against poison damage.";
                    $updated = true;
                }
            }
            if ($updated) {
                $upStmt = $pdo->prepare("UPDATE species SET traits = ? WHERE species_id = ?");
                $upStmt->execute([json_encode($traits, JSON_UNESCAPED_UNICODE), $row['species_id']]);
                echo "Updated species: {$row['species_id']}\n";
            }
        }
    }

    // --- 2. CLASSES MIGRATION ---
    echo "Migrating Classes...\n";
    $stmt = $pdo->query("SELECT class_id, features FROM classes");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $features = json_decode($row['features'], true);
        if (is_array($features)) {
            $updated = false;
            foreach ($features as &$feat) {
                if (!isset($feat['modifiers'])) {
                    $feat['modifiers'] = [];
                    $updated = true;
                }
                $name = strtolower($feat['name'] ?? '');
                if ($name === 'rage' && empty($feat['modifiers'])) {
                    $feat['modifiers'][] = ["type" => "resistance", "sub_type" => "damage", "target" => "bludgeoning", "value" => ""];
                    $feat['modifiers'][] = ["type" => "resistance", "sub_type" => "damage", "target" => "piercing", "value" => ""];
                    $feat['modifiers'][] = ["type" => "resistance", "sub_type" => "damage", "target" => "slashing", "value" => ""];
                    if (empty($feat['desc'])) $feat['desc'] = "In battle, you fight with primal ferocity. You gain resistance to bludgeoning, piercing, and slashing damage.";
                    $updated = true;
                }
                if ($name === 'unarmored defense' && empty($feat['modifiers'])) {
                    $feat['modifiers'][] = ["type" => "bonus", "sub_type" => "ac", "target" => "constitution", "value" => ""];
                    if (empty($feat['desc'])) $feat['desc'] = "While you are not wearing any armor, your Armor Class equals 10 + your Dexterity modifier + your Constitution modifier.";
                    $updated = true;
                }
            }
            if ($updated) {
                $upStmt = $pdo->prepare("UPDATE classes SET features = ? WHERE class_id = ?");
                $upStmt->execute([json_encode($features, JSON_UNESCAPED_UNICODE), $row['class_id']]);
                echo "Updated class: {$row['class_id']}\n";
            }
        }
    }

    // --- 3. ITEMS MIGRATION ---
    echo "Migrating Items...\n";
    $stmt = $pdo->query("SELECT item_id, mechanics FROM items");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $mechanics = json_decode($row['mechanics'], true);
        if (is_array($mechanics) && !isset($mechanics['modifiers'])) {
            $mechanics['modifiers'] = [];
            $upStmt = $pdo->prepare("UPDATE items SET mechanics = ? WHERE item_id = ?");
            $upStmt->execute([json_encode($mechanics, JSON_UNESCAPED_UNICODE), $row['item_id']]);
            echo "Updated item: {$row['item_id']}\n";
        }
    }

    // --- 4. FEATS MIGRATION ---
    echo "Migrating Feats...\n";
    try {
        $pdo->exec("ALTER TABLE feats ADD COLUMN modifiers JSON");
        echo "Added 'modifiers' column to feats table.\n";
    } catch (Exception $e) {
        // Column probably exists, ignore
    }

    $stmt = $pdo->query("SELECT feat_id, modifiers FROM feats");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $modifiers = [];
        if ($row['modifiers']) {
            $modifiers = json_decode($row['modifiers'], true) ?? [];
        }
        
        $updated = false;
        if ($row['feat_id'] === 'ability-score-improvement' && empty($modifiers)) {
            $modifiers[] = ["type" => "bonus", "sub_type" => "stat", "target" => "strength", "value" => "2"];
            $updated = true;
        }

        if ($updated || empty($row['modifiers'])) {
            $upStmt = $pdo->prepare("UPDATE feats SET modifiers = ? WHERE feat_id = ?");
            $upStmt->execute([json_encode($modifiers, JSON_UNESCAPED_UNICODE), $row['feat_id']]);
            echo "Updated feat: {$row['feat_id']}\n";
        }
    }

    echo "Migration Complete.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
