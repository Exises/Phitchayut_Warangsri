<?php
$pdo = new PDO("mysql:host=localhost;dbname=dnd_project;charset=utf8mb4", "root", "");

function formatId($name) {
    $id = strtolower(trim($name));
    $id = preg_replace('/[^a-z0-9\s-]/', '', $id);
    $id = preg_replace('/[\s-]+/', '-', $id);
    return substr($id, 0, 100);
}

$featsFile = file_get_contents('DND/feats.md');

// Match all #### Feat Name positions
preg_match_all('/####\s+([^\n]+)/', $featsFile, $matches, PREG_OFFSET_CAPTURE);

$stmt = $pdo->prepare("INSERT INTO feats 
    (feat_id, feat_name, feat_type, prerequisite, feat_desc, srd_source, is_homebrew)
    VALUES
    (:feat_id, :feat_name, :feat_type, :prerequisite, :feat_desc, 'SRD 2024', 0)
    ON DUPLICATE KEY UPDATE
    feat_name = VALUES(feat_name),
    feat_type = VALUES(feat_type),
    prerequisite = VALUES(prerequisite),
    feat_desc = VALUES(feat_desc)");

$count = count($matches[0]);
$upserted = 0;

for ($i = 0; $i < $count; $i++) {
    $name = trim($matches[1][$i][0]);
    $startPos = $matches[0][$i][1] + strlen($matches[0][$i][0]);
    $endPos = ($i < $count - 1) ? $matches[0][$i+1][1] : strlen($featsFile);
    
    $body = trim(substr($featsFile, $startPos, $endPos - $startPos));
    
    $featType = 'General Feat';
    $prereq = 'None';
    $desc = $body;
    
    // Extract category and prerequisite from first _Line_
    if (preg_match('/^\s*_(.+?)_\s*\n*(.*)/s', $body, $m)) {
        $meta = trim($m[1]);
        $desc = trim($m[2]);
        
        if (preg_match('/^(.*?)(?:\s*\((?:Prerequisite|Prerequisites):\s*(.*?)\))?$/i', $meta, $pm)) {
            $featType = trim($pm[1]);
            if (!empty($pm[2])) {
                $prereq = trim($pm[2]);
            }
        } else {
            $featType = $meta;
        }
    }
    
    if (stripos($featType, 'Feat') === false) {
        $featType .= ' Feat';
    }
    
    $featId = formatId($name);
    
    $stmt->execute([
        ':feat_id' => $featId,
        ':feat_name' => $name,
        ':feat_type' => $featType,
        ':prerequisite' => $prereq,
        ':feat_desc' => $desc
    ]);
    
    echo "Upserted Feat: $name (Type: $featType | Prereq: $prereq)\n";
    $upserted++;
}

echo "Successfully synchronized $upserted feats.\n";
?>
