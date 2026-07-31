<?php
$pdo = new PDO("mysql:host=localhost;dbname=dnd_project;charset=utf8mb4", "root", "");

function formatId($name) {
    $id = strtolower(trim($name));
    $id = preg_replace('/[^a-z0-9\s-]/', '', $id);
    $id = preg_replace('/[\s-]+/', '_', $id);
    return substr($id, 0, 100);
}

$equipFile = file_get_contents('DND/equipment.md');

// Extract Tools block
if (preg_match('/## Tools\s*\n+(.*?)(?=\n## Adventuring Gear|\Z)/s', $equipFile, $toolsBlockMatch)) {
    $toolsBlock = $toolsBlockMatch[1];
    
    // Find all **Tool Name (Cost)** positions
    preg_match_all('/\*\*([^\n\(\*]+?)\s*\(([^\)]+)\)\*\*/', $toolsBlock, $matches, PREG_OFFSET_CAPTURE);
    
    $stmt = $pdo->prepare("INSERT INTO items 
        (item_id, item_name, item_type, subcategory, rarity, cost, weight, attunement, damage, mastery, properties, ac, strength_req, stealth, item_desc, mechanics, srd_source, is_homebrew)
        VALUES 
        (:item_id, :item_name, :item_type, :subcategory, :rarity, :cost, :weight, :attunement, :damage, :mastery, :properties, :ac, :strength_req, :stealth, :item_desc, :mechanics, 'SRD 2024', 0)
        ON DUPLICATE KEY UPDATE
        item_name = VALUES(item_name),
        item_type = VALUES(item_type),
        subcategory = VALUES(subcategory),
        cost = VALUES(cost),
        weight = VALUES(weight),
        properties = VALUES(properties),
        item_desc = VALUES(item_desc),
        mechanics = VALUES(mechanics)");

    $count = count($matches[0]);
    for ($i = 0; $i < $count; $i++) {
        $name = trim($matches[1][$i][0]);
        $cost = trim($matches[2][$i][0]);
        $startPos = $matches[0][$i][1] + strlen($matches[0][$i][0]);
        $endPos = ($i < $count - 1) ? $matches[0][$i+1][1] : strlen($toolsBlock);
        
        $body = substr($toolsBlock, $startPos, $endPos - $startPos);
        
        // Skip header titles like Artisan's Tools if accidentally matched
        if ($name === "Artisan's Tools" || $name === "Other Tools") continue;
        
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
                'tool_type' => 'Tool',
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
            ':weight' => ($weight === '—' || empty($weight)) ? '' : $weight,
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
        echo "Inserted/Updated Tool: $name (Ability: $ability)\n";
        
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
                ':weight' => ($v['weight'] === '—' || empty($v['weight'])) ? '' : $v['weight'],
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
            echo "Inserted/Updated Variant Tool: {$v['name']} (Ability: $ability)\n";
        }
    }
}
?>
