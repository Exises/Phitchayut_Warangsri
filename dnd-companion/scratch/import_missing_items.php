<?php
$pdo = new PDO("mysql:host=localhost;dbname=dnd_project;charset=utf8mb4", "root", "");

// Helper function to format ID
function formatId($name) {
    $id = strtolower(trim($name));
    $id = preg_replace('/[^a-z0-9\s-]/', '', $id);
    $id = preg_replace('/[\s-]+/', '_', $id);
    return $id;
}

// 1. Fetch existing items
$stmt = $pdo->query("SELECT item_name FROM items");
$existingNames = $stmt->fetchAll(PDO::FETCH_COLUMN);
$existingMap = [];
foreach ($existingNames as $en) {
    $existingMap[strtolower(trim($en))] = true;
}

$newItems = [];
$totalAdded = 0;

// ==========================================
// PARSE equipment.md
// ==========================================
$equipFile = file_get_contents('DND/equipment.md');
// Extract adventuring gear descriptions
preg_match_all('/####\s+([^\n]+?)(?:\s+\([^\)]+\))?\s*\n+(.*?)(?=\n####|\Z)/s', $equipFile, $gearMatches);
$gearDescs = [];
for ($i=0; $i<count($gearMatches[0]); $i++) {
    $name = trim($gearMatches[1][$i]);
    $name = preg_replace('/^\+1, \+2, or \+3\s+/', '', $name);
    $desc = trim($gearMatches[2][$i]);
    $gearDescs[strtolower($name)] = $desc;
}

// Extract Weapons Table
if (preg_match('/Weapons\*\*.*?(<table.*?>.*?<\/table>)/s', $equipFile, $m)) {
    $tableHtml = $m[1];
    $subcategory = 'Weapon';
    preg_match_all('/<tr>(.*?)<\/tr>/s', $tableHtml, $rows);
    foreach ($rows[1] as $row) {
        if (preg_match('/<th.*?>(.*?)<\/th>/s', $row, $th)) {
            $subcategory = strip_tags($th[1]);
            continue;
        }
        if (preg_match_all('/<td>(.*?)<\/td>/s', $row, $tds)) {
            if (count($tds[1]) == 6) {
                $name = trim(strip_tags($tds[1][0]));
                if ($name === 'Name' || empty($name)) continue;
                $item = [
                    'item_id' => formatId($name),
                    'item_name' => $name,
                    'item_type' => 'Weapon',
                    'subcategory' => $subcategory,
                    'damage' => trim(strip_tags($tds[1][1])),
                    'properties' => trim(strip_tags($tds[1][2])) === '—' ? '' : trim(strip_tags($tds[1][2])),
                    'mastery' => trim(strip_tags($tds[1][3])) === '—' ? '' : trim(strip_tags($tds[1][3])),
                    'weight' => trim(strip_tags($tds[1][4])) === '—' ? '' : trim(strip_tags($tds[1][4])),
                    'cost' => trim(strip_tags($tds[1][5])),
                    'srd_source' => 'SRD 2024'
                ];
                if (!isset($existingMap[strtolower($name)])) {
                    $newItems[] = $item;
                    $existingMap[strtolower($name)] = true;
                }
            }
        }
    }
}

// Extract Armor Table
if (preg_match('/Armor\*\*.*?(<table.*?>.*?<\/table>)/s', $equipFile, $m)) {
    $tableHtml = $m[1];
    $subcategory = 'Armor';
    preg_match_all('/<tr>(.*?)<\/tr>/s', $tableHtml, $rows);
    foreach ($rows[1] as $row) {
        if (preg_match('/<th.*?>(.*?)<\/th>/s', $row, $th)) {
            $subcategory = strip_tags($th[1]);
            continue;
        }
        if (preg_match_all('/<td>(.*?)<\/td>/s', $row, $tds)) {
            if (count($tds[1]) == 6) {
                $name = trim(strip_tags($tds[1][0]));
                if ($name === 'Armor' || empty($name)) continue;
                $item = [
                    'item_id' => formatId($name),
                    'item_name' => $name,
                    'item_type' => 'Armor',
                    'subcategory' => $subcategory,
                    'ac' => trim(strip_tags($tds[1][1])),
                    'strength_req' => trim(strip_tags($tds[1][2])) === '—' ? '' : trim(strip_tags($tds[1][2])),
                    'stealth' => trim(strip_tags($tds[1][3])) === '—' ? '' : trim(strip_tags($tds[1][3])),
                    'weight' => trim(strip_tags($tds[1][4])) === '—' ? '' : trim(strip_tags($tds[1][4])),
                    'cost' => trim(strip_tags($tds[1][5])),
                    'srd_source' => 'SRD 2024'
                ];
                if (!isset($existingMap[strtolower($name)])) {
                    $newItems[] = $item;
                    $existingMap[strtolower($name)] = true;
                }
            }
        }
    }
}

// Extract Gear Table
if (preg_match('/Adventuring Gear\*\*.*?(<table.*?>.*?<\/table>)/s', $equipFile, $m)) {
    $tableHtml = $m[1];
    preg_match_all('/<tr>(.*?)<\/tr>/s', $tableHtml, $rows);
    foreach ($rows[1] as $row) {
        if (preg_match_all('/<td>(.*?)<\/td>/s', $row, $tds)) {
            if (count($tds[1]) >= 3) {
                $name = trim(strip_tags($tds[1][0]));
                if ($name === 'Item' || empty($name)) continue;
                $desc = isset($gearDescs[strtolower($name)]) ? $gearDescs[strtolower($name)] : '';
                $item = [
                    'item_id' => formatId($name),
                    'item_name' => $name,
                    'item_type' => 'Gear',
                    'subcategory' => 'Adventuring Gear',
                    'weight' => trim(strip_tags($tds[1][1])) === '—' ? '' : trim(strip_tags($tds[1][1])),
                    'cost' => trim(strip_tags($tds[1][2])),
                    'item_desc' => $desc,
                    'srd_source' => 'SRD 2024'
                ];
                if (!isset($existingMap[strtolower($name)])) {
                    $newItems[] = $item;
                    $existingMap[strtolower($name)] = true;
                }
            }
        }
    }
}


// ==========================================
// PARSE magic-items.md
// ==========================================
$magicFile = file_get_contents('DND/magic-items.md');
preg_match_all('/####\s+([^\n]+)\n+_(.+?)_\n+(.*?)(?=\n####|\Z)/s', $magicFile, $magicMatches);
for ($i=0; $i<count($magicMatches[0]); $i++) {
    $name = trim($magicMatches[1][$i]);
    $meta = trim($magicMatches[2][$i]); // e.g. Armor (Plate Armor), Legendary (Requires Attunement)
    $desc = trim($magicMatches[3][$i]);
    
    // Parse meta
    $type = 'Magic Item';
    $subcat = '';
    $rarity = 'None';
    $attunement = '';
    
    $parts = explode(',', $meta);
    $typePart = trim($parts[0]);
    if (preg_match('/(.*?)\s*\((.*?)\)/', $typePart, $tm)) {
        $typeStr = trim($tm[1]);
        $subcat = trim($tm[2]);
    } else {
        $typeStr = $typePart;
    }
    
    if (stripos($typeStr, 'Armor') !== false) $type = 'Armor';
    else if (stripos($typeStr, 'Weapon') !== false) $type = 'Weapon';
    
    if (count($parts) > 1) {
        $rarePart = trim($parts[1]);
        if (preg_match('/(.*?)\s*\((.*?)\)/', $rarePart, $rm)) {
            $rarity = trim($rm[1]);
            $attunement = trim($rm[2]);
        } else {
            $rarity = $rarePart;
        }
    }
    
    $item = [
        'item_id' => formatId($name),
        'item_name' => $name,
        'item_type' => $type,
        'subcategory' => $subcat ? $subcat : $typeStr,
        'rarity' => $rarity,
        'attunement' => $attunement,
        'item_desc' => $desc,
        'srd_source' => 'SRD 2024'
    ];
    
    if (!isset($existingMap[strtolower($name)])) {
        $newItems[] = $item;
        $existingMap[strtolower($name)] = true;
    }
}

// ==========================================
// INSERT NEW ITEMS
// ==========================================
$stmt = $pdo->prepare("INSERT INTO items 
    (item_id, item_name, item_type, subcategory, rarity, cost, weight, attunement, damage, mastery, properties, ac, strength_req, stealth, item_desc, srd_source, is_homebrew) 
    VALUES 
    (:item_id, :item_name, :item_type, :subcategory, :rarity, :cost, :weight, :attunement, :damage, :mastery, :properties, :ac, :strength_req, :stealth, :item_desc, :srd_source, 0)");

foreach ($newItems as $item) {
    try {
        $stmt->execute([
            ':item_id' => substr($item['item_id'], 0, 100),
            ':item_name' => substr($item['item_name'], 0, 100),
            ':item_type' => $item['item_type'] ?? 'Gear',
            ':subcategory' => substr($item['subcategory'] ?? '', 0, 100),
            ':rarity' => substr($item['rarity'] ?? 'None', 0, 50),
            ':cost' => substr($item['cost'] ?? '', 0, 50),
            ':weight' => substr($item['weight'] ?? '', 0, 50),
            ':attunement' => substr($item['attunement'] ?? '', 0, 100),
            ':damage' => substr($item['damage'] ?? '', 0, 50),
            ':mastery' => substr($item['mastery'] ?? '', 0, 50),
            ':properties' => substr($item['properties'] ?? '', 0, 255),
            ':ac' => substr($item['ac'] ?? '', 0, 100),
            ':strength_req' => substr($item['strength_req'] ?? '', 0, 50),
            ':stealth' => substr($item['stealth'] ?? '', 0, 50),
            ':item_desc' => $item['item_desc'] ?? '',
            ':srd_source' => $item['srd_source'] ?? 'SRD 2024'
        ]);
        $totalAdded++;
    } catch(Exception $e) {
        echo "Failed to add {$item['item_name']}: " . $e->getMessage() . "\n";
    }
}

echo "Successfully added $totalAdded new items.\n";
?>
