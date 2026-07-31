<?php
$pdo = new PDO("mysql:host=localhost;dbname=dnd_project;charset=utf8mb4", "root", "");

function formatId($name) {
    $id = strtolower(trim($name));
    $id = preg_replace('/[^a-z0-9\s-]/', '', $id);
    $id = preg_replace('/[\s-]+/', '_', $id);
    return substr($id, 0, 100);
}

$equipFile = file_get_contents('DND/equipment.md');

// Prepare PDO statement for UPSERT (ON DUPLICATE KEY UPDATE)
$sql = "INSERT INTO items 
    (item_id, item_name, item_type, subcategory, rarity, cost, weight, attunement, damage, mastery, properties, ac, strength_req, stealth, item_desc, mechanics, srd_source, is_homebrew)
    VALUES 
    (:item_id, :item_name, :item_type, :subcategory, :rarity, :cost, :weight, :attunement, :damage, :mastery, :properties, :ac, :strength_req, :stealth, :item_desc, :mechanics, 'SRD 2024', 0)
    ON DUPLICATE KEY UPDATE
    item_name = VALUES(item_name),
    item_type = VALUES(item_type),
    subcategory = VALUES(subcategory),
    cost = IF(VALUES(cost) != '', VALUES(cost), cost),
    weight = IF(VALUES(weight) != '', VALUES(weight), weight),
    properties = IF(VALUES(properties) != '', VALUES(properties), properties),
    item_desc = IF(VALUES(item_desc) != '', VALUES(item_desc), item_desc),
    mechanics = IF(VALUES(mechanics) != '', VALUES(mechanics), mechanics)";

$stmt = $pdo->prepare($sql);

$insertedCount = 0;

// ========================================================
// 1. PARSE TOOLS SECTION (Lines 604 to 763)
// ========================================================
if (preg_match('/## Tools\s*\n+(.*?)(?=\n## Adventuring Gear|\Z)/s', $equipFile, $toolsBlockMatch)) {
    $toolsBlock = $toolsBlockMatch[1];
    
    // Match tool entries like: **Alchemist's Supplies (50 GP)**
    // or **Tinker's Tools (50 GP)**
    // followed by Ability, Weight, Utilize, Craft, Variants
    preg_match_all('/\*\*(.+?)\s*\((.+?)\)\*\*\s*\n+(.*?)(?=\n\*\*[A-Z]|\n####|\Z)/s', $toolsBlock, $toolMatches);
    
    for ($i = 0; $i < count($toolMatches[0]); $i++) {
        $name = trim($toolMatches[1][$i]);
        $cost = trim($toolMatches[2][$i]);
        $body = trim($toolMatches[3][$i]);
        
        $ability = '';
        $weight = '';
        $utilize = '';
        $craft = '';
        $variants = [];
        
        if (preg_match('/\*\*Ability:\*\*\s*([^\*\n]+)/i', $body, $m)) $ability = trim($m[1]);
        if (preg_match('/\*\*Weight:\*\*\s*([^\*\n]+)/i', $body, $m)) $weight = trim($m[1]);
        if (preg_match('/\*\*Utilize:\*\*\s*([^\*\n]+)/i', $body, $m)) $utilize = trim($m[1]);
        if (preg_match('/\*\*Craft:\*\*\s*([^\*\n]+)/i', $body, $m)) $craft = trim($m[1]);
        if (preg_match('/\*\*Variants:\*\*\s*([^\n]+)/i', $body, $m)) {
            $variantStr = trim($m[1]);
            // e.g. Bagpipes (30 GP, 6 lb.), drum (6 GP, 3 lb.)
            preg_match_all('/([A-Za-z\s-]+)\s*\(([^,\)]+)(?:,\s*([^,\)]+))?\)/', $variantStr, $vm);
            for ($j = 0; $j < count($vm[0]); $j++) {
                $vName = trim($vm[1][$j]);
                $vCost = trim($vm[2][$j]);
                $vWeight = isset($vm[3][$j]) ? trim($vm[3][$j]) : '';
                $variants[] = [
                    'name' => ucfirst($vName),
                    'cost' => $vCost,
                    'weight' => $vWeight
                ];
            }
        }
        
        // Build description
        $descParts = [];
        if ($ability) $descParts[] = "**Ability:** $ability";
        if ($utilize) $descParts[] = "**Utilize:** $utilize";
        if ($craft) $descParts[] = "**Craft:** $craft";
        $desc = implode("\n\n", $descParts);
        
        $properties = $ability ? "Ability: $ability" : "";
        
        $mechanics = [
            'logic' => [
                'tool_type' => 'Artisan Tools',
                'ability' => $ability,
                'utilize' => $utilize,
                'craft' => $craft
            ],
            'display' => "Ability: " . ($ability ?: 'Varies') . ($craft ? " | Craft: $craft" : ""),
            'modifiers' => []
        ];
        
        // Insert main tool
        $stmt->execute([
            ':item_id' => formatId($name),
            ':item_name' => $name,
            ':item_type' => 'Tool',
            ':subcategory' => 'Tool',
            ':rarity' => 'None',
            ':cost' => $cost,
            ':weight' => $weight === '—' ? '' : $weight,
            ':attunement' => '',
            ':damage' => '',
            ':mastery' => '',
            ':properties' => $properties,
            ':ac' => '',
            ':strength_req' => '',
            ':stealth' => '',
            ':item_desc' => $desc,
            ':mechanics' => json_encode($mechanics, JSON_UNESCAPED_UNICODE)
        ]);
        $insertedCount++;
        
        // Insert variants (e.g. Bagpipes, Dice, etc.) as individual tools
        foreach ($variants as $v) {
            $vDesc = "**Ability:** $ability (Variant of $name)\n\n" . ($utilize ? "**Utilize:** $utilize" : "");
            $vMech = [
                'logic' => [
                    'tool_type' => $name,
                    'ability' => $ability,
                    'utilize' => $utilize
                ],
                'display' => "Ability: $ability | Variant of $name",
                'modifiers' => []
            ];
            $stmt->execute([
                ':item_id' => formatId($v['name']),
                ':item_name' => $v['name'],
                ':item_type' => 'Tool',
                ':subcategory' => $name,
                ':rarity' => 'None',
                ':cost' => $v['cost'],
                ':weight' => $v['weight'] === '—' ? '' : $v['weight'],
                ':attunement' => '',
                ':damage' => '',
                ':mastery' => '',
                ':properties' => $ability ? "Ability: $ability" : "",
                ':ac' => '',
                ':strength_req' => '',
                ':stealth' => '',
                ':item_desc' => $vDesc,
                ':mechanics' => json_encode($vMech, JSON_UNESCAPED_UNICODE)
            ]);
            $insertedCount++;
        }
    }
}

// ========================================================
// 2. PARSE MOUNTS AND OTHER ANIMALS TABLE (Lines 1700 to 1750)
// ========================================================
if (preg_match('/Mounts and Other Animals\*\*.*?(<table.*?>.*?<\/table>)/s', $equipFile, $m)) {
    preg_match_all('/<tr>(.*?)<\/tr>/s', $m[1], $rows);
    foreach ($rows[1] as $row) {
        if (preg_match_all('/<td>(.*?)<\/td>/s', $row, $tds)) {
            if (count($tds[1]) >= 3) {
                $name = trim(strip_tags($tds[1][0]));
                $cap = trim(strip_tags($tds[1][1]));
                $cost = trim(strip_tags($tds[1][2]));
                if ($name === 'Item' || empty($name)) continue;
                
                $desc = "Carrying Capacity: $cap";
                $mech = ['logic' => ['carrying_capacity' => $cap], 'display' => "Carrying Capacity: $cap", 'modifiers' => []];
                
                $stmt->execute([
                    ':item_id' => formatId($name),
                    ':item_name' => $name,
                    ':item_type' => 'Mount',
                    ':subcategory' => 'Mount',
                    ':rarity' => 'None',
                    ':cost' => $cost,
                    ':weight' => '',
                    ':attunement' => '',
                    ':damage' => '',
                    ':mastery' => '',
                    ':properties' => "Carrying Capacity: $cap",
                    ':ac' => '',
                    ':strength_req' => '',
                    ':stealth' => '',
                    ':item_desc' => $desc,
                    ':mechanics' => json_encode($mech, JSON_UNESCAPED_UNICODE)
                ]);
                $insertedCount++;
            }
        }
    }
}

// ========================================================
// 3. PARSE TACK, HARNESS, AND DRAWN VEHICLES (Lines 1753 to 1820)
// ========================================================
if (preg_match('/Tack, Harness, and Drawn Vehicles\*\*.*?(<table.*?>.*?<\/table>)/s', $equipFile, $m)) {
    preg_match_all('/<tr>(.*?)<\/tr>/s', $m[1], $rows);
    foreach ($rows[1] as $row) {
        if (preg_match_all('/<td>(.*?)<\/td>/s', $row, $tds)) {
            if (count($tds[1]) >= 3) {
                $name = trim(strip_tags($tds[1][0]));
                $weight = trim(strip_tags($tds[1][1]));
                $cost = trim(strip_tags($tds[1][2]));
                if ($name === 'Item' || empty($name) || empty($cost)) continue;
                
                $stmt->execute([
                    ':item_id' => formatId($name),
                    ':item_name' => $name,
                    ':item_type' => 'Vehicle',
                    ':subcategory' => 'Land Vehicle / Harness',
                    ':rarity' => 'None',
                    ':cost' => $cost,
                    ':weight' => $weight === '—' ? '' : $weight,
                    ':attunement' => '',
                    ':damage' => '',
                    ':mastery' => '',
                    ':properties' => '',
                    ':ac' => '',
                    ':strength_req' => '',
                    ':stealth' => '',
                    ':item_desc' => "Land vehicle or tack item.",
                    ':mechanics' => json_encode(['logic' => [], 'display' => '', 'modifiers' => []], JSON_UNESCAPED_UNICODE)
                ]);
                $insertedCount++;
            }
        }
    }
}

// ========================================================
// 4. PARSE LARGE / WATERBORNE / AIRBORNE VEHICLES (Lines 1829 to 1922)
// ========================================================
if (preg_match('/Airborne and Waterborne Vehicles table.*?<table.*?>.*?<\/table>/s', $equipFile, $m)) {
    preg_match_all('/<tr>(.*?)<\/tr>/s', $m[0], $rows);
    foreach ($rows[1] as $row) {
        if (preg_match_all('/<td>(.*?)<\/td>/s', $row, $tds)) {
            if (count($tds[1]) >= 9) {
                $name = trim(strip_tags($tds[1][0]));
                $speed = trim(strip_tags($tds[1][1]));
                $crew = trim(strip_tags($tds[1][2]));
                $passengers = trim(strip_tags($tds[1][3]));
                $cargo = trim(strip_tags($tds[1][4]));
                $ac = trim(strip_tags($tds[1][5]));
                $hp = trim(strip_tags($tds[1][6]));
                $dt = trim(strip_tags($tds[1][7]));
                $cost = trim(strip_tags($tds[1][8]));
                if ($name === 'Ship' || empty($name)) continue;
                
                $desc = "Speed: $speed | Crew: $crew | Passengers: $passengers | Cargo: $cargo tons | AC: $ac | HP: $hp" . ($dt !== '—' ? " | Damage Threshold: $dt" : "");
                $mech = [
                    'logic' => [
                        'speed' => $speed,
                        'crew' => $crew,
                        'passengers' => $passengers,
                        'cargo' => $cargo,
                        'ac' => $ac,
                        'hp' => $hp
                    ],
                    'display' => "Speed: $speed | AC: $ac | HP: $hp",
                    'modifiers' => []
                ];
                
                $stmt->execute([
                    ':item_id' => formatId($name),
                    ':item_name' => $name,
                    ':item_type' => 'Vehicle',
                    ':subcategory' => 'Waterborne/Airborne Vehicle',
                    ':rarity' => 'None',
                    ':cost' => $cost,
                    ':weight' => '',
                    ':attunement' => '',
                    ':damage' => '',
                    ':mastery' => '',
                    ':properties' => "Speed: $speed",
                    ':ac' => $ac,
                    ':strength_req' => '',
                    ':stealth' => '',
                    ':item_desc' => $desc,
                    ':mechanics' => json_encode($mech, JSON_UNESCAPED_UNICODE)
                ]);
                $insertedCount++;
            }
        }
    }
}

echo "Successfully processed and upserted $insertedCount items/tools/vehicles.\n";
?>
