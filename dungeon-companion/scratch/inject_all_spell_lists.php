<?php
$pdo = new PDO("mysql:host=localhost;dbname=dnd_project;charset=utf8mb4", "root", "");

$mdPath = __DIR__ . '/../DND/classes.md';
$md = file_get_contents($mdPath);

$classes = ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard'];

foreach ($classes as $className) {
    $classId = strtolower($className);
    $header = "### " . $className . " Spell List";
    
    $start = strpos($md, $header);
    if ($start === false) {
        echo "[$className] Header not found in classes.md\n";
        continue;
    }
    
    // Stop at next H3 (subclass) or H2 (next class)
    $endH3 = strpos($md, "\n### ", $start + 20);
    $endH2 = strpos($md, "\n## ", $start + 20);
    
    if ($endH3 !== false && $endH2 !== false) {
        $end = min($endH3, $endH2);
    } elseif ($endH3 !== false) {
        $end = $endH3;
    } else {
        $end = $endH2;
    }
    
    $chunk = ($end === false) ? substr($md, $start) : substr($md, $start, $end - $start);
    $chunk = trim($chunk);
    
    // Replace markdown italics _C_, _R_, _M_ or HTML <em>C</em> with bold <strong>C</strong> (ไม่เอาตัวเอียง)
    $chunk = preg_replace('/_([CRM])_|<em>([CRM])<\/em>/i', '<strong>$1</strong>', $chunk);
    
    // Format into HTML blocks
    $blocks = preg_split('/\n{2,}/', $chunk);
    $htmlBlocks = [];
    foreach ($blocks as $b) {
        $b = trim($b);
        if (empty($b)) continue;
        if (strpos($b, '<table') !== false) {
            $htmlBlocks[] = $b;
        } else {
            $htmlBlocks[] = "<p style='margin-bottom: 15px; line-height: 1.6;'>" . $b . "</p>";
        }
    }
    $appendixHtml = implode("", $htmlBlocks);
    
    // Fetch DB record
    $stmt = $pdo->prepare("SELECT * FROM classes WHERE class_id = ?");
    $stmt->execute([$classId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        echo "[$className] DB record not found\n";
        continue;
    }
    
    $features = json_decode($row['features'], true);
    if (!$features) {
        echo "[$className] Invalid features JSON in DB\n";
        continue;
    }
    
    $lv20Index = -1;
    foreach ($features as $idx => $f) {
        if (isset($f['level']) && (int)$f['level'] === 20) {
            $lv20Index = $idx;
            break;
        }
    }
    if ($lv20Index === -1) {
        $lv20Index = count($features) - 1;
    }
    
    $currentDesc = $features[$lv20Index]['description'] ?? '';
    
    // Remove existing Spell List if present
    $pos = stripos($currentDesc, '### ' . $className . ' Spell List');
    if ($pos !== false) {
        $currentDesc = trim(substr($currentDesc, 0, $pos));
    } else {
        $posGen = stripos($currentDesc, '### ');
        if ($posGen !== false && stripos(substr($currentDesc, $posGen), 'Spell List') !== false) {
            $currentDesc = trim(substr($currentDesc, 0, $posGen));
        }
    }
    
    $features[$lv20Index]['description'] = $currentDesc . "\n" . $appendixHtml;
    
    $newJson = json_encode($features, JSON_UNESCAPED_UNICODE);
    
    $update = $pdo->prepare("UPDATE classes SET features = ? WHERE class_id = ?");
    $update->execute([$newJson, $classId]);
    
    echo "[$className] Successfully updated DB without italics!\n";
}
