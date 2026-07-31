<?php
$pdo = new PDO("mysql:host=localhost;dbname=dnd_project;charset=utf8mb4", "root", "");
$stmt = $pdo->query("SELECT background_name, ability_scores, skill_proficiencies, tool_proficiencies, equipment FROM backgrounds LIMIT 10");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
