<?php
$pdo = new PDO("mysql:host=localhost;dbname=dnd_project;charset=utf8mb4", "root", "");

function formatId($name) {
    $id = strtolower(trim($name));
    $id = preg_replace('/[^a-z0-9\s-]/', '', $id);
    $id = preg_replace('/[\s-]+/', '-', $id);
    return substr($id, 0, 100);
}

$featsFile = file_get_contents('DND/feats.md');

// Match sections by ### Category
preg_match_all('/###\s+([^\n]+)\s*\n+(.*?)(?=\n###|\Z)/s', $featsFile, $catMatches);

$stmt = $pdo->prepare("INSERT INTO feats 
    (feat_id, feat_name, feat_type, prerequisite, feat_desc, srd_source, is_homebrew)
    VALUES
    (:feat_id, :feat_name, :feat_type, :prerequisite, :feat_desc, 'SRD 2024', 0)
    ON DUPLICATE KEY UPDATE
    feat_name = VALUES(feat_name),
    feat_type = VALUES(feat_type),
    prerequisite = VALUES(prerequisite),
    feat_desc = VALUES(feat_desc)");

$count = 0;

for ($i = 0; $i < count($catMatches[0]); $i++) {
    $catName = trim($catMatches[1][$i]); // e.g. Origin Feats, General Feats
    if ($catName === "Parts of a Feat" || $catName === "Feat Descriptions") continue;
    
    $catBody = trim($catMatches[2][$i]);
    
    // Match each feat under #### Feat Name
    preg_match_all('/####\s+([^\n]+)\n+_(.+?)_\n+(.*?)(?=\n####|\Z)/s', $catBody, $featMatches);
    
    for ($j = 0; $j < count($featMatches[0]); $j++) {
        $name = trim($featMatches[1][$j]);
        $meta = trim($featMatches[2][$j]); // e.g. Origin Feat, or General Feat (Prerequisite: Level 4+)
        $desc = trim($featMatches[3][$j]);
        
        $featType = '';
        $prereq = 'None';
        
        if (preg_match('/^(.*?)(?:\s*\((?:Prerequisite|Prerequisites):\s*(.*?)\))?$/i', $meta, $pm)) {
            $featType = trim($pm[1]);
            if (!empty($pm[2])) {
                $prereq = trim($pm[2]);
            }
        } else {
            $featType = $meta;
        }
        
        // Ensure featType ends with Feat or is standard
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
        
        echo "Upserted Feat: $name (Type: $featType, Prereq: $prereq)\n";
        $count++;
    }
}

echo "Total Feats Processed: $count\n";
?>
