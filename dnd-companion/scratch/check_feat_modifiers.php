<?php
$pdo = new PDO("mysql:host=localhost;dbname=dnd_project;charset=utf8mb4", "root", "");
$stmt = $pdo->query("SELECT feat_id, feat_name, feat_type, modifiers FROM feats");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
