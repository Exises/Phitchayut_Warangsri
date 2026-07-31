// Class & Milestone Achievement Badges Definition
export const ACHIEVEMENTS = [
    // 12 Core D&D Classes
    { id: 'class_barbarian', classKey: 'Barbarian', title: 'นักรบผู้บ้าคลั่ง', subTitle: 'Wild Berserker', icon: 'fa-gavel', category: 'class', desc: 'ปลดล็อคจากการทดสอบได้คลาส Barbarian ในโหมด AI DM' },
    { id: 'class_bard', classKey: 'Bard', title: 'กวีเสน่ห์เวท', subTitle: 'Spellbound Minstrel', icon: 'fa-guitar', category: 'class', desc: 'ปลดล็อคจากการทดสอบได้คลาส Bard ในโหมด AI DM' },
    { id: 'class_cleric', classKey: 'Cleric', title: 'ผู้ศรัทธาแห่งทวยเทพ', subTitle: 'Divine Servant', icon: 'fa-cross', category: 'class', desc: 'ปลดล็อคจากการทดสอบได้คลาส Cleric ในโหมด AI DM' },
    { id: 'class_druid', classKey: 'Druid', title: 'ผู้พิทักษ์ผืนป่า', subTitle: 'Guardian of the Wild', icon: 'fa-leaf', category: 'class', desc: 'ปลดล็อคจากการทดสอบได้คลาส Druid ในโหมด AI DM' },
    { id: 'class_fighter', classKey: 'Fighter', title: 'ยอดนักรบยุทธวิธี', subTitle: 'Master Tactician', icon: 'fa-shield-halved', category: 'class', desc: 'ปลดล็อคจากการทดสอบได้คลาส Fighter ในโหมด AI DM' },
    { id: 'class_monk', classKey: 'Monk', title: 'ปรมาจารย์แห่งจิตวิญญาณ', subTitle: 'Zen Grandmaster', icon: 'fa-yin-yang', category: 'class', desc: 'ปลดล็อคจากการทดสอบได้คลาส Monk ในโหมด AI DM' },
    { id: 'class_paladin', classKey: 'Paladin', title: 'อัศวินผดุงธรรม', subTitle: 'Holy Avenger', icon: 'fa-khanda', category: 'class', desc: 'ปลดล็อคจากการทดสอบได้คลาส Paladin ในโหมด AI DM' },
    { id: 'class_ranger', classKey: 'Ranger', title: 'นายพรานไร้ร่องรอย', subTitle: 'Shadow Tracker', icon: 'fa-crosshairs', category: 'class', desc: 'ปลดล็อคจากการทดสอบได้คลาส Ranger ในโหมด AI DM' },
    { id: 'class_rogue', classKey: 'Rogue', title: 'จอมโจรลอบเร้น', subTitle: 'Silent Phantom', icon: 'fa-mask', category: 'class', desc: 'ปลดล็อคจากการทดสอบได้คลาส Rogue ในโหมด AI DM' },
    { id: 'class_sorcerer', classKey: 'Sorcerer', title: 'ผู้จุติสายเลือดเวท', subTitle: 'Arcane Legacy', icon: 'fa-fire', category: 'class', desc: 'ปลดล็อคจากการทดสอบได้คลาส Sorcerer ในโหมด AI DM' },
    { id: 'class_warlock', classKey: 'Warlock', title: 'ผู้ทำพันธสัญญาเงา', subTitle: 'Pact of Shadows', icon: 'fa-eye', category: 'class', desc: 'ปลดล็อคจากการทดสอบได้คลาส Warlock ในโหมด AI DM' },
    { id: 'class_wizard', classKey: 'Wizard', title: 'ปราชญ์จอมเวท', subTitle: 'Grand Scholar', icon: 'fa-hat-wizard', category: 'class', desc: 'ปลดล็อคจากการทดสอบได้คลาส Wizard ในโหมด AI DM' },

    // Special Milestones
    { id: 'first_dm_test', classKey: null, title: 'ผู้ถักทอโชคชะตา', subTitle: 'Weaver of Destiny', icon: 'fa-dragon', category: 'milestone', desc: 'ทำแบบทดสอบ AI DM ครบ 10 ฉากสำเร็จครั้งแรก' },
    { id: 'destiny_explorer', classKey: null, title: 'นักสำรวจมหากาพย์', subTitle: 'Epic Adventurer', icon: 'fa-compass', category: 'milestone', desc: 'ทำแบบทดสอบ AI DM ครบ 5 ครั้งขึ้นไป' },
    { id: 'legend_all_12', classKey: null, title: 'ตำนานผู้พิชิต 12 คลาส', subTitle: 'Master of All Realms', icon: 'fa-crown', category: 'milestone', desc: 'ปลดล็อคเหรียญตราคลาสครบทั้ง 12 อาชีพ' }
];

export function getUserStorageKey(baseKey) {
    try {
        const storedUser = localStorage.getItem('dnd_user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            const uid = user.user_id || user.id || user.username || user.user_email;
            if (uid) return `${baseKey}_user_${uid}`;
        }
    } catch (e) {}
    return `${baseKey}_guest`;
}

export function getUnlockedBadgeIds() {
    try {
        const key = getUserStorageKey('dnd_achievements');
        let raw = localStorage.getItem(key);
        if (!raw) {
            const legacyRaw = localStorage.getItem('dnd_achievements');
            if (legacyRaw) {
                localStorage.setItem(key, legacyRaw);
                raw = legacyRaw;
            }
        }
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error("Error reading dnd_achievements:", e);
        return [];
    }
}

export function unlockAchievementsForRun(topClassKey) {
    if (!topClassKey) return [];
    try {
        const unlockedSet = new Set(getUnlockedBadgeIds());
        const newlyUnlocked = [];

        // 1. Unlock top class badge
        const targetClassId = `class_${String(topClassKey).toLowerCase()}`;
        if (!unlockedSet.has(targetClassId)) {
            unlockedSet.add(targetClassId);
            newlyUnlocked.push(targetClassId);
        }

        // 2. Unlock First Test milestone
        if (!unlockedSet.has('first_dm_test')) {
            unlockedSet.add('first_dm_test');
            newlyUnlocked.push('first_dm_test');
        }

        // 3. Unlock 5 Runs milestone if destiny history count >= 5
        try {
            const histKey = getUserStorageKey('dnd_destiny_history');
            const historyRaw = localStorage.getItem(histKey);
            const historyArr = historyRaw ? JSON.parse(historyRaw) : [];
            if (historyArr.length >= 5 && !unlockedSet.has('destiny_explorer')) {
                unlockedSet.add('destiny_explorer');
                newlyUnlocked.push('destiny_explorer');
            }
        } catch (e) {}

        // 4. Check if all 12 class badges unlocked
        const allClassIds = ACHIEVEMENTS.filter(a => a.category === 'class').map(a => a.id);
        const hasAll12 = allClassIds.every(id => unlockedSet.has(id));
        if (hasAll12 && !unlockedSet.has('legend_all_12')) {
            unlockedSet.add('legend_all_12');
            newlyUnlocked.push('legend_all_12');
        }

        const finalArr = Array.from(unlockedSet);
        const key = getUserStorageKey('dnd_achievements');
        localStorage.setItem(key, JSON.stringify(finalArr));
        return newlyUnlocked;
    } catch (e) {
        console.error("Error updating achievements:", e);
        return [];
    }
}
