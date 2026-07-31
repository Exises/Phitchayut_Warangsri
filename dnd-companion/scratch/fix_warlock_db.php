<?php
$pdo = new PDO('mysql:host=localhost;dbname=dnd_project;charset=utf8mb4', 'root', '');

// 1. Delete duplicate subclass 'the-fiend'
$pdo->exec("DELETE FROM subclasses WHERE subclass_id = 'the-fiend'");
echo "Deleted duplicate subclass 'the-fiend'\n";

// 2. Read classes.md for Warlock
$mdPath = __DIR__ . '/../DND/classes.md';
$md = file_get_contents($mdPath);

$invHeader = "### Eldritch Invocation Options";
$spellHeader = "### Warlock Spell List";

$invStart = strpos($md, $invHeader);
$spellStart = strpos($md, $spellHeader);
$wizStart = strpos($md, "\n## Wizard");

if ($invStart === false || $spellStart === false) {
    die("Headers not found in classes.md\n");
}

$invChunk = substr($md, $invStart, $spellStart - $invStart);
$spellChunk = ($wizStart !== false) ? substr($md, $spellStart, $wizStart - $spellStart) : substr($md, $spellStart);

// Helper to format markdown chunks to HTML
function formatMdToHtml($chunk) {
    $chunk = trim($chunk);
    $chunk = preg_replace('/_([CRM])_|<em>([CRM])<\/em>/i', '<strong>$1</strong>', $chunk);
    $blocks = preg_split('/\n{2,}/', $chunk);
    $htmlBlocks = [];
    foreach ($blocks as $b) {
        $b = trim($b);
        if (empty($b)) continue;
        if (strpos($b, '<table') !== false) {
            $htmlBlocks[] = $b;
        } elseif (strpos($b, '#### ') === 0) {
            $htmlBlocks[] = $b; // keep H4 for react parser
        } elseif (strpos($b, '### ') === 0) {
            $htmlBlocks[] = $b; // keep H3 header
        } else {
            $htmlBlocks[] = "<p style='margin-bottom: 15px; line-height: 1.6;'>" . $b . "</p>";
        }
    }
    return implode("\n\n", $htmlBlocks);
}

$appendixHtml = formatMdToHtml($invChunk) . "\n\n" . formatMdToHtml($spellChunk);

// 3. Update Warlock class features in DB
$stmt = $pdo->prepare("SELECT * FROM classes WHERE class_id = 'warlock'");
$stmt->execute();
$row = $stmt->fetch(PDO::FETCH_ASSOC);

$features = json_decode($row['features'], true);

// Clean existing appendix from lv20
foreach ($features as $idx => $f) {
    if ((int)$f['level'] === 20) {
        $desc = $f['description'] ?? '';
        $pos = stripos($desc, '### Eldritch Invocation');
        if ($pos !== false) $desc = trim(substr($desc, 0, $pos));
        $pos2 = stripos($desc, '### Warlock Spell');
        if ($pos2 !== false) $desc = trim(substr($desc, 0, $pos2));
        $features[$idx]['description'] = $desc . "\n\n" . $appendixHtml;
        break;
    }
}

// Add Eldritch Invocations at levels 2, 5, 7, 9, 12, 15, 18 if missing
$levelsToAdd = [2, 5, 7, 9, 12, 15, 18];
$existingInvLevels = [];
foreach ($features as $f) {
    if (stripos($f['name'], 'Eldritch Invocations') !== false) {
        $existingInvLevels[] = (int)$f['level'];
    }
}

foreach ($levelsToAdd as $lvl) {
    if (!in_array($lvl, $existingInvLevels)) {
        $features[] = [
            'level' => $lvl,
            'name' => 'Eldritch Invocations',
            'description' => '<p>When you gain certain Warlock levels, you gain more invocations of your choice, as shown in the Invocations column of the Warlock Features table.</p>',
            'mechanics' => null
        ];
    }
}

// Sort features by level then name
usort($features, function($a, $b) {
    if ($a['level'] == $b['level']) {
        return strcmp($a['name'], $b['name']);
    }
    return $a['level'] - $b['level'];
});

$newJson = json_encode($features, JSON_UNESCAPED_UNICODE);
$update = $pdo->prepare("UPDATE classes SET features = ? WHERE class_id = 'warlock'");
$update->execute([$newJson]);

echo "Successfully updated Warlock features and appendix in DB!\n";
