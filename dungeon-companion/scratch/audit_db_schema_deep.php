<?php
$pdo = new PDO("mysql:host=localhost;dbname=dnd_project;charset=utf8mb4", "root", "");

$tables = ['items', 'feats', 'classes', 'subclasses', 'species', 'lineages', 'backgrounds', 'spells', 'characters'];

$schemaReport = [];

foreach ($tables as $t) {
    $stmt = $pdo->query("DESCRIBE `$t`");
    $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $schemaReport[$t] = $cols;
}

echo json_encode($schemaReport, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
