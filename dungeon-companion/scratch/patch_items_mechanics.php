<?php
$pdo = new PDO("mysql:host=localhost;dbname=dnd_project;charset=utf8mb4", "root", "");

$stmt = $pdo->query("SELECT * FROM items");
$items = $stmt->fetchAll(PDO::FETCH_ASSOC);

$updated = 0;

foreach ($items as $row) {
    $mechanics = json_decode($row['mechanics'], true);
    if (!is_array($mechanics)) {
        $mechanics = ['logic' => [], 'display' => '', 'modifiers' => []];
    }
    
    // Parse Weapons
    if ($row['item_type'] === 'Weapon' || stripos($row['subcategory'], 'Weapons') !== false) {
        // category
        if (stripos($row['subcategory'], 'Simple') !== false) {
            $mechanics['logic']['weapon_category'] = 'Simple';
        } else if (stripos($row['subcategory'], 'Martial') !== false) {
            $mechanics['logic']['weapon_category'] = 'Martial';
        }
        
        // damage
        if (!empty($row['damage'])) {
            if (preg_match('/(\d+d\d+|\d+)\s+([a-zA-Z]+)/', $row['damage'], $m)) {
                $mechanics['logic']['damage_dice'] = $m[1];
                $mechanics['logic']['damage_type'] = $m[2];
            }
        }
        
        // properties
        $props = [];
        if (!empty($row['properties'])) {
            $raw_props = explode(',', $row['properties']);
            foreach ($raw_props as $rp) {
                $rp = trim($rp);
                if (preg_match('/Versatile\s*\((.*?)\)/i', $rp, $m)) {
                    $props[] = 'Versatile';
                    $mechanics['logic']['versatile_dice'] = $m[1];
                } else if (preg_match('/Thrown\s*\(Range\s*(\d+)\/(\d+)\)/i', $rp, $m)) {
                    $props[] = 'Thrown';
                    $mechanics['logic']['range'] = ['normal' => (int)$m[1], 'long' => (int)$m[2]];
                } else if (preg_match('/Ammunition\s*\(Range\s*(\d+)\/(\d+)(.*?)\)/i', $rp, $m)) {
                    $props[] = 'Ammunition';
                    $mechanics['logic']['range'] = ['normal' => (int)$m[1], 'long' => (int)$m[2]];
                } else {
                    $props[] = trim(preg_replace('/\(.*?\)/', '', $rp)); // Strip other parens
                }
            }
        }
        $mechanics['logic']['properties'] = array_filter(array_map('trim', $props));
        
        // mastery
        if (!empty($row['mastery'])) {
            $mechanics['logic']['mastery_id'] = strtolower(trim($row['mastery']));
        }
        
        // display
        $displayParts = [];
        if (!empty($row['damage'])) $displayParts[] = trim($row['damage']);
        if (!empty($row['properties'])) $displayParts[] = trim($row['properties']);
        if (!empty($row['mastery'])) $displayParts[] = "Mastery: " . trim($row['mastery']);
        $mechanics['display'] = implode(' | ', $displayParts);
    }
    
    // Parse Armor
    else if ($row['item_type'] === 'Armor' || stripos($row['subcategory'], 'Armor') !== false || stripos($row['subcategory'], 'Shield') !== false) {
        if (stripos($row['subcategory'], 'Light') !== false) {
            $mechanics['logic']['armor_category'] = 'Light';
        } else if (stripos($row['subcategory'], 'Medium') !== false) {
            $mechanics['logic']['armor_category'] = 'Medium';
        } else if (stripos($row['subcategory'], 'Heavy') !== false) {
            $mechanics['logic']['armor_category'] = 'Heavy';
        } else if (stripos($row['subcategory'], 'Shield') !== false) {
            $mechanics['logic']['armor_category'] = 'Shield';
        }
        
        // AC
        if (!empty($row['ac'])) {
            if (preg_match('/(\d+)\s*\+\s*Dex modifier\s*\(max\s*(\d+)\)/i', $row['ac'], $m)) {
                $mechanics['logic']['base_ac'] = (int)$m[1];
                $mechanics['logic']['dex_modifier'] = 'max' . $m[2];
            } else if (preg_match('/(\d+)\s*\+\s*Dex modifier/i', $row['ac'], $m)) {
                $mechanics['logic']['base_ac'] = (int)$m[1];
                $mechanics['logic']['dex_modifier'] = 'full';
            } else if (preg_match('/(\d+)/', $row['ac'], $m)) {
                $mechanics['logic']['base_ac'] = (int)$m[1];
                if (stripos($row['subcategory'], 'Shield') === false) {
                    $mechanics['logic']['dex_modifier'] = 'none';
                }
            }
        }
        
        // Stealth
        if (!empty($row['stealth']) && stripos($row['stealth'], 'Disadvantage') !== false) {
            $mechanics['logic']['stealth_disadvantage'] = true;
        } else {
            $mechanics['logic']['stealth_disadvantage'] = false;
        }
        
        // Strength
        if (!empty($row['strength_req']) && preg_match('/(\d+)/', $row['strength_req'], $m)) {
            $mechanics['logic']['strength_requirement'] = (int)$m[1];
        } else {
            $mechanics['logic']['strength_requirement'] = 0;
        }
        
        // display
        $displayParts = [];
        if (!empty($row['ac'])) $displayParts[] = "AC: " . trim($row['ac']);
        if (isset($mechanics['logic']['armor_category'])) $displayParts[] = $mechanics['logic']['armor_category'] . " Armor";
        $mechanics['display'] = implode(' | ', $displayParts);
    }
    
    // Only update if mechanics actually changed
    $newMech = json_encode($mechanics, JSON_UNESCAPED_UNICODE);
    if ($newMech !== $row['mechanics']) {
        $upd = $pdo->prepare("UPDATE items SET mechanics = ? WHERE item_id = ?");
        $upd->execute([$newMech, $row['item_id']]);
        $updated++;
    }
}

echo "Successfully updated mechanics for $updated items.\n";
?>
