const pool = require('../db');

const speciesUpdates = {
    "dragonborn": [
        {
            "name": "Draconic Ancestry",
            "logic": {
                "type": "choice",
                "options": ["Black", "Blue", "Brass", "Bronze", "Copper", "Gold", "Green", "Red", "Silver", "White"]
            },
            "display": "Your lineage stems from a dragon progenitor. Choose the kind of dragon from the Draconic Ancestors table. Your choice affects your Breath Weapon and Damage Resistance traits as well as your appearance.",
            "modifiers": [],
            "desc": "Your lineage stems from a dragon progenitor. Choose the kind of dragon from the Draconic Ancestors table. Your choice affects your Breath Weapon and Damage Resistance traits as well as your appearance."
        },
        {
            "name": "Breath Weapon",
            "logic": {
                "type": "action",
                "usage": "proficiency_bonus",
                "recovery": "long_rest"
            },
            "display": "When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of magical energy in either a 15-foot Cone or a 30-foot Line that is 5 feet wide (choose the shape each time). Each creature in that area must make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency Bonus). On a failed save, a creature takes 1d10 damage of the type determined by your Draconic Ancestry trait. On a successful save, a creature takes half as much damage. This damage increases by 1d10 when you reach character levels 5 (2d10), 11 (3d10), and 17 (4d10). You can use this Breath Weapon a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.",
            "modifiers": [],
            "desc": "When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of magical energy in either a 15-foot Cone or a 30-foot Line that is 5 feet wide (choose the shape each time). Each creature in that area must make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency Bonus). On a failed save, a creature takes 1d10 damage of the type determined by your Draconic Ancestry trait. On a successful save, a creature takes half as much damage. This damage increases by 1d10 when you reach character levels 5 (2d10), 11 (3d10), and 17 (4d10). You can use this Breath Weapon a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest."
        },
        {
            "name": "Damage Resistance",
            "logic": {
                "type": "resistance",
                "source": "ancestry"
            },
            "display": "You have Resistance to the damage type determined by your Draconic Ancestry trait.",
            "modifiers": [
                {
                    "type": "resistance",
                    "sub_type": "damage",
                    "target": "element",
                    "value": ""
                }
            ],
            "desc": "You have Resistance to the damage type determined by your Draconic Ancestry trait."
        },
        {
            "name": "Darkvision",
            "logic": {
                "type": "sense",
                "sense_type": "Darkvision",
                "range": 60
            },
            "display": "You have Darkvision with a range of 60 feet.",
            "modifiers": [
                {
                    "type": "sense",
                    "sub_type": "vision",
                    "target": "darkvision",
                    "value": "60"
                }
            ],
            "desc": "You have Darkvision with a range of 60 feet."
        },
        {
            "name": "Draconic Flight",
            "logic": {
                "type": "bonus_action",
                "usage": 1,
                "recovery": "long_rest",
                "unlock_level": 5
            },
            "display": "When you reach character level 5, you can channel draconic magic to give yourself temporary flight. As a Bonus Action, you sprout spectral wings on your back that last for 10 minutes or until you retract the wings (no action required) or have the Incapacitated condition. During that time, you have a Fly Speed equal to your Speed. Your wings appear to be made of the same energy as your Breath Weapon. Once you use this trait, you can't use it again until you finish a Long Rest.",
            "modifiers": [],
            "desc": "When you reach character level 5, you can channel draconic magic to give yourself temporary flight. As a Bonus Action, you sprout spectral wings on your back that last for 10 minutes or until you retract the wings (no action required) or have the Incapacitated condition. During that time, you have a Fly Speed equal to your Speed. Your wings appear to be made of the same energy as your Breath Weapon. Once you use this trait, you can't use it again until you finish a Long Rest."
        }
    ],
    "dwarf": [
        {
            "name": "Darkvision",
            "logic": {
                "type": "sense",
                "sense_type": "Darkvision",
                "range": 120
            },
            "display": "You have Darkvision with a range of 120 feet.",
            "modifiers": [
                {
                    "type": "sense",
                    "sub_type": "vision",
                    "target": "darkvision",
                    "value": "120"
                }
            ],
            "desc": "You have Darkvision with a range of 120 feet."
        },
        {
            "name": "Dwarven Resilience",
            "logic": {
                "type": "resistance_and_advantage",
                "damage_type": "Poison",
                "condition": "Poisoned"
            },
            "display": "You have Resistance to Poison damage. You also have Advantage on saving throws you make to avoid or end the Poisoned condition.",
            "modifiers": [
                {
                    "type": "resistance",
                    "sub_type": "damage",
                    "target": "element",
                    "value": ""
                },
                {
                    "type": "advantage",
                    "sub_type": "save",
                    "target": "poisoned",
                    "value": ""
                }
            ],
            "desc": "You have Resistance to Poison damage. You also have Advantage on saving throws you make to avoid or end the Poisoned condition."
        },
        {
            "name": "Dwarven Toughness",
            "logic": {
                "type": "hp_increase",
                "amount": 1,
                "per_level": true
            },
            "display": "Your Hit Point maximum increases by 1, and it increases by 1 again whenever you gain a level.",
            "modifiers": [
                {
                    "type": "bonus",
                    "sub_type": "hp",
                    "target": "hp",
                    "value": "1"
                }
            ],
            "desc": "Your Hit Point maximum increases by 1, and it increases by 1 again whenever you gain a level."
        },
        {
            "name": "Stonecunning",
            "logic": {
                "type": "bonus_action",
                "usage": "proficiency_bonus",
                "recovery": "long_rest"
            },
            "display": "As a Bonus Action, you gain Tremorsense with a range of 60 feet for 10 minutes. You must be on a stone surface or touching a stone surface to use this Tremorsense. The stone can be natural or worked. You can use this Bonus Action a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.",
            "modifiers": [],
            "desc": "As a Bonus Action, you gain Tremorsense with a range of 60 feet for 10 minutes. You must be on a stone surface or touching a stone surface to use this Tremorsense. The stone can be natural or worked. You can use this Bonus Action a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest."
        }
    ],
    "elf": [
        {
            "name": "Darkvision",
            "logic": {
                "type": "sense",
                "sense_type": "Darkvision",
                "range": 60
            },
            "display": "You have Darkvision with a range of 60 feet.",
            "modifiers": [
                {
                    "type": "sense",
                    "sub_type": "vision",
                    "target": "darkvision",
                    "value": "60"
                }
            ],
            "desc": "You have Darkvision with a range of 60 feet."
        },
        {
            "name": "Elven Lineage",
            "logic": {
                "type": "spellcasting",
                "source": "lineage"
            },
            "display": "You are part of a lineage that grants you supernatural abilities. Choose a lineage from the Elven Lineages table. You gain the level 1 benefit of that lineage. When you reach character levels 3 and 5, you learn a higher-level spell. Intelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait.",
            "modifiers": [],
            "desc": "You are part of a lineage that grants you supernatural abilities. Choose a lineage from the Elven Lineages table. You gain the level 1 benefit of that lineage. When you reach character levels 3 and 5, you learn a higher-level spell. Intelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait."
        },
        {
            "name": "Fey Ancestry",
            "logic": {
                "type": "advantage_saving_throw",
                "condition": "Charmed"
            },
            "display": "You have Advantage on saving throws you make to avoid or end the Charmed condition.",
            "modifiers": [
                {
                    "type": "advantage",
                    "sub_type": "save",
                    "target": "charmed",
                    "value": ""
                }
            ],
            "desc": "You have Advantage on saving throws you make to avoid or end the Charmed condition."
        },
        {
            "name": "Keen Senses",
            "logic": {
                "type": "proficiency",
                "choices": {
                    "amount": 1,
                    "options": ["Insight", "Perception", "Survival"]
                }
            },
            "display": "You have proficiency in the Insight, Perception, or Survival skill.",
            "modifiers": [
                {
                    "type": "proficiency",
                    "sub_type": "skill",
                    "target": "choice",
                    "value": "1"
                }
            ],
            "desc": "You have proficiency in the Insight, Perception, or Survival skill."
        },
        {
            "name": "Trance",
            "logic": {
                "type": "immunity",
                "condition": "Magical Sleep",
                "rest_modification": "4 hours"
            },
            "display": "You don't need to sleep, and magic can't put you to sleep. You can finish a Long Rest in 4 hours if you spend those hours in a trancelike meditation, during which you retain consciousness.",
            "modifiers": [
                {
                    "type": "immunity",
                    "sub_type": "condition",
                    "target": "unconscious",
                    "value": ""
                }
            ],
            "desc": "You don't need to sleep, and magic can't put you to sleep. You can finish a Long Rest in 4 hours if you spend those hours in a trancelike meditation, during which you retain consciousness."
        }
    ],
    "gnome": [
        {
            "name": "Darkvision",
            "logic": {
                "type": "sense",
                "sense_type": "Darkvision",
                "range": 60
            },
            "display": "You have Darkvision with a range of 60 feet.",
            "modifiers": [
                {
                    "type": "sense",
                    "sub_type": "vision",
                    "target": "darkvision",
                    "value": "60"
                }
            ],
            "desc": "You have Darkvision with a range of 60 feet."
        },
        {
            "name": "Gnomish Cunning",
            "logic": {
                "type": "advantage_saving_throw",
                "abilities": ["Intelligence", "Wisdom", "Charisma"]
            },
            "display": "You have Advantage on Intelligence, Wisdom, and Charisma saving throws.",
            "modifiers": [],
            "desc": "You have Advantage on Intelligence, Wisdom, and Charisma saving throws."
        },
        {
            "name": "Gnomish Lineage",
            "logic": {
                "type": "spellcasting",
                "source": "lineage"
            },
            "display": "You are part of a lineage that grants you supernatural abilities. Intelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait.",
            "modifiers": [],
            "desc": "You are part of a lineage that grants you supernatural abilities. Intelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait."
        }
    ],
    "goliath": [
        {
            "name": "Giant Ancestry",
            "logic": {
                "type": "choice",
                "source": "lineage"
            },
            "display": "You are descended from Giants. Choose one of the following benefits—a supernatural boon from your ancestry; you can use the chosen benefit a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.",
            "modifiers": [],
            "desc": "You are descended from Giants. Choose one of the following benefits—a supernatural boon from your ancestry; you can use the chosen benefit a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest."
        },
        {
            "name": "Large Form",
            "logic": {
                "type": "bonus_action",
                "usage": 1,
                "recovery": "long_rest",
                "unlock_level": 5
            },
            "display": "Starting at character level 5, you can change your size to Large as a Bonus Action if you're in a big enough space. This transformation lasts for 10 minutes or until you end it (no action required). For that duration, you have Advantage on Strength checks, and your Speed increases by 10 feet. Once you use this trait, you can't use it again until you finish a Long Rest.",
            "modifiers": [],
            "desc": "Starting at character level 5, you can change your size to Large as a Bonus Action if you're in a big enough space. This transformation lasts for 10 minutes or until you end it (no action required). For that duration, you have Advantage on Strength checks, and your Speed increases by 10 feet. Once you use this trait, you can't use it again until you finish a Long Rest."
        },
        {
            "name": "Powerful Build",
            "logic": {
                "type": "passive",
                "advantage": "grapple_escape",
                "carrying_capacity_multiplier": 2
            },
            "display": "You have Advantage on any ability check you make to end the Grappled condition. You also count as one size larger when determining your carrying capacity.",
            "modifiers": [
                {
                    "type": "advantage",
                    "sub_type": "check",
                    "target": "grappled",
                    "value": ""
                }
            ],
            "desc": "You have Advantage on any ability check you make to end the Grappled condition. You also count as one size larger when determining your carrying capacity."
        }
    ],
    "halfling": [
        {
            "name": "Brave",
            "logic": {
                "type": "advantage_saving_throw",
                "condition": "Frightened"
            },
            "display": "You have Advantage on saving throws you make to avoid or end the Frightened condition.",
            "modifiers": [
                {
                    "type": "advantage",
                    "sub_type": "save",
                    "target": "frightened",
                    "value": ""
                }
            ],
            "desc": "You have Advantage on saving throws you make to avoid or end the Frightened condition."
        },
        {
            "name": "Halfling Nimbleness",
            "logic": {
                "type": "movement",
                "pass_through_size": "larger"
            },
            "display": "You can move through the space of any creature that is a size larger than you, but you can't stop in the same space.",
            "modifiers": [],
            "desc": "You can move through the space of any creature that is a size larger than you, but you can't stop in the same space."
        },
        {
            "name": "Luck",
            "logic": {
                "type": "reroll",
                "trigger": "roll_1"
            },
            "display": "When you roll a 1 on the d20 of a D20 Test, you can reroll the die, and you must use the new roll.",
            "modifiers": [],
            "desc": "When you roll a 1 on the d20 of a D20 Test, you can reroll the die, and you must use the new roll."
        },
        {
            "name": "Naturally Stealthy",
            "logic": {
                "type": "stealth",
                "obscured_by_size": "larger"
            },
            "display": "You can take the Hide action even when you are obscured only by a creature that is at least one size larger than you.",
            "modifiers": [],
            "desc": "You can take the Hide action even when you are obscured only by a creature that is at least one size larger than you."
        }
    ],
    "human": [
        {
            "name": "Resourceful",
            "logic": {
                "type": "passive"
            },
            "display": "You gain Heroic Inspiration whenever you finish a Long Rest.",
            "modifiers": [],
            "desc": "You gain Heroic Inspiration whenever you finish a Long Rest."
        },
        {
            "name": "Skillful",
            "logic": {
                "type": "proficiency",
                "options": ["Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception", "History", "Insight", "Intimidation", "Investigation", "Medicine", "Nature", "Perception", "Performance", "Persuasion", "Religion", "Sleight of Hand", "Stealth", "Survival"]
            },
            "display": "You gain proficiency in one skill of your choice.",
            "modifiers": [
                {
                    "type": "proficiency",
                    "sub_type": "skill",
                    "target": "choice",
                    "value": "1"
                }
            ],
            "desc": "You gain proficiency in one skill of your choice."
        },
        {
            "name": "Versatile",
            "logic": {
                "type": "choice",
                "options": ["Alert", "Crafter", "Healer", "Lucky", "Magic Initiate", "Musician", "Savage Attacker", "Tavern Brawler", "Tough"]
            },
            "display": "You gain an Origin feat of your choice.",
            "modifiers": [
                {
                    "type": "proficiency",
                    "sub_type": "feat",
                    "target": "origin_feat",
                    "value": "1"
                }
            ],
            "desc": "You gain an Origin feat of your choice."
        }
    ],
    "orc": [
        {
            "name": "Adrenaline Rush",
            "logic": {
                "type": "bonus_action",
                "usage": "proficiency_bonus",
                "recovery": "short_or_long_rest"
            },
            "display": "You can take the Dash action as a Bonus Action. When you do so, you gain a number of Temporary Hit Points equal to your Proficiency Bonus. You can use this trait a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Short or Long Rest.",
            "modifiers": [],
            "desc": "You can take the Dash action as a Bonus Action. When you do so, you gain a number of Temporary Hit Points equal to your Proficiency Bonus. You can use this trait a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Short or Long Rest."
        },
        {
            "name": "Darkvision",
            "logic": {
                "type": "sense",
                "sense_type": "Darkvision",
                "range": 120
            },
            "display": "You have Darkvision with a range of 120 feet.",
            "modifiers": [
                {
                    "type": "sense",
                    "sub_type": "vision",
                    "target": "darkvision",
                    "value": "120"
                }
            ],
            "desc": "You have Darkvision with a range of 120 feet."
        },
        {
            "name": "Relentless Endurance",
            "logic": {
                "type": "reaction",
                "usage": 1,
                "recovery": "long_rest"
            },
            "display": "When you are reduced to 0 Hit Points but not killed outright, you can drop to 1 Hit Point instead. Once you use this trait, you can't do so again until you finish a Long Rest.",
            "modifiers": [],
            "desc": "When you are reduced to 0 Hit Points but not killed outright, you can drop to 1 Hit Point instead. Once you use this trait, you can't do so again until you finish a Long Rest."
        }
    ],
    "tiefling": [
        {
            "name": "Darkvision",
            "logic": {
                "type": "sense",
                "sense_type": "Darkvision",
                "range": 60
            },
            "display": "You have Darkvision with a range of 60 feet.",
            "modifiers": [
                {
                    "type": "sense",
                    "sub_type": "vision",
                    "target": "darkvision",
                    "value": "60"
                }
            ],
            "desc": "You have Darkvision with a range of 60 feet."
        },
        {
            "name": "Fiendish Legacy",
            "logic": {
                "type": "spellcasting",
                "source": "lineage"
            },
            "display": "You are the recipient of a legacy that grants you supernatural abilities. Choose a legacy from the Fiendish Legacies table. You gain the level 1 benefit of the chosen legacy. When you reach character levels 3 and 5, you learn a higher-level spell. Intelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait.",
            "modifiers": [],
            "desc": "You are the recipient of a legacy that grants you supernatural abilities. Choose a legacy from the Fiendish Legacies table. You gain the level 1 benefit of the chosen legacy. When you reach character levels 3 and 5, you learn a higher-level spell. Intelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait."
        },
        {
            "name": "Otherworldly Presence",
            "logic": {
                "type": "spellcasting",
                "spell": "Thaumaturgy"
            },
            "display": "You know the Thaumaturgy cantrip. When you cast it with this trait, the spell uses the same spellcasting ability you use for your Fiendish Legacy trait.",
            "modifiers": [],
            "desc": "You know the Thaumaturgy cantrip. When you cast it with this trait, the spell uses the same spellcasting ability you use for your Fiendish Legacy trait."
        }
    ]
};

const lineageDescUpdates = {
    "dragonborn-black": "Your breath weapon deals Acid damage in a 5 by 30 ft. line (Dexterity save), and you have Resistance to Acid damage.",
    "dragonborn-blue": "Your breath weapon deals Lightning damage in a 5 by 30 ft. line (Dexterity save), and you have Resistance to Lightning damage.",
    "dragonborn-brass": "Your breath weapon deals Fire damage in a 5 by 30 ft. line (Dexterity save), and you have Resistance to Fire damage.",
    "dragonborn-bronze": "Your breath weapon deals Lightning damage in a 5 by 30 ft. line (Dexterity save), and you have Resistance to Lightning damage.",
    "dragonborn-copper": "Your breath weapon deals Acid damage in a 5 by 30 ft. line (Dexterity save), and you have Resistance to Acid damage.",
    "dragonborn-gold": "Your breath weapon deals Fire damage in a 15 ft. cone (Dexterity save), and you have Resistance to Fire damage.",
    "dragonborn-green": "Your breath weapon deals Poison damage in a 15 ft. cone (Constitution save), and you have Resistance to Poison damage.",
    "dragonborn-red": "Your breath weapon deals Fire damage in a 15 ft. cone (Dexterity save), and you have Resistance to Fire damage.",
    "dragonborn-silver": "Your breath weapon deals Cold damage in a 15 ft. cone (Constitution save), and you have Resistance to Cold damage.",
    "dragonborn-white": "Your breath weapon deals Cold damage in a 15 ft. cone (Constitution save), and you have Resistance to Cold damage.",
    
    "goliath-cloud": "Cloud's Jaunt: As a Bonus Action, you magically teleport up to 30 feet to an unoccupied space you can see.",
    "goliath-fire": "Fire's Burn: When you hit a target with an attack roll and deal damage to it, you can also deal 1d10 Fire damage to that target.",
    "goliath-frost": "Frost's Chill: When you hit a target with an attack roll and deal damage to it, you can also deal 1d6 Cold damage to that target and reduce its Speed by 10 feet until the start of your next turn.",
    "goliath-hill": "Hill's Tumble: When you hit a Large or smaller creature with an attack roll and deal damage to it, you can give that target the Prone condition.",
    "goliath-stone": "Stone's Endurance: When you take damage, you can take a Reaction to roll 1d12. Add your Constitution modifier to the number rolled and reduce the damage by that total.",
    "goliath-storm": "Storm's Thunder: When you take damage from a creature within 60 feet of you, you can take a Reaction to deal 1d8 Thunder damage to that creature.",

    "gnome-forest": "You know the Minor Illusion cantrip. You also always have the Speak with Animals spell prepared. You can cast it without a spell slot a number of times equal to your Proficiency Bonus per Long Rest.",
    "gnome-rock": "You know the Mending and Prestidigitation cantrips. You can spend 10 minutes casting Prestidigitation to create a Tiny clockwork device (AC 5, 1 HP).",

    "tiefling-abyssal": "You have Resistance to Poison damage. You also know the Poison Spray cantrip.",
    "tiefling-chthonic": "You have Resistance to Necrotic damage. You also know the Chill Touch cantrip.",
    "tiefling-infernal": "You have Resistance to Fire damage. You also know the Fire Bolt cantrip."
};

const highElfSpells = [
    {
        "level": 1,
        "spell_id": "prestidigitation",
        "is_choice": 0,
        "choice_list": null,
        "choice_level": null,
        "ability": "Intelligence, Wisdom, or Charisma"
    },
    {
        "level": 3,
        "spell_id": "detect-magic",
        "is_choice": 0,
        "choice_list": null,
        "choice_level": null,
        "ability": "Intelligence, Wisdom, or Charisma"
    },
    {
        "level": 5,
        "spell_id": "misty-step",
        "is_choice": 0,
        "choice_list": null,
        "choice_level": null,
        "ability": "Intelligence, Wisdom, or Charisma"
    }
];

async function updateDatabase() {
    try {
        console.log("Starting species traits update...");
        for (const [speciesId, traits] of Object.entries(speciesUpdates)) {
            await pool.query('UPDATE species SET traits = ? WHERE species_id = ?', [JSON.stringify(traits), speciesId]);
            console.log(`Updated traits for ${speciesId}`);
        }

        console.log("\nStarting lineage desc update...");
        for (const [lineageId, desc] of Object.entries(lineageDescUpdates)) {
            await pool.query('UPDATE lineages SET lineage_desc = ? WHERE lineage_id = ?', [desc, lineageId]);
            console.log(`Updated desc for ${lineageId}`);
        }

        console.log("\nUpdating High Elf granted_spells...");
        await pool.query('UPDATE lineages SET granted_spells = ? WHERE lineage_id = ?', [JSON.stringify(highElfSpells), "high-elf"]);
        console.log("Updated High Elf granted spells!");

        console.log("\nAll updates applied successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Error updating database:", err);
        process.exit(1);
    }
}

updateDatabase();
