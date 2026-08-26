<?php
$pdo = new PDO("mysql:host=localhost;dbname=dnd_project;charset=utf8mb4", "root", "");

$stmt = $pdo->query("SELECT feat_id, feat_desc FROM feats");
$feats = $stmt->fetchAll(PDO::FETCH_ASSOC);

$upd = $pdo->prepare("UPDATE feats SET feat_desc = ? WHERE feat_id = ?");

foreach ($feats as $f) {
    $desc = $f['feat_desc'];
    // Strip trailing ### Headers
    $cleanDesc = preg_replace('/\s*###\s+[^\n]+.*$/s', '', $desc);
    $cleanDesc = trim($cleanDesc);
    if ($cleanDesc !== $desc) {
        $upd->execute([$cleanDesc, $f['feat_id']]);
    }
}

echo "Cleaned descriptions for feats.\n";
?>
