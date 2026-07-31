<?php
$pdo = new PDO("mysql:host=localhost;dbname=dnd_project;charset=utf8mb4", "root", "");

$featModifiers = [
    'alert' => [
        ['type' => 'bonus', 'sub_type' => 'stat', 'target' => 'dexterity', 'value' => 'initiative_pb']
    ],
    'archery' => [
        ['type' => 'bonus', 'sub_type' => 'attack', 'target' => 'weapon', 'value' => '+2']
    ],
    'defense' => [
        ['type' => 'bonus', 'sub_type' => 'ac', 'target' => 'armor', 'value' => '+1']
    ],
    'great-weapon-fighting' => [
        ['type' => 'bonus', 'sub_type' => 'damage', 'target' => 'weapon', 'value' => 'min_3']
    ],
    'two-weapon-fighting' => [
        ['type' => 'bonus', 'sub_type' => 'damage', 'target' => 'weapon', 'value' => 'ability_mod']
    ],
    'grappler' => [
        ['type' => 'bonus', 'sub_type' => 'stat', 'target' => 'strength', 'value' => '1'],
        ['type' => 'advantage', 'sub_type' => 'attack', 'target' => 'weapon', 'value' => 'grappled_target']
    ],
    'magic-initiate' => [
        ['type' => 'spell', 'sub_type' => 'grant', 'target' => 'cantrips_and_level_1', 'value' => '3_spells']
    ],
    'savage-attacker' => [
        ['type' => 'advantage', 'sub_type' => 'attack', 'target' => 'weapon', 'value' => 'reroll_damage']
    ],
    'skilled' => [
        ['type' => 'proficiency', 'sub_type' => 'skill', 'target' => 'perception', 'value' => '3_choices']
    ],
    'boon-of-combat-prowess' => [
        ['type' => 'bonus', 'sub_type' => 'stat', 'target' => 'strength', 'value' => '1'],
        ['type' => 'bonus', 'sub_type' => 'attack', 'target' => 'weapon', 'value' => 'turn_miss_to_hit']
    ],
    'boon-of-dimensional-travel' => [
        ['type' => 'bonus', 'sub_type' => 'stat', 'target' => 'dexterity', 'value' => '1']
    ],
    'boon-of-fate' => [
        ['type' => 'bonus', 'sub_type' => 'stat', 'target' => 'wisdom', 'value' => '1']
    ],
    'boon-of-irresistible-offense' => [
        ['type' => 'bonus', 'sub_type' => 'stat', 'target' => 'strength', 'value' => '1']
    ],
    'boon-of-spell-recall' => [
        ['type' => 'bonus', 'sub_type' => 'stat', 'target' => 'intelligence', 'value' => '1']
    ],
    'boon-of-the-night-spirit' => [
        ['type' => 'bonus', 'sub_type' => 'stat', 'target' => 'dexterity', 'value' => '1'],
        ['type' => 'resistance', 'sub_type' => 'damage', 'target' => 'bludgeoning', 'value' => 'in_shadows']
    ],
    'boon-of-truesight' => [
        ['type' => 'bonus', 'sub_type' => 'stat', 'target' => 'wisdom', 'value' => '1'],
        ['type' => 'sense', 'sub_type' => 'vision', 'target' => 'truesight', 'value' => '60']
    ]
];

$stmt = $pdo->prepare("UPDATE feats SET modifiers = ? WHERE feat_id = ?");

$updated = 0;
foreach ($featModifiers as $featId => $mods) {
    $stmt->execute([json_encode($mods, JSON_UNESCAPED_UNICODE), $featId]);
    $updated++;
}

echo "Successfully updated mechanics modifiers for $updated feats.\n";
?>
