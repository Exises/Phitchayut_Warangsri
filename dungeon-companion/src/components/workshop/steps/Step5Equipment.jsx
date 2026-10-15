import React, { useState } from 'react';

export default function Step5Equipment({
  characterState,
  setCharacterState,
  dbData,
  totalStats
}) {
        const [showBeginnerGuide, setShowBeginnerGuide] = useState(true);
        const [catalogSearch, setCatalogSearch] = useState('');
        const [catalogCategory, setCatalogCategory] = useState('All');
        const [weightErrorMsg, setWeightErrorMsg] = useState('');

        const eq = characterState.equipment || { mode: 'standard', selectedSetId: null, armorId: null, shieldId: null, weapons: [], items: [], currency: { cp: 0, sp: 0, ep: 0, gp: 50, pp: 0 } };
        const CLASS_STARTING_GOLD = {
          fighter: 155, paladin: 150, cleric: 110,
          bard: 90, ranger: 150, rogue: 100, warlock: 100,
          barbarian: 75, sorcerer: 50, wizard: 55,
          druid: 50, monk: 50
        };
        const primaryClass = characterState.classData?.classes?.[0];
        const hasSelectedClass = Boolean(primaryClass?.classId);
        const primaryClassId = hasSelectedClass ? primaryClass.classId.toLowerCase() : '';
        const classGold = hasSelectedClass ? (CLASS_STARTING_GOLD[primaryClassId] || 100) : 0;
        const classObj = hasSelectedClass ? dbData?.classes?.find(c => (c.class_id || c.name)?.toLowerCase() === primaryClassId) : null;

        const CLASS_EQUIPMENT_SETS = {
          barbarian: [
            { id: 'set_a', label: "Set A: Greataxe, 4 Handaxes, Explorer's Pack + 15 GP", items: ['Greataxe', 'Handaxe (x4)', "Explorer's Pack"], gold: 15 },
            { id: 'set_b', label: "Set B: Class Starting Gold (75 GP)", items: [], gold: 75 }
          ],
          bard: [
            { id: 'set_a', label: "Set A: Leather Armor, 2 Daggers, Musical Instrument, Entertainer's Pack + 19 GP", items: ['Leather Armor', 'Dagger (x2)', 'Musical Instrument', "Entertainer's Pack"], gold: 19 },
            { id: 'set_b', label: "Set B: Class Starting Gold (90 GP)", items: [], gold: 90 }
          ],
          cleric: [
            { id: 'set_a', label: "Set A: Chain Shirt, Shield, Mace, Holy Symbol, Priest's Pack + 7 GP", items: ['Chain Shirt', 'Shield', 'Mace', 'Holy Symbol', "Priest's Pack"], gold: 7 },
            { id: 'set_b', label: "Set B: Class Starting Gold (110 GP)", items: [], gold: 110 }
          ],
          druid: [
            { id: 'set_a', label: "Set A: Leather Armor, Shield, Sickle, Druidic Focus, Explorer's Pack, Herbalism Kit + 9 GP", items: ['Leather Armor', 'Shield', 'Sickle', 'Druidic Focus', "Explorer's Pack", 'Herbalism Kit'], gold: 9 },
            { id: 'set_b', label: "Set B: Class Starting Gold (50 GP)", items: [], gold: 50 }
          ],
          fighter: [
            { id: 'set_a', label: "Set A (Strength Pack): Chain Mail, Greatsword, Flail, 8 Javelins, Dungeoneer's Pack + 4 GP", items: ['Chain Mail', 'Greatsword', 'Flail', 'Javelin (x8)', "Dungeoneer's Pack"], gold: 4 },
            { id: 'set_b', label: "Set B (Dexterity Pack): Studded Leather Armor, Scimitar, Shortsword, Longbow, 20 Arrows, Quiver, Dungeoneer's Pack + 11 GP", items: ['Studded Leather Armor', 'Scimitar', 'Shortsword', 'Longbow', 'Arrow (x20)', 'Quiver', "Dungeoneer's Pack"], gold: 11 },
            { id: 'set_c', label: "Set C: Class Starting Gold (155 GP)", items: [], gold: 155 }
          ],
          monk: [
            { id: 'set_a', label: "Set A: Spear, 5 Daggers, Artisan's Tools, Explorer's Pack + 11 GP", items: ['Spear', 'Dagger (x5)', "Artisan's Tools", "Explorer's Pack"], gold: 11 },
            { id: 'set_b', label: "Set B: Class Starting Gold (50 GP)", items: [], gold: 50 }
          ],
          paladin: [
            { id: 'set_a', label: "Set A: Chain Mail, Shield, Longsword, 6 Javelins, Holy Symbol, Priest's Pack + 9 GP", items: ['Chain Mail', 'Shield', 'Longsword', 'Javelin (x6)', 'Holy Symbol', "Priest's Pack"], gold: 9 },
            { id: 'set_b', label: "Set B: Class Starting Gold (150 GP)", items: [], gold: 150 }
          ],
          ranger: [
            { id: 'set_a', label: "Set A: Studded Leather Armor, Scimitar, Shortsword, Longbow, 20 Arrows, Quiver, Druidic Focus, Explorer's Pack + 7 GP", items: ['Studded Leather Armor', 'Scimitar', 'Shortsword', 'Longbow', 'Arrow (x20)', 'Quiver', 'Druidic Focus', "Explorer's Pack"], gold: 7 },
            { id: 'set_b', label: "Set B: Class Starting Gold (150 GP)", items: [], gold: 150 }
          ],
          rogue: [
            { id: 'set_a', label: "Set A: Leather Armor, 2 Daggers, Shortsword, Shortbow, 20 Arrows, Quiver, Thieves' Tools, Burglar's Pack + 8 GP", items: ['Leather Armor', 'Dagger (x2)', 'Shortsword', 'Shortbow', 'Arrow (x20)', 'Quiver', "Thieves' Tools", "Burglar's Pack"], gold: 8 },
            { id: 'set_b', label: "Set B: Class Starting Gold (100 GP)", items: [], gold: 100 }
          ],
          sorcerer: [
            { id: 'set_a', label: "Set A: Spear, 2 Daggers, Arcane Focus, Dungeoneer's Pack + 28 GP", items: ['Spear', 'Dagger (x2)', 'Arcane Focus', "Dungeoneer's Pack"], gold: 28 },
            { id: 'set_b', label: "Set B: Class Starting Gold (50 GP)", items: [], gold: 50 }
          ],
          warlock: [
            { id: 'set_a', label: "Set A: Leather Armor, Sickle, 2 Daggers, Arcane Focus, Book (occult lore), Scholar's Pack + 15 GP", items: ['Leather Armor', 'Sickle', 'Dagger (x2)', 'Arcane Focus', 'Book (occult lore)', "Scholar's Pack"], gold: 15 },
            { id: 'set_b', label: "Set B: Class Starting Gold (100 GP)", items: [], gold: 100 }
          ],
          wizard: [
            { id: 'set_a', label: "Set A: 2 Daggers, Arcane Focus, Robe, Spellbook, Scholar's Pack + 5 GP", items: ['Dagger (x2)', 'Arcane Focus', 'Robe', 'Spellbook', "Scholar's Pack"], gold: 5 },
            { id: 'set_b', label: "Set B: Class Starting Gold (55 GP)", items: [], gold: 55 }
          ]
        };

        const availableClassSets = hasSelectedClass ? (CLASS_EQUIPMENT_SETS[primaryClassId] || [
          { id: 'set_a', label: `Set A: Class Starting Pack (${classGold} GP)`, items: [], gold: classGold }
        ]) : [];

        const bgId = characterState.background?.id || characterState.background?.backgroundId || characterState.background?.name;
        const bgObj = dbData?.backgrounds?.find(b => 
          b.background_id === bgId || 
          (b.background_name || b.name || '').toLowerCase() === String(bgId || '').toLowerCase()
        );
        let bgDisplay = "50 GP";
        let bgGold = 50;
        let bgItems = [];
        if (bgObj?.equipment) {
          try {
            const parsedBgEq = typeof bgObj.equipment === 'string' ? JSON.parse(bgObj.equipment) : bgObj.equipment;
            bgDisplay = parsedBgEq.display || bgDisplay;
            bgGold = parsedBgEq.logic?.gold !== undefined ? parsedBgEq.logic.gold : 50;
            bgItems = parsedBgEq.logic?.items || [];
          } catch {
            bgDisplay = bgObj.equipment;
          }
        }

        const baseStr = parseInt(characterState.abilities?.base?.str || 10, 10);
        const bgStr = parseInt(characterState.abilities?.backgroundBonus?.str || characterState.abilities?.racialBonus?.str || 0, 10);
        const strScore = baseStr + bgStr;
        const maxCapacity = strScore * 15;
        const encLevel1 = strScore * 5;
        const encLevel2 = strScore * 10;

        const allItemsList = dbData?.items || [];
        let totalWeight = 0;
        const equippedArmorObj = eq.armorId ? allItemsList.find(i => i.item_id === eq.armorId || i.item_name === eq.armorId) : null;
        const equippedShieldObj = eq.shieldId ? allItemsList.find(i => i.item_id === eq.shieldId || i.item_name === eq.shieldId) : null;

        if (equippedArmorObj) totalWeight += parseInt(equippedArmorObj.weight || 0, 10);
        if (equippedShieldObj) totalWeight += parseInt(equippedShieldObj.weight || 6, 10);
        (eq.weapons || []).forEach(wId => {
          const wObj = allItemsList.find(i => i.item_id === wId || i.item_name === wId);
          if (wObj) totalWeight += parseInt(wObj.weight || 0, 10);
        });
        (eq.items || []).forEach(it => {
          totalWeight += (parseInt(it.weight || 0, 10) * parseInt(it.qty || 1, 10));
        });

        const checkWeightLimit = (addWeight, itemName = '') => {
          const addW = parseInt(addWeight || 0, 10);
          if (addW > 0 && (totalWeight + addW) > maxCapacity) {
            const itemInfo = itemName ? `"${itemName}" (${addW} lbs)` : `ไอเทมนี้ (${addW} lbs)`;
            setWeightErrorMsg(`กระเป๋าสัมภาระเต็มแล้ว! ไม่สามารถเพิ่ม ${itemInfo} ได้ เนื่องจากน้ำหนักรวม (${totalWeight + addW} lbs) จะเกินขีดจำกัดสูงสุด (${maxCapacity} lbs)`);
            return false;
          }
          setWeightErrorMsg('');
          return true;
        };

        let encStatus = { label: "Unencumbered", color: "#475569", bg: "#f8fafc", border: "#cbd5e1", note: `≤ ${encLevel1} lbs: Normal Speed` };
        if (totalWeight > maxCapacity) {
          encStatus = { label: "Over Capacity", color: "#711a19", bg: "#fef2f2", border: "#711a19", note: `> ${maxCapacity} lbs: Speed reduced to 5 ft.` };
        } else if (totalWeight > encLevel2) {
          encStatus = { label: "Heavily Encumbered", color: "#991b1b", bg: "#fef2f2", border: "#f87171", note: `> ${encLevel2} lbs: Speed -20 ft. + Disadvantage on STR/DEX/CON checks/saves` };
        } else if (totalWeight > encLevel1) {
          encStatus = { label: "Encumbered", color: "#b91c1c", bg: "#fff1f2", border: "#fca5a5", note: `> ${encLevel1} lbs: Speed reduced by 10 ft.` };
        }
        const weightPct = Math.min(100, Math.round((totalWeight / maxCapacity) * 100));

        const curr = eq.currency || { cp: 0, sp: 0, ep: 0, gp: 50, pp: 0 };
        const totalGPValue = (parseFloat(curr.gp || 0)) + (parseFloat(curr.pp || 0) * 10) + (parseFloat(curr.ep || 0) * 0.5) + (parseFloat(curr.sp || 0) * 0.1) + (parseFloat(curr.cp || 0) * 0.01);

        const armorsList = allItemsList.filter(i => i.item_type === 'Armor' && (i.subcategory || '').toLowerCase() !== 'shield' && (i.item_name || '').toLowerCase() !== 'shield');
        const shieldsList = allItemsList.filter(i => (i.subcategory || '').toLowerCase() === 'shield' || (i.item_name || '').toLowerCase() === 'shield');
        const weaponsList = allItemsList.filter(i => i.item_type === 'Weapon');

        const allowedArmorTypes = totalStats?.proficientArmor || [];

        const checkArmorSelectable = (armorObj) => {
          if (!armorObj) return { selectable: true };
          const subcat = armorObj.subcategory || '';
          if (!allowedArmorTypes.includes(subcat) && !allowedArmorTypes.includes(subcat + 's')) {
            return { selectable: false, reason: 'Not Proficient' };
          }
          const propStr = armorObj.properties || '';
          const strMatch = propStr.match(/Str\s*(\d+)/i);
          if (strMatch) {
            const reqStr = parseInt(strMatch[1], 10);
            if (strScore < reqStr) {
              return { selectable: false, reason: `Requires STR ${reqStr}` };
            }
          }
          return { selectable: true };
        };

        const shieldSelectable = allowedArmorTypes.includes('Shield') || allowedArmorTypes.includes('Shields');

        const charLevel = (characterState.classData?.classes || []).reduce((sum, cl) => sum + (Number(cl.level) || 0), 0) || 1;
        const profBonus = Math.ceil(1 + (charLevel / 4));
        const baseDex = parseInt(characterState.abilities?.base?.dex || 10, 10);
        const bgDex = parseInt(characterState.abilities?.backgroundBonus?.dex || characterState.abilities?.racialBonus?.dex || 0, 10);
        const dexScore = baseDex + bgDex;
        const strMod = Math.floor((strScore - 10) / 2);
        const dexMod = Math.floor((dexScore - 10) / 2);

        const handleEqChange = (newEq) => {
          setCharacterState(prev => {
            const curEq = prev.equipment || {};
            let items = newEq.items !== undefined ? [...newEq.items] : [...(curEq.items || [])];
            const allDbItems = dbData?.items || [];
            const allDbArmors = dbData?.armors || [];
            const allDbWeapons = dbData?.weapons || [];

            const targetArmorId = newEq.armorId !== undefined ? newEq.armorId : curEq.armorId;
            const targetShieldId = newEq.shieldId !== undefined ? newEq.shieldId : curEq.shieldId;
            const targetWeapons = newEq.weapons !== undefined ? newEq.weapons : (curEq.weapons || []);

            const findItemIndex = (idOrName) => {
              if (!idOrName) return -1;
              const targetStr = String(idOrName).toLowerCase().trim();
              return items.findIndex(it => {
                const idStr = String(it.itemId || '').toLowerCase().trim();
                const nameStr = String(it.name || '').toLowerCase().trim();
                return idStr === targetStr || nameStr === targetStr;
              });
            };

            const removeItemFromList = (idOrName) => {
              if (!idOrName) return;
              const idx = findItemIndex(idOrName);
              if (idx >= 0) {
                const checkUsed = (slotId) => slotId && (String(slotId).toLowerCase().trim() === String(idOrName).toLowerCase().trim() || String(slotId).toLowerCase().trim() === String(items[idx].name || '').toLowerCase().trim() || String(slotId).toLowerCase().trim() === String(items[idx].itemId || '').toLowerCase().trim());
                const isStillUsed = checkUsed(targetArmorId) || checkUsed(targetShieldId) || (targetWeapons && targetWeapons.some(w => checkUsed(w)));
                if (!isStillUsed) {
                  if ((items[idx].qty || 1) <= 1 || items[idx].addedFromCombatSlot) {
                    items.splice(idx, 1);
                  } else {
                    items[idx].qty -= 1;
                    if (items[idx].qty <= 0) {
                      items.splice(idx, 1);
                    } else {
                      items[idx].equipped = false;
                    }
                  }
                } else {
                  items[idx].equipped = true;
                }
              }
            };

            const addItemIfMissing = (idOrName, catFallback) => {
              if (!idOrName) return;
              const targetStr = String(idOrName).toLowerCase().trim();
              const existsIdx = items.findIndex(it => {
                const idStr = String(it.itemId || '').toLowerCase().trim();
                const nameStr = String(it.name || '').toLowerCase().trim();
                return idStr === targetStr || nameStr === targetStr;
              });
              if (existsIdx < 0) {
                const found = allDbItems.find(i => String(i.item_id || '').toLowerCase().trim() === targetStr || String(i.item_name || '').toLowerCase().trim() === targetStr)
                           || allDbArmors.find(i => String(i.item_id || '').toLowerCase().trim() === targetStr || String(i.item_name || '').toLowerCase().trim() === targetStr)
                           || allDbWeapons.find(i => String(i.item_id || '').toLowerCase().trim() === targetStr || String(i.item_name || '').toLowerCase().trim() === targetStr);
                if (found) {
                  items.push({
                    itemId: found.item_id || idOrName,
                    name: found.item_name || idOrName,
                    category: found.subcategory || catFallback,
                    damage: found.damage,
                    ac_base: found.ac,
                    weight: found.weight || 0,
                    cost: found.cost || '',
                    equipped: true,
                    qty: 1,
                    addedFromCombatSlot: true
                  });
                } else if (typeof idOrName === 'string') {
                  items.push({ itemId: idOrName, name: idOrName, category: catFallback, equipped: true, qty: 1, addedFromCombatSlot: true });
                }
              } else {
                items[existsIdx].equipped = true;
              }
            };

            if (newEq.items === undefined) {
              if (newEq.armorId !== undefined && newEq.armorId !== curEq.armorId && curEq.armorId) {
                removeItemFromList(curEq.armorId);
              }
              if (newEq.shieldId !== undefined && newEq.shieldId !== curEq.shieldId && curEq.shieldId) {
                removeItemFromList(curEq.shieldId);
              }
              if (newEq.weapons !== undefined && Array.isArray(newEq.weapons)) {
                const curW = curEq.weapons || [];
                const maxLen = Math.max(curW.length, newEq.weapons.length);
                for (let i = 0; i < maxLen; i++) {
                  const oldW = curW[i] || null;
                  const newW = newEq.weapons[i] || null;
                  if (oldW !== newW && oldW) {
                    removeItemFromList(oldW);
                  }
                }
              }
            }

            if (newEq.armorId !== undefined && newEq.armorId !== null) addItemIfMissing(newEq.armorId, 'Armor');
            if (newEq.shieldId !== undefined && newEq.shieldId !== null) addItemIfMissing(newEq.shieldId, 'Shield');
            if (newEq.weapons && Array.isArray(newEq.weapons)) {
              newEq.weapons.filter(Boolean).forEach(wId => addItemIfMissing(wId, 'Weapon'));
            }

            let finalArmorId = targetArmorId;
            let finalShieldId = targetShieldId;
            let finalWeapons = [...targetWeapons];

            const itemExists = (idOrName) => !idOrName || items.some(it => {
              const targetStr = String(idOrName).toLowerCase().trim();
              const idStr = String(it.itemId || '').toLowerCase().trim();
              const nameStr = String(it.name || '').toLowerCase().trim();
              return idStr === targetStr || nameStr === targetStr;
            });
            if (finalArmorId && !itemExists(finalArmorId)) finalArmorId = null;
            if (finalShieldId && !itemExists(finalShieldId)) finalShieldId = null;
            finalWeapons = finalWeapons.map(w => (w && itemExists(w)) ? w : null);

            return {
              ...prev,
              equipment: {
                ...curEq,
                ...newEq,
                armorId: newEq.armorId !== undefined ? newEq.armorId : finalArmorId,
                shieldId: newEq.shieldId !== undefined ? newEq.shieldId : finalShieldId,
                weapons: newEq.weapons !== undefined ? newEq.weapons : finalWeapons,
                items
              }
            };
          });
        };

        const handleSelectClassSet = (setObj) => {
          const currentItems = [];
          let detectedArmorId = null;
          let detectedShieldId = null;
          const detectedWeapons = [];

          let setWeight = 0;
          setObj.items.forEach(itemStr => {
            let cleanName = itemStr;
            let qty = 1;
            const m = typeof itemStr === 'string' ? itemStr.match(/^(.+?)\s*\(x(\d+)\)$/i) : null;
            if (m) {
              cleanName = m[1].trim();
              qty = parseInt(m[2], 10);
            }
            const dbItem = allItemsList.find(i => i.item_name?.toLowerCase() === cleanName?.toLowerCase());
            setWeight += (parseInt(dbItem?.weight || 0, 10) * qty);
          });
          if (setWeight > maxCapacity) {
            setWeightErrorMsg(`ไม่สามารถรับชุดอุปกรณ์นี้ (${setWeight} lbs) ได้ เนื่องจากเกินขีดจำกัดน้ำหนักสูงสุด (${maxCapacity} lbs)`);
            return;
          }
          setWeightErrorMsg('');

          setObj.items.forEach(itemStr => {
            let cleanName = itemStr;
            let qty = 1;
            const m = typeof itemStr === 'string' ? itemStr.match(/^(.+?)\s*\(x(\d+)\)$/i) : null;
            if (m) {
              cleanName = m[1].trim();
              qty = parseInt(m[2], 10);
            }
            const dbItem = allItemsList.find(i => i.item_name?.toLowerCase() === cleanName?.toLowerCase());
            const itemId = dbItem ? dbItem.item_id : cleanName;
            const weight = parseInt(dbItem?.weight || 0, 10);
            const cost = dbItem?.cost || '-';

            if (dbItem?.item_type === 'Armor') {
              if ((dbItem.subcategory || '').toLowerCase() === 'shield' || (dbItem.item_name || '').toLowerCase() === 'shield') {
                detectedShieldId = itemId;
              } else {
                detectedArmorId = itemId;
              }
            } else if (dbItem?.item_type === 'Weapon') {
              if (detectedWeapons.length < 3) {
                detectedWeapons.push(itemId);
              }
            }

            const existingIdx = currentItems.findIndex(i => (i.name || '').toLowerCase() === cleanName?.toLowerCase() || i.itemId === itemId);
            if (existingIdx >= 0) {
              currentItems[existingIdx].qty = (currentItems[existingIdx].qty || 1) + qty;
            } else {
              currentItems.push({
                itemId,
                name: dbItem ? dbItem.item_name : cleanName,
                weight,
                cost,
                qty,
                equipped: Boolean(dbItem?.item_type === 'Armor' || dbItem?.item_type === 'Weapon')
              });
            }
          });

          // Automatically include Background Items and 50 GP
          if (bgItems.length > 0) {
            bgItems.forEach(itemStr => {
              let cleanName = itemStr;
              let qty = 1;
              const m = typeof itemStr === 'string' ? itemStr.match(/^(.+?)\s*\(x(\d+)\)$/i) : null;
              if (m) {
                cleanName = m[1].trim();
                qty = parseInt(m[2], 10);
              }
              const dbItem = allItemsList.find(i => i.item_name?.toLowerCase() === cleanName?.toLowerCase());
              const itemId = dbItem ? dbItem.item_id : cleanName;
              const weight = parseInt(dbItem?.weight || 0, 10);
              const cost = dbItem?.cost || '-';

              const existingIdx = currentItems.findIndex(i => (i.name || '').toLowerCase() === cleanName?.toLowerCase() || i.itemId === itemId);
              if (existingIdx >= 0) {
                currentItems[existingIdx].qty = (currentItems[existingIdx].qty || 1) + qty;
              } else {
                currentItems.push({
                  itemId,
                  name: dbItem ? dbItem.item_name : cleanName,
                  weight,
                  cost,
                  qty,
                  equipped: false
                });
              }
            });
          }

          const totalStartingGold = (setObj.gold || 0) + (bgItems.length > 0 ? bgGold : 0);

          handleEqChange({
            selectedSetId: setObj.id,
            mode: setObj.id === 'set_c' || (setObj.items.length === 0) ? 'gold' : 'standard',
            items: currentItems,
            armorId: detectedArmorId || null,
            shieldId: detectedShieldId || null,
            weapons: [
              detectedWeapons[0] || null,
              detectedWeapons[1] || null,
              detectedWeapons[2] || null
            ],
            currency: { cp: 0, sp: 0, ep: 0, gp: totalStartingGold, pp: 0 },
            bgGearAdded: true
          });
        };

        const handleAddBackgroundEquipment = () => {
          let bgWeight = 0;
          bgItems.forEach(itemStr => {
            let cleanName = itemStr;
            let qty = 1;
            const m = typeof itemStr === 'string' ? itemStr.match(/^(.+?)\s*\(x(\d+)\)$/i) : null;
            if (m) {
              cleanName = m[1].trim();
              qty = parseInt(m[2], 10);
            }
            const dbItem = allItemsList.find(i => i.item_name?.toLowerCase() === cleanName?.toLowerCase());
            bgWeight += (parseInt(dbItem?.weight || 0, 10) * qty);
          });
          if (!checkWeightLimit(bgWeight, 'อุปกรณ์จาก Background')) {
            return;
          }

          const currentItems = [...(eq.items || [])];
          bgItems.forEach(itemStr => {
            let cleanName = itemStr;
            let qty = 1;
            const m = typeof itemStr === 'string' ? itemStr.match(/^(.+?)\s*\(x(\d+)\)$/i) : null;
            if (m) {
              cleanName = m[1].trim();
              qty = parseInt(m[2], 10);
            }
            const dbItem = allItemsList.find(i => i.item_name?.toLowerCase() === cleanName?.toLowerCase());
            const existingIdx = currentItems.findIndex(i => i.name?.toLowerCase() === cleanName?.toLowerCase());
            if (existingIdx >= 0) {
              currentItems[existingIdx].qty = (currentItems[existingIdx].qty || 1) + qty;
            } else {
              currentItems.push({
                itemId: dbItem ? dbItem.item_id : cleanName,
                name: dbItem ? dbItem.item_name : cleanName,
                weight: parseInt(dbItem?.weight || 0, 10),
                cost: dbItem?.cost || '-',
                qty
              });
            }
          });
          handleEqChange({ items: currentItems, currency: { ...curr, gp: (curr.gp || 0) + bgGold } });
        };

        const handleAddInventory = (item) => {
          const itemWeight = parseInt(item.weight || 0, 10);
          if (!checkWeightLimit(itemWeight, item.item_name)) {
            return;
          }

          const currentItems = [...(eq.items || [])];
          const existingIdx = currentItems.findIndex(i => i.itemId === item.item_id || i.name === item.item_name);
          if (existingIdx >= 0) {
            currentItems[existingIdx].qty = (currentItems[existingIdx].qty || 1) + 1;
          } else {
            currentItems.push({
              itemId: item.item_id || item.item_name,
              name: item.item_name,
              weight: itemWeight,
              cost: item.cost || '-',
              qty: 1
            });
          }
          handleEqChange({ items: currentItems });
        };

        const handleRemoveInventory = (idx) => {
          setWeightErrorMsg('');
          const currentItems = [...(eq.items || [])];
          currentItems.splice(idx, 1);
          handleEqChange({ items: currentItems });
        };

        const handleQtyChange = (idx, delta) => {
          const currentItems = [...(eq.items || [])];
          if (delta > 0) {
            const itemWeight = parseInt(currentItems[idx].weight || 0, 10);
            if (!checkWeightLimit(itemWeight, currentItems[idx].name)) {
              return;
            }
          } else {
            setWeightErrorMsg('');
          }

          const newQty = (currentItems[idx].qty || 1) + delta;
          if (newQty <= 0) {
            currentItems.splice(idx, 1);
          } else {
            currentItems[idx].qty = newQty;
          }
          handleEqChange({ items: currentItems });
        };

        return (
          <div className="builder-step-content animate-fade-in" style={{ padding: '10px' }}>
            <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
              <h3 className="step-title" style={{ margin: '0 0 6px 0', color: 'var(--color-ink)', fontSize: '1.4rem', fontWeight: '800' }}>
                <i className="fa-solid fa-shield-halved" style={{ color: '#711a19', marginRight: '10px' }}></i>
                Equipment & Inventory Management
              </h3>
              <p className="step-subtitle" style={{ margin: 0, color: 'var(--color-gray)', fontSize: '0.9rem' }}>
                สวมใส่เกราะ อาวุธ จัดการสัมภาระและเงินตรา พร้อมระบบติดตามน้ำหนักบรรทุก (Encumbrance) แบบเรียลไทม์ตามกฎ D&D 2024
              </p>
            </div>

            {/* 💡 Beginner Guide Banner for Step 5 */}
            <div style={{ backgroundColor: '#fef8f8', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
              <div 
                onClick={() => setShowBeginnerGuide(!showBeginnerGuide)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              >
                <div style={{ fontWeight: 'bold', color: '#711a19', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-compass-drafting" style={{ color: '#711a19' }}></i>
                  คำแนะนำสำหรับผู้เล่นใหม่: อุปกรณ์และกระเป๋าสัมภาระ (Equipment & Inventory) คืออะไร?
                </div>
                <span style={{ fontSize: '0.8rem', color: '#711a19', fontWeight: 'bold' }}>
                  {showBeginnerGuide ? 'ซ่อนคู่มือ ▲' : 'แสดงคู่มือ ▼'}
                </span>
              </div>
              {showBeginnerGuide && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #fca5a5', fontSize: '0.85rem', color: 'var(--color-gray)', lineHeight: '1.6' }}>
                  • <strong>ชุดอุปกรณ์เริ่มต้น (Starting Equipment):</strong> D&D 2024 มอบ 2 ทางเลือก: **Set A (ชุดสัมภาระประจำคลาส + ทอง)** หรือ **Set B (เงินทองตั้งต้นไปซื้อเอง)**<br />
                  • <strong>ของจากภูมิหลัง (Background Gear):</strong> อุปกรณ์และเงินทองประจำภูมิหลังจะถูกสวมใส่ให้อัตโนมัติ<br />
                  • <strong>น้ำหนักแบกรับ (Encumbrance):</strong> คำนวณน้ำหนักสิ่งของเทียบกับค่า Strength (STR × 15 lbs) เพื่อป้องกันไม่ให้ตัวละครแบกของหนักเกินไปจนเคลื่อนที่ช้าลง<br />
                  • <strong>กระเป๋าเงิน (Currency Pocket):</strong> สามารถสวมใส่อาวุธ เกราะ ชิลด์ และจัดการเหรียญทอง (GP, SP, CP, EP, PP) ได้ในส่วนล่าง
                </div>
              )}
            </div>

            {weightErrorMsg && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '2px solid #ef4444',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ color: '#dc2626', fontSize: '1.4rem' }}></i>
                  <div>
                    <div style={{ fontWeight: '800', color: '#991b1b', fontSize: '0.92rem' }}>⚠️ กระเป๋าสัมภาระเต็ม (Weight Limit Reached)</div>
                    <div style={{ color: '#b91c1c', fontSize: '0.83rem', marginTop: '2px' }}>{weightErrorMsg}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setWeightErrorMsg('')}
                  style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontSize: '1.2rem', padding: '4px' }}
                  title="Close warning"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            )}

            {(!hasSelectedClass && !characterState.background?.id) && (
              <div style={{ backgroundColor: '#fff1f2', border: '1px solid #f43f5e', borderRadius: '10px', padding: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <i className="fa-solid fa-circle-exclamation" style={{ color: '#e11d48', fontSize: '1.5rem' }}></i>
                <div>
                  <div style={{ fontWeight: '800', color: '#881337', fontSize: '0.95rem' }}>No Class or Background Selected Yet</div>
                  <div style={{ color: '#9f1239', fontSize: '0.82rem' }}>Please return to Step 2 (Class) and Step 3 (Background) to select your character traits. Starting equipment packages are only unlocked after picking your Class and Background.</div>
                </div>
              </div>
            )}

            {/* 1. Class Starting Equipment Sets */}
            <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ marginBottom: '14px' }}>
                <h4 style={{ margin: '0 0 4px 0', color: 'var(--color-ink)', fontSize: '1rem', fontWeight: '800' }}>
                  <i className="fa-solid fa-khanda" style={{ color: '#711a19', marginRight: '8px' }}></i>
                  1. Class Starting Equipment Set {classObj?.class_name ? `(${classObj.class_name})` : ''} (D&D 2024 Rules)
                </h4>
                <p style={{ margin: 0, color: 'var(--color-gray)', fontSize: '0.82rem' }}>
                  Select your starting package to automatically add items and gold directly into your inventory.
                </p>
              </div>

              {!hasSelectedClass ? (
                <div style={{ padding: '20px', backgroundColor: '#fef2f2', border: '1px dashed #f87171', borderRadius: '8px', textAlign: 'center', color: '#991b1b', fontWeight: '700', fontSize: '0.9rem' }}>
                  <i className="fa-solid fa-lock" style={{ marginRight: '8px', fontSize: '1.1rem' }}></i>
                  No Class Selected! Please go back to Step 2 (Class) and choose a class to view available Starting Equipment sets.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {availableClassSets.map(setObj => {
                    const isSelected = eq.selectedSetId === setObj.id;
                    return (
                      <div
                        key={setObj.id}
                        onClick={() => handleSelectClassSet(setObj)}
                        style={{
                          padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                          border: isSelected ? '2px solid #711a19' : '1px solid #cbd5e1',
                          backgroundColor: isSelected ? '#fef2f2' : 'var(--bg-white)',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '800', color: isSelected ? '#711a19' : 'var(--color-ink)', fontSize: '0.9rem', marginBottom: '4px' }}>
                            <i className={isSelected ? "fa-solid fa-circle-check" : "fa-regular fa-circle"} style={{ marginRight: '8px', color: isSelected ? '#711a19' : 'var(--color-gray)' }}></i>
                            {setObj.label}
                          </div>
                          {setObj.items.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginLeft: '22px' }}>
                              {setObj.items.map((itName, iIdx) => (
                                <span key={iIdx} style={{ backgroundColor: isSelected ? 'var(--bg-white)' : 'var(--bg-white)', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-gray)' }}>
                                  {itName}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{ fontWeight: '800', fontSize: '0.85rem', color: isSelected ? '#711a19' : 'var(--color-gray)', backgroundColor: isSelected ? 'var(--bg-white)' : 'var(--bg-white)', padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                          + {setObj.gold} GP
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Separate Background Equipment Section */}
            <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: 'var(--color-ink)', fontSize: '1rem', fontWeight: '800' }}>
                    <i className="fa-solid fa-user-shield" style={{ color: '#711a19', marginRight: '8px' }}></i>
                    2. Background Equipment & Gold Package {bgObj?.background_name ? `(${bgObj.background_name})` : ''}
                  </h4>
                  <p style={{ margin: 0, color: 'var(--color-gray)', fontSize: '0.85rem', fontWeight: '600' }}>
                    {hasSelectedClass || characterState.background?.id ? bgDisplay : 'Select a background to view equipment.'}
                  </p>
                </div>
                {characterState.background?.id && (
                  <span style={{
                    padding: '6px 14px', borderRadius: '20px', border: '1px solid #16a34a', backgroundColor: '#f0fdf4',
                    color: '#15803d', fontWeight: '800', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                    <i className="fa-solid fa-circle-check" style={{ color: '#16a34a' }}></i> Auto-Included in Inventory (+{bgGold} GP & Gear)
                  </span>
                )}
              </div>
              {!characterState.background?.id && (
                <div style={{ marginTop: '14px', padding: '20px', backgroundColor: '#fef2f2', border: '1px dashed #f87171', borderRadius: '8px', textAlign: 'center', color: '#991b1b', fontWeight: '700', fontSize: '0.9rem' }}>
                  <i className="fa-solid fa-lock" style={{ marginRight: '8px', fontSize: '1.1rem' }}></i>
                  No Background Selected! Please go back to Step 3 (Background) and pick a background to unlock your starting background gear and gold package.
                </div>
              )}
            </div>

            {/* 2. Variant Encumbrance Meter */}
            <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span style={{ fontWeight: '800', color: 'var(--color-ink)', fontSize: '0.95rem' }}>
                    <i className="fa-solid fa-weight-hanging" style={{ color: encStatus.color, marginRight: '8px' }}></i>
                    Total Carried Weight (Encumbrance): {totalWeight} / {maxCapacity} lbs
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: encStatus.color, backgroundColor: encStatus.bg, padding: '4px 10px', borderRadius: '6px', border: `1px solid ${encStatus.border}` }}>
                  {encStatus.label} ({encStatus.note})
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '12px', backgroundColor: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  width: `${weightPct}%`, height: '100%',
                  backgroundColor: encStatus.color, transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--color-gray)', marginTop: '6px', fontWeight: '600' }}>
                <span>0 lbs</span>
                <span>STR × 5 ({encLevel1} lbs)</span>
                <span>STR × 10 ({encLevel2} lbs)</span>
                <span>Max Capacity ({maxCapacity} lbs)</span>
              </div>
            </div>

            {/* 3. Currency Pocket */}
            <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                <h4 style={{ margin: 0, color: 'var(--color-ink)', fontSize: '0.95rem', fontWeight: '800' }}>
                  <i className="fa-solid fa-sack-dollar" style={{ color: '#711a19', marginRight: '8px' }}></i>
                  Currency Pocket
                </h4>
                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#711a19', backgroundColor: '#fef2f2', padding: '4px 12px', borderRadius: '6px', border: '1px solid #711a19' }}>
                  Total Gold Value: {totalGPValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} GP
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
                {[
                  { key: 'cp', label: 'CP (Copper)', rate: '1/100 GP' },
                  { key: 'sp', label: 'SP (Silver)', rate: '1/10 GP' },
                  { key: 'ep', label: 'EP (Electrum)', rate: '1/2 GP' },
                  { key: 'gp', label: 'GP (Gold)', rate: '1 GP' },
                  { key: 'pp', label: 'PP (Platinum)', rate: '10 GP' }
                ].map(coin => (
                  <div key={coin.key} style={{ backgroundColor: 'var(--bg-white)', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-gray)', marginBottom: '4px' }}>{coin.label}</div>
                    <input
                      type="number"
                      min="0"
                      value={curr[coin.key] || 0}
                      onChange={(e) => handleEqChange({ currency: { ...curr, [coin.key]: parseInt(e.target.value || 0, 10) } })}
                      style={{ width: '100%', padding: '6px', textAlign: 'center', fontWeight: '800', fontSize: '0.95rem', border: '1px solid #94a3b8', borderRadius: '6px', color: 'var(--color-ink)' }}
                    />
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-gray)', marginTop: '4px' }}>({coin.rate})</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Equipped Combat Gear */}
            <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 14px 0', color: 'var(--color-ink)', fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-khanda" style={{ color: '#711a19' }}></i>
                Equipped Combat Gear
              </h4>

              {/* Armor & Shield Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                {/* Armor Select */}
                <div style={{ backgroundColor: 'var(--bg-white)', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: 'var(--color-gray)', marginBottom: '6px' }}>
                    <i className="fa-solid fa-shirt" style={{ marginRight: '6px' }}></i>Armor Slot (Qualified armor only)
                  </label>
                  <select
                    value={eq.armorId || ''}
                    onChange={(e) => handleEqChange({ armorId: e.target.value || null })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #64748b', fontWeight: '600', fontSize: '0.85rem', color: 'var(--color-ink)' }}
                  >
                    <option value="">-- No Armor Equipped (Unarmored) --</option>
                    {armorsList.map(a => {
                      const chk = checkArmorSelectable(a);
                      return (
                        <option
                          key={a.item_id || a.item_name}
                          value={a.item_id || a.item_name}
                          disabled={!chk.selectable}
                          style={{ color: !chk.selectable ? 'var(--color-gray)' : 'var(--color-ink)' }}
                        >
                          {a.item_name} ({a.ac || 'AC ?'}) - {a.cost || ''} {chk.selectable ? `[${a.weight || 0} lbs]` : `[🔒 ${chk.reason}]`}
                        </option>
                      );
                    })}
                  </select>
                  {equippedArmorObj && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-gray)', marginTop: '6px' }}>
                      <strong>AC Formula:</strong> {equippedArmorObj.ac || '-'} | <strong>Weight:</strong> {equippedArmorObj.weight || 0} lbs
                      {equippedArmorObj.stealth?.toLowerCase().includes('disadvantage') && (
                        <span style={{ display: 'block', color: '#b91c1c', fontWeight: '700', marginTop: '2px' }}>⚠️ Disadvantage on Stealth checks</span>
                      )}
                      {!checkArmorSelectable(equippedArmorObj).selectable && (
                        <span style={{ display: 'block', color: '#b91c1c', fontWeight: '800', marginTop: '2px' }}>🔒 {checkArmorSelectable(equippedArmorObj).reason}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Shield Select */}
                <div style={{ backgroundColor: 'var(--bg-white)', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: 'var(--color-gray)', marginBottom: '6px' }}>
                    <i className="fa-solid fa-shield" style={{ marginRight: '6px' }}></i>Shield Slot
                  </label>
                  <select
                    value={eq.shieldId || ''}
                    onChange={(e) => handleEqChange({ shieldId: e.target.value || null })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #64748b', fontWeight: '600', fontSize: '0.85rem', color: 'var(--color-ink)' }}
                  >
                    <option value="">-- No Shield Equipped --</option>
                    {shieldsList.map(s => (
                      <option
                        key={s.item_id || s.item_name}
                        value={s.item_id || s.item_name}
                        disabled={!shieldSelectable}
                        style={{ color: !shieldSelectable ? 'var(--color-gray)' : 'var(--color-ink)' }}
                      >
                        {s.item_name} (+2 AC) - {s.cost || ''} {shieldSelectable ? `[${s.weight || 6} lbs]` : '[🔒 Shield Proficiency Required]'}
                      </option>
                    ))}
                  </select>
                  {equippedShieldObj && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-gray)', marginTop: '6px' }}>
                      <strong>Bonus:</strong> +2 AC | <strong>Weight:</strong> {equippedShieldObj.weight || 6} lbs
                    </div>
                  )}
                </div>
              </div>

              {/* Equipped Weapons Section */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <h5 style={{ margin: '0 0 4px 0', color: 'var(--color-ink)', fontSize: '0.95rem', fontWeight: '800' }}>
                    <i className="fa-solid fa-crossswords" style={{ color: '#711a19', marginRight: '8px' }}></i>
                    Equipped Combat Weapons Slots
                  </h5>
                  <p style={{ margin: 0, color: 'var(--color-gray)', fontSize: '0.8rem', lineHeight: '1.4' }}>
                    💡 <strong>Weapon Handling Rules:</strong> Characters have two hands. You can wield two light one-handed weapons (Dual Wield), one two-handed weapon, or a weapon plus a shield. Assign up to 3 ready weapon slots below for instant attack and damage calculations.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                  {['Slot 1: Primary Hand', 'Slot 2: Off-Hand / Dual Wield', 'Slot 3: Ranged / Backup Weapon'].map((slotLabel, slotIdx) => {
                    const wId = (eq.weapons || [])[slotIdx] || '';
                    const wObj = weaponsList.find(w => w.item_id === wId || w.item_name === wId);

                    let atkStr = '+0';
                    let dmgStr = '-';
                    let useDex = false;
                    if (wObj) {
                      const isRanged = (wObj.subcategory || '').toLowerCase().includes('ranged');
                      const isFinesse = (wObj.properties || '').toLowerCase().includes('finesse');
                      useDex = isRanged || (isFinesse && dexMod > strMod);
                      const mod = useDex ? dexMod : strMod;
                      const atkBonus = mod + profBonus;
                      atkStr = atkBonus >= 0 ? `+${atkBonus}` : `${atkBonus}`;
                      const dmgDice = wObj.damage || '1d6';
                      dmgStr = `${dmgDice} ${mod !== 0 ? (mod > 0 ? `+ ${mod}` : `- ${Math.abs(mod)}`) : ''}`;
                    }

                    return (
                      <div key={slotIdx} style={{ backgroundColor: 'var(--bg-white)', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: 'var(--color-gray)', marginBottom: '6px' }}>
                          <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: '6px', color: 'var(--color-gray)' }}></i>{slotLabel}
                        </label>
                        <select
                          value={wId}
                          onChange={(e) => {
                            const newW = [...(eq.weapons || [])];
                            newW[slotIdx] = e.target.value || null;
                            handleEqChange({ weapons: newW });
                          }}
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #64748b', fontWeight: '600', fontSize: '0.85rem', color: 'var(--color-ink)' }}
                        >
                          <option value="">-- Empty Slot --</option>
                          {weaponsList.map(w => (
                            <option key={w.item_id || w.item_name} value={w.item_id || w.item_name}>
                              {w.item_name} ({w.damage || '1d6'}) - {w.cost || ''}
                            </option>
                          ))}
                        </select>
                        {wObj && (
                          <div style={{ marginTop: '8px', padding: '8px', backgroundColor: 'var(--bg-white)', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontWeight: '800', color: '#711a19' }}>
                                <i className="fa-solid fa-bullseye" style={{ marginRight: '4px' }}></i>Attack: {atkStr} ({useDex ? 'DEX' : 'STR'}+PB)
                              </span>
                              <span style={{ fontWeight: '800', color: 'var(--color-ink)' }}>
                                <i className="fa-solid fa-burst" style={{ marginRight: '4px' }}></i>Damage: {dmgStr}
                              </span>
                            </div>
                            <div style={{ color: 'var(--color-gray)', fontSize: '0.72rem' }}>
                              <strong>Properties:</strong> {wObj.properties || 'Standard'} | <strong>Type:</strong> {wObj.subcategory || 'Weapon'}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 5. Inventory & Shop Catalog */}
            <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <h4 style={{ margin: 0, color: 'var(--color-ink)', fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-backpack" style={{ color: '#711a19' }}></i>
                  Inventory List & SRD 2.5.1 Items
                </h4>
                
              </div>

              {/* Current Inventory Items */}
              {(eq.items || []).length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', backgroundColor: 'var(--bg-white)', borderRadius: '8px', border: '1px solid #cbd5e1', color: 'var(--color-gray)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  Your inventory is empty. Add items from the catalog below.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  {(eq.items || []).map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-white)', padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <div>
                        <span style={{ fontWeight: '700', color: 'var(--color-ink)', fontSize: '0.9rem' }}>{it.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-gray)', marginLeft: '8px' }}>({it.cost}) - {it.weight * it.qty} lbs</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button type="button" onClick={() => handleQtyChange(idx, -1)} style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: 'var(--bg-white)', fontWeight: '800', cursor: 'pointer', color: 'var(--color-ink)' }}>-</button>
                        <span style={{ fontWeight: '800', fontSize: '0.9rem', minWidth: '24px', textAlign: 'center', color: 'var(--color-ink)' }}>{it.qty}</span>
                        <button type="button" onClick={() => handleQtyChange(idx, 1)} style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: 'var(--bg-white)', fontWeight: '800', cursor: 'pointer', color: 'var(--color-ink)' }}>+</button>
                        <button type="button" onClick={() => handleRemoveInventory(idx)} style={{ color: '#b91c1c', border: 'none', background: 'none', cursor: 'pointer', marginLeft: '6px', fontSize: '0.9rem' }}>
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Item Catalog Browser */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px', marginTop: '16px' }}>
                <h5 style={{ margin: 0, color: 'var(--color-gray)', fontSize: '0.95rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-cart-plus" style={{ color: '#711a19' }}></i> Add Items to Inventory (Catalog)
                </h5>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: '1 1 300px', justifyContent: 'flex-end' }}>
                  {/* Search bar */}
                  <div style={{ position: 'relative', flex: '1 1 180px', minWidth: '160px' }}>
                    <i className="fa-solid fa-search" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray)', fontSize: '0.8rem' }}></i>
                    <input
                      type="text"
                      placeholder="Search items..."
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      style={{ width: '100%', padding: '6px 28px 6px 28px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none' }}
                    />
                    {catalogSearch && (
                      <button
                        type="button"
                        onClick={() => setCatalogSearch('')}
                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-gray)', cursor: 'pointer', padding: 0 }}
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    )}
                  </div>
                  {/* Category Filter Dropdown */}
                  <select
                    value={catalogCategory}
                    onChange={(e) => setCatalogCategory(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: 'var(--bg-white)', fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-gray)', cursor: 'pointer' }}
                  >
                    <option value="All">📦 All Items</option>
                    <option value="Weapon">⚔️ Weapons</option>
                    <option value="Armor">🛡️ Armor & Shields</option>
                    <option value="Gear">🎒 Adventuring Gear</option>
                    <option value="Tool">🛠️ Tools & Kits</option>
                  </select>
                </div>
              </div>

              {/* Filter Tabs / Quick Pills */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {['All', 'Weapon', 'Armor', 'Gear', 'Tool'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCatalogCategory(cat)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '14px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      border: catalogCategory === cat ? '1px solid #711a19' : '1px solid #e2e8f0',
                      backgroundColor: catalogCategory === cat ? '#711a19' : 'var(--bg-white)',
                      color: catalogCategory === cat ? 'var(--bg-white)' : 'var(--color-gray)',
                      transition: 'all 0.15s'
                    }}
                  >
                    {cat === 'All' ? 'All Items' : cat === 'Weapon' ? 'Weapons' : cat === 'Armor' ? 'Armor & Shields' : cat === 'Gear' ? 'Adventuring Gear' : 'Tools & Kits'}
                  </button>
                ))}
              </div>

              {(() => {
                const filteredItems = allItemsList.filter(it => {
                  const matchesSearch = !catalogSearch || (it.item_name || '').toLowerCase().includes(catalogSearch.toLowerCase()) || (it.item_type || '').toLowerCase().includes(catalogSearch.toLowerCase());
                  const matchesCat = catalogCategory === 'All' || 
                    (catalogCategory === 'Armor' ? (it.item_type === 'Armor' || (it.subcategory || '').toLowerCase() === 'shield') :
                     (it.item_type || '').toLowerCase().includes(catalogCategory.toLowerCase()) || (it.subcategory || '').toLowerCase().includes(catalogCategory.toLowerCase()));
                  return matchesSearch && matchesCat;
                });

                return (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-gray)', marginBottom: '8px', fontStyle: 'italic' }}>
                      Showing {filteredItems.length} items {catalogSearch && `matching "${catalogSearch}"`}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
                      {filteredItems.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '24px', color: 'var(--color-gray)', fontStyle: 'italic', border: '1px dashed #cbd5e1', borderRadius: '6px' }}>
                          No items found matching your filter or search query.
                        </div>
                      ) : (
                        filteredItems.slice(0, 100).map((item, i) => {
                          const itemWeight = parseInt(item.weight || 0, 10);
                          const wouldExceed = itemWeight > 0 && (totalWeight + itemWeight) > maxCapacity;
                          return (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: 'var(--bg-white)', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.8rem', transition: 'all 0.15s' }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
                                <div style={{ fontWeight: '700', color: 'var(--color-ink)' }}>{item.item_name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-gray)' }}>
                                  <span style={{ color: '#711a19', fontWeight: '600' }}>{item.item_type || 'Gear'}</span> | {item.cost || '-'} | {item.weight || 0} lbs
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAddInventory(item)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  border: wouldExceed ? '1px solid #f87171' : '1px solid #711a19',
                                  backgroundColor: wouldExceed ? '#fee2e2' : '#fef2f2',
                                  color: wouldExceed ? '#991b1b' : '#711a19',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  flexShrink: 0
                                }}
                                title={wouldExceed ? `น้ำหนักสัมภาระจะเกินขีดจำกัดสูงสุด (${maxCapacity} lbs)` : ''}
                              >
                                {wouldExceed ? '⚠️ + Add' : '+ Add'}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        );
}
