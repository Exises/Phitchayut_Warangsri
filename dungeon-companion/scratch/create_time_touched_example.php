<?php
$pdo = new PDO("mysql:host=localhost;dbname=dnd_project;charset=utf8mb4", "root", "");

$featId = 'time-touched';
$featName = 'Time-Touched';
$featType = 'Origin Feat';
$prereq = 'None';
$desc = "You gain the following benefits:

_Echoes of Another Era._ You gain proficiency in one Skill or Tool of your choice.

_Minor Rewind._ When you or a creature you can see within 30 feet fails an Ability Check or Saving Throw, you can use your Reaction to roll 1d4 and add it to the result. You can use this feature a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.

_Temporal Mending._ You learn the Mending cantrip.";

$modifiers = [
    [
        'type' => 'proficiency',
        'sub_type' => 'skill',
        'target' => 'history',
        'value' => '1_choice'
    ],
    [
        'type' => 'bonus',
        'sub_type' => 'save',
        'target' => 'd20_check',
        'value' => '1d4 (Uses: PB/Long Rest)'
    ],
    [
        'type' => 'spell',
        'sub_type' => 'grant',
        'target' => 'mending',
        'value' => 'cantrip'
    ]
];

$stmt = $pdo->prepare("INSERT INTO feats 
    (feat_id, feat_name, feat_type, prerequisite, feat_desc, modifiers, srd_source, is_homebrew)
    VALUES
    (:feat_id, :feat_name, :feat_type, :prerequisite, :feat_desc, :modifiers, 'Custom Homebrew', 1)
    ON DUPLICATE KEY UPDATE
    feat_name = VALUES(feat_name),
    feat_type = VALUES(feat_type),
    prerequisite = VALUES(prerequisite),
    feat_desc = VALUES(feat_desc),
    modifiers = VALUES(modifiers)");

$stmt->execute([
    ':feat_id' => $featId,
    ':feat_name' => $featName,
    ':feat_type' => $featType,
    ':prerequisite' => $prereq,
    ':feat_desc' => $desc,
    ':modifiers' => json_encode($modifiers, JSON_UNESCAPED_UNICODE)
]);

echo "Successfully created example Feat: Time-Touched in DB!\n";
?>
