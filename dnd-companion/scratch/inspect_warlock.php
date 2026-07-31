<?php
$pdo = new PDO('mysql:host=localhost;dbname=dnd_project;charset=utf8mb4', 'root', '');
$stmt = $pdo->query('SELECT features FROM classes WHERE class_id="warlock"');
$row = $stmt->fetch();
$features = json_decode($row[0], true);
foreach ($features as $f) {
    echo "[Lv." . ($f['level'] ?? '?') . "] " . ($f['name'] ?? '?') . "\n";
}
