<?php
$pdo = new PDO("mysql:host=localhost;dbname=dnd_project;charset=utf8mb4", "root", "");

$stmt = $pdo->query("SELECT * FROM backgrounds");
$backgrounds = $stmt->fetchAll(PDO::FETCH_ASSOC);

$updated = 0;

foreach ($backgrounds as $bg) {
    $id = $bg['background_id'];
    $needUpdate = false;
    
    // Ability Scores
    $ab = $bg['ability_scores'];
    if (empty($ab)) {
        $abObj = [
            'logic' => ['allowed_attributes' => ['Strength', 'Dexterity', 'Constitution'], 'modes' => ['plus_two_one', 'three_plus_one']],
            'display' => 'Strength, Dexterity, Constitution'
        ];
        $ab = json_encode($abObj, JSON_UNESCAPED_UNICODE);
        $needUpdate = true;
    }
    
    // Skill Proficiencies
    $skills = $bg['skill_proficiencies'];
    if ($skills) {
        $parsed = json_decode($skills, true);
        if (is_array($parsed) && !isset($parsed['display'])) {
            $skObj = [
                'logic' => ['granted' => $parsed],
                'display' => implode(' and ', $parsed)
            ];
            $skills = json_encode($skObj, JSON_UNESCAPED_UNICODE);
            $needUpdate = true;
        }
    }
    
    // Tool Proficiencies
    $tools = $bg['tool_proficiencies'];
    if ($tools) {
        $parsed = json_decode($tools, true);
        if (is_array($parsed) && !isset($parsed['display'])) {
            $toolObj = [
                'logic' => ['granted' => $parsed],
                'display' => implode(', ', $parsed)
            ];
            $tools = json_encode($toolObj, JSON_UNESCAPED_UNICODE);
            $needUpdate = true;
        }
    }
    
    // Equipment
    $eq = $bg['equipment'];
    if ($eq) {
        $parsed = json_decode($eq, true);
        if (is_array($parsed) && !isset($parsed['display'])) {
            $items = array_map(function($i) { return is_array($i) ? ($i['item_name'] ?? '') : $i; }, $parsed);
            $items = array_filter($items);
            $eqObj = [
                'logic' => ['gold' => 50, 'items' => array_values($items)],
                'display' => implode(', ', $items) . (count($items) ? ', and 50 GP' : '50 GP')
            ];
            $eq = json_encode($eqObj, JSON_UNESCAPED_UNICODE);
            $needUpdate = true;
        }
    }
    
    if ($needUpdate) {
        $upd = $pdo->prepare("UPDATE backgrounds SET ability_scores = ?, skill_proficiencies = ?, tool_proficiencies = ?, equipment = ? WHERE background_id = ?");
        $upd->execute([$ab, $skills, $tools, $eq, $id]);
        $updated++;
    }
}

echo "Successfully cleaned and formatted $updated background rows in database.\n";
?>
