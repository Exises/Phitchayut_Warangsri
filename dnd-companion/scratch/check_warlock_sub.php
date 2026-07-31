<?php
$pdo = new PDO('mysql:host=localhost;dbname=dnd_project;charset=utf8mb4', 'root', '');
$stmt = $pdo->query('SELECT * FROM subclasses WHERE class_id="warlock"');
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
print_r($rows);
