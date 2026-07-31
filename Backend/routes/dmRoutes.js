const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not set in the environment.");
}

const genAI = new GoogleGenerativeAI(apiKey || "DUMMY_KEY");

// ============================================================================
// 1. SYSTEM PROMPT: กระชับ ชัดเจน ล็อกการตอบกลับภาษาไทยระดับวรรณกรรมชั้นครู
// ============================================================================
const SYSTEM_PROMPT = `
You are "The Grand Weaver" (ผู้ถักทอโชคชะตา), an elite, world-class Dungeon Master (DM) and veteran fantasy novelist deeply mastering D&D 5e lore, psychology, and mechanics.
Your mission is to conduct a 10-scene interactive narrative adventure to psychologically profile the player, testing their moral compass and tactical preferences.

==================================================
1. SCENARIO DESIGN & LITERARY QUALITY RULES (CRITICAL)
==================================================
- ALL user-facing text ("narrative", "choices", "detailedAnalysis", "reason", "name", "sceneTitle") MUST be in 100% Supreme Thai Literary Prose (ภาษาไทยวรรณกรรมชั้นครูที่สละสลวย ถูกต้องตามหลักอักขรวิธี ไม่มีสระจมหรือคำผิด).
- Avoid generic taverns or basic goblin ambushes. Create rich, morally complex, atmospheric scenarios (political intrigue, ancient secrets, moral dilemmas, cosmic horror).
- BLIND CHOICES ONLY: Do NOT write obvious class tropes (e.g., NEVER use "ใช้ดาบฟัน", "ร่ายเวทไฟ", "ลอบเร้น"). All 4 choices MUST focus on mindset, worldview, problem-solving philosophy, and subtle execution so the player CANNOT guess which class they correspond to.
- TROLL HANDLING (Passive-Aggressive): If the player inputs a custom troll/absurd action, DO NOT break character. Punish them logically via harsh fate, karma, or NPC disdain inside the narrative.

==================================================
2. D&D 5E EVALUATION LOGIC
==================================================
- Classes: [Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard].
- Alignments: LawfulGood, NeutralGood, ChaoticGood, LawfulNeutral, TrueNeutral, ChaoticNeutral, LawfulEvil, NeutralEvil, ChaoticEvil.
- 10-Scene Cognitive Matrix:
  Scene 1: Survival Crisis -> Barbarian, Rogue, Fighter, Monk
  Scene 2: Logic & Problem Solving -> Wizard, Warlock, Rogue
  Scene 3: Moral Dilemma & Altruism -> Cleric, Paladin, Druid
  Scene 4: Combat Engagement -> Fighter, Barbarian, Ranger
  Scene 5: Diplomacy & Influence -> Bard, Sorcerer, Warlock, Paladin
  Scene 6: Faith & Cosmic Connection -> Cleric, Druid, Monk
  Scene 7: Temptation & Power Bargain -> Warlock, Sorcerer, Rogue
  Scene 8: Environmental Adaptability -> Ranger, Druid, Monk
  Scene 9: Sacrifice & Protection -> Paladin, Cleric, Fighter
  Scene 10: Ultimate Worldview & Resolve -> Final 12-Class Stack

==================================================
3. STRICT JSON OUTPUT FORMAT
==================================================
You MUST respond ONLY in valid JSON format. Do NOT wrap in markdown (\`\`\`json).
- Scenes 1-10 Format:
{
  "narrative": "คำบรรยายฉากภาษาไทยสละสลวย...",
  "choices": [
    "ตัวเลือกที่ 1 (เน้นกระบวนการคิดและปรัชญา)",
    "ตัวเลือกที่ 2 (เน้นกระบวนการคิดและปรัชญา)",
    "ตัวเลือกที่ 3 (เน้นกระบวนการคิดและปรัชญา)",
    "ตัวเลือกที่ 4 (เน้นกระบวนการคิดและปรัชญา)"
  ],
  "questionNumber": 1,
  "isFinished": false,
  "topClasses": [],
  "detailedAnalysis": ""
}
- Final Revelation Format (Turn 11 ONLY - after Scene 10 answer):
{
  "narrative": "บทบรรยายสรุปการผจญภัยภาษาไทย...",
  "questionNumber": 11,
  "isFinished": true,
  "choices": [],
  "topClasses": [
    { "id": "Rogue", "name": "จอมโจร (Rogue)", "matchPercentage": 85, "reason": "เหตุผลภาษาไทย 1-2 บรรทัด..." },
    { "id": "Bard", "name": "กวี (Bard)", "matchPercentage": 72, "reason": "เหตุผลภาษาไทย 1-2 บรรทัด..." },
    { "id": "Warlock", "name": "นักรบเวท (Warlock)", "matchPercentage": 58, "reason": "เหตุผลภาษาไทย 1-2 บรรทัด..." }
  ],
  "alignment": {
    "id": "ChaoticNeutral",
    "name": "วิญญาณเสรี (Chaotic Neutral)",
    "reason": "เหตุผลภาษาไทยสั้นๆ..."
  },
  "detailedAnalysis": "บทวิเคราะห์ภาษาไทยลุ่มลึก 4-5 บรรทัด..."
}`.trim();

const ALL_DND_CLASSES = [
    { key: "Fighter", keywords: ["fighter", "ไฟเตอร์", "นักรบ"] },
    { key: "Paladin", keywords: ["paladin", "พาลาดิน", "นักรบศักดิ์สิทธิ์"] },
    { key: "Wizard", keywords: ["wizard", "วิซาร์ด", "จอมเวท"] },
    { key: "Rogue", keywords: ["rogue", "โร้ก", "จอมโจร", "ผู้ลอบเร้น"] },
    { key: "Cleric", keywords: ["cleric", "เคลริค", "นักบวช"] },
    { key: "Barbarian", keywords: ["barbarian", "บาร์บาเรียน", "นักรบคลั่ง"] },
    { key: "Bard", keywords: ["bard", "บาร์ด", "กวี"] },
    { key: "Druid", keywords: ["druid", "ดรูอิด", "ผู้พิทักษ์ธรรมชาติ"] },
    { key: "Monk", keywords: ["monk", "มงก์", "นักพรต"] },
    { key: "Ranger", keywords: ["ranger", "เรนเจอร์", "นายพราน"] },
    { key: "Sorcerer", keywords: ["sorcerer", "ซอร์เซอเรอร์", "ผู้ทรงเวทมนตร์"] },
    { key: "Warlock", keywords: ["warlock", "วอร์ล็อค", "นักรบเวท", "ผู้ทำพันธสัญญา"] }
];

function normalizeClassId(text) {
    if (!text) return null;
    const str = String(text).toLowerCase().trim();

    for (let i = 0; i < ALL_DND_CLASSES.length; i++) {
        if (ALL_DND_CLASSES[i].key.toLowerCase() === str) return ALL_DND_CLASSES[i].key;
    }

    if (str.includes("พาลาดิน") || str.includes("นักรบศักดิ์สิทธิ์")) return "Paladin";
    if (str.includes("วอร์ล็อค") || str.includes("นักรบเวท") || str.includes("พันธสัญญา")) return "Warlock";
    if (str.includes("บาร์บาเรียน") || str.includes("นักรบคลั่ง")) return "Barbarian";
    if (str.includes("จอมเวท") || str.includes("วิซาร์ด")) return "Wizard";
    if (str.includes("ผู้ทรงเวท") || str.includes("ซอร์เซอเรอร์")) return "Sorcerer";
    if (str.includes("นักบวช") || str.includes("เคลริค")) return "Cleric";
    if (str.includes("ผู้พิทักษ์ธรรมชาติ") || str.includes("ดรูอิด")) return "Druid";
    if (str.includes("กวี") || str.includes("บาร์ด")) return "Bard";
    if (str.includes("นักพรต") || str.includes("มงก์")) return "Monk";
    if (str.includes("นายพราน") || str.includes("เรนเจอร์")) return "Ranger";
    if (str.includes("จอมโจร") || str.includes("โร้ก") || str.includes("ลอบเร้น")) return "Rogue";
    if (str.includes("ไฟเตอร์") || str === "นักรบ" || str.includes("นักรบ (fighter)")) return "Fighter";

    for (let j = 0; j < ALL_DND_CLASSES.length; j++) {
        const cls = ALL_DND_CLASSES[j];
        for (let k = 0; k < cls.keywords.length; k++) {
            if (str === cls.keywords[k].toLowerCase()) return cls.key;
        }
    }
    return null;
}

function processFinalClasses(parsed) {
    const rawList = parsed.topClasses || [];
    const result = [];
    const usedKeys = {};
    const defaultPercentages = [84, 71, 58];

    for (let i = 0; i < rawList.length; i++) {
        const item = rawList[i];
        let matchedKey = null;

        if (typeof item === 'string') {
            matchedKey = normalizeClassId(item);
        } else if (typeof item === 'object' && item !== null) {
            matchedKey = normalizeClassId(item.id) || normalizeClassId(item.name) || normalizeClassId(item.class);
        }

        if (matchedKey && !usedKeys[matchedKey]) {
            usedKeys[matchedKey] = true;
            result.push({
                id: matchedKey,
                name: (item && typeof item === 'object' && item.name) || matchedKey.toUpperCase(),
                matchPercentage: (item && typeof item === 'object' && (item.matchPercentage || item.percentage || item.score)) || defaultPercentages[result.length] || 50,
                reason: (item && typeof item === 'object' && item.reason) || ""
            });
        }
        if (result.length >= 3) break;
    }

    const fallbackPool = ["Rogue", "Wizard", "Bard", "Druid", "Cleric", "Ranger", "Sorcerer", "Warlock", "Monk", "Barbarian", "Paladin", "Fighter"];
    for (let j = 0; j < fallbackPool.length && result.length < 3; j++) {
        const fbKey = fallbackPool[j];
        if (!usedKeys[fbKey]) {
            usedKeys[fbKey] = true;
            result.push({
                id: fbKey,
                name: fbKey.toUpperCase(),
                matchPercentage: defaultPercentages[result.length] || 50,
                reason: "สะท้อนจากสัญชาตญาณและการเลือกแก้ปัญหาในการผจญภัย"
            });
        }
    }
    return result;
}

const ALIGNMENT_MAP = {
    'lawfulgood': { 
        id: 'LawfulGood', 
        name: 'ผดุงธรรมเคร่งครัด (Lawful Good)',
        reason: 'คุณเลือกหนทางแห่งเกียรติยศและกฎเกณฑ์ ยึดมั่นในความถูกต้องและปกป้องผู้อ่อนแอด้วยความยุติธรรม'
    },
    'neutralgood': { 
        id: 'NeutralGood', 
        name: 'ผู้มีจิตเมตตา (Neutral Good)',
        reason: 'คุณเลือกหนทางแห่งความสงบ ใช้สมาธิ ปัญญา และจิตใจอันบริสุทธิ์ในการแก้ปัญหา หลีกเลี่ยงการทำลายล้างเพื่อความสงบสุขของโลก'
    },
    'chaoticgood': { 
        id: 'ChaoticGood', 
        name: 'ขบถผู้ทรงธรรม (Chaotic Good)',
        reason: 'คุณยึดมั่นในความดีและอิสรภาพ พร้อมกล้าท้าทายกฎเกณฑ์ที่ไม่เป็นธรรมเพื่อปกป้องความถูกต้องตามสัญชาตญาณ'
    },
    'lawfulneutral': { 
        id: 'LawfulNeutral', 
        name: 'ผู้ผดุงกฎเที่ยงแท้ (Lawful Neutral)',
        reason: 'คุณยึดถือระเบียบ วินัย และความเป็นกลางเป็นสำคัญ กระทำสิ่งต่างๆ ตามหลักการและข้อตกลงอย่างเคร่งครัด'
    },
    'trueneutral': { 
        id: 'TrueNeutral', 
        name: 'ผู้รักษาความสมดุล (True Neutral)',
        reason: 'คุณดำรงตนเป็นกลางและรักษาสมดุลแห่งธรรมชาติ ตัดสินใจตามความจำเป็นของสถานการณ์อย่างสมเหตุสมผล'
    },
    'chaoticneutral': { 
        id: 'ChaoticNeutral', 
        name: 'วิญญาณเสรี (Chaotic Neutral)',
        reason: 'คุณรักในอิสรภาพเหนือสิ่งอื่นใด ทำตามความปรารถนาและสัญชาตญาณส่วนตนโดยไม่ยอมให้พันธะใดมาผูกมัด'
    },
    'lawfulevil': { 
        id: 'LawfulEvil', 
        name: 'ผู้ครองอำนาจด้วยกฎ (Lawful Evil)',
        reason: 'คุณใช้ระเบียบ โครงสร้าง และกฎเกณฑ์เป็นเครื่องมือในการบรรลุเป้าหมายและแสวงหาอำนาจส่วนตน'
    },
    'neutralevil': { 
        id: 'NeutralEvil', 
        name: 'ผู้แสวงหาผลประโยชน์ (Neutral Evil)',
        reason: 'คุณมุ่งเน้นผลประโยชน์และความได้เปรียบของตนเองเป็นหลัก พร้อมทำทุกทางเพื่อให้บรรลุเป้าหมายโดยไร้ความลังเล'
    },
    'chaoticevil': { 
        id: 'ChaoticEvil', 
        name: 'ผู้สร้างความโกลาหล (Chaotic Evil)',
        reason: 'คุณทำตามอารมณ์ชั่ววูบ สัญชาตญาณดิบ และทำลายล้างกฎเกณฑ์ทั้งปวงเพื่อปลดปล่อยอำนาจแห่งความโกลาหล'
    }
};

function normalizeAlignment(alignment) {
    let rawStr = "";
    if (typeof alignment === 'string') {
        rawStr = alignment;
    } else if (alignment && typeof alignment === 'object') {
        rawStr = alignment.id || alignment.name || alignment.alignment || alignment.title || alignment.type || '';
    }

    const rawKey = String(rawStr).toLowerCase().replace(/[^a-z]/g, '');
    const matched = ALIGNMENT_MAP[rawKey];

    const givenReason = (alignment && typeof alignment === 'object' && alignment.reason && String(alignment.reason).trim())
        ? String(alignment.reason).trim()
        : (matched ? matched.reason : 'การตัดสินใจของคุณสะท้อนถึงเจตจำนงและจุดยืนอันโดดเด่นตลอดการผจญภัย');

    if (matched) {
        return {
            id: matched.id,
            name: matched.name,
            reason: givenReason
        };
    }

    return {
        id: 'NeutralGood',
        name: ALIGNMENT_MAP['neutralgood'].name,
        reason: givenReason
    };
}

// 2. ฟังก์ชันทำความสะอาด JSON ด้วย Regex (รับประกันว่าไม่พังแม้อ้าย AI ตอบข้อความขยะปนมา)
function extractAndParseJson(text) {
    if (!text) return {};
    try {
        let cleaned = text.trim();
        cleaned = cleaned.replace(/^```(json)?\s*/i, '');
        cleaned = cleaned.replace(/\s*```$/i, '');
        return JSON.parse(cleaned.trim());
    } catch (e) {
        // ถ้า parse ตรงๆ พัง ให้หา pattern {} ที่คลุม JSON ก้อนใหญ่สุดมา parse อีกรอบ
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error("Cannot extract valid JSON from Gemini output.");
    }
}

const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

// ============================================================================
// MAIN CHAT ENDPOINT
// ============================================================================
router.post('/chat', async (req, res) => {
    try {
        const chatHistory = req.body.chatHistory || [];
        const currentTurn = Number(req.body.currentTurn) || 1;
        const actionText = req.body.actionText || null;

        let userMessage;
        if (currentTurn === 1 && !actionText) {
            userMessage = `${SYSTEM_PROMPT}\n\n==================================================\nINITIATION\n==================================================\nStart Scene 1 ("questionNumber": 1). Create a high-tension, atmospheric opening scenario in valid raw JSON. Make the 4 choices psychologically nuanced (BLIND CHOICES).`;
        } else if (currentTurn <= 10) {
            userMessage = `Player chose: "${actionText}"\n\n[SYSTEM INSTRUCTION] Turn ${currentTurn} of 10. Generate Scene ${currentTurn} ("questionNumber": ${currentTurn}). Create a COMPLETELY DIFFERENT scenario type from previous scenes. Make 4 choices that are philosophically rich and psychologically layered (BLIND CHOICES). Do NOT set isFinished: true. Reply ONLY in raw JSON.`;
        } else {
            userMessage = `Player chose: "${actionText}"\n\n[SYSTEM INSTRUCTION] All 10 scenes answered! Final Revelation (Turn 11). Evaluate all 10 player choices holistically against ALL 12 D&D classes AND determine their true D&D 9-Alignment (LawfulGood, NeutralGood, ChaoticGood, LawfulNeutral, TrueNeutral, ChaoticNeutral, LawfulEvil, NeutralEvil, ChaoticEvil). Set "isFinished": true, "choices": [], "questionNumber": 11, and provide "narrative", "detailedAnalysis", "alignment" ({ "id": "AlignmentKey", "name": "ชื่อไทย (English Title)", "reason": "เหตุผลวิเคราะห์ภาษาไทย 2-3 บรรทัด" }), and "topClasses" (3 matched classes). Reply ONLY in raw JSON.`;
        }

        const validHistory = [];
        for (let i = 0; i < chatHistory.length; i++) {
            const msg = chatHistory[i];
            if (msg.role === 'user' || msg.role === 'model') {
                if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === msg.role) continue;
                validHistory.push(msg);
            }
        }
        while (validHistory.length > 0 && validHistory[0].role !== 'user') validHistory.shift();

        const chat = model.startChat({
            history: validHistory,
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await chat.sendMessage(userMessage);
        const responseText = result.response.text();

        const parsed = extractAndParseJson(responseText);

        if (currentTurn <= 10) {
            parsed.questionNumber = currentTurn;
            parsed.isFinished = false;
            parsed.topClasses = [];
            parsed.detailedAnalysis = "";
            // ป้องกันแอพจอขาว: ถ้า AI ลืมส่ง choices มา ให้ใช้ Fallback ทันที
            if (!parsed.choices || !Array.isArray(parsed.choices) || parsed.choices.length < 4) {
                parsed.choices = [
                    "เผชิญหน้ากับความท้าทายด้วยสติปัญญาและการวิเคราะห์เหตุผล",
                    "สงวนท่าทีและประเมินสถานการณ์อย่างเงียบเชียบเพื่อหาจุดอ่อน",
                    "ใช้เล่ห์เหลี่ยมและการเจรจาต่อรองเพื่อพลิกวิกฤตให้เป็นโอกาส",
                    "ยึดมั่นในหลักการและพร้อมเสียสละตนเองเพื่อปกป้องสิ่งที่ถูกต้อง"
                ];
            }
        } else {
            parsed.isFinished = true;
            parsed.choices = [];
            parsed.questionNumber = 11;
            parsed.topClasses = processFinalClasses(parsed);
            parsed.alignment = normalizeAlignment(parsed.alignment);
        }

        res.json(parsed);
    } catch (error) {
        console.error("Gemini API Error:", error.message || error);
        res.status(500).json({ error: "Failed to generate DM response", details: error.message });
    }
});

// ============================================================================
// LIVE AI ANALYSIS ENDPOINT
// ============================================================================
router.post('/analyze-breakdown', async (req, res) => {
    try {
        const chatHistory = req.body.chatHistory || [];
        let historyPrompt = "Player adventure history (10 scenes):\n\n";

        if (Array.isArray(chatHistory)) {
            let qCount = 1;
            for (let i = 0; i < chatHistory.length; i++) {
                const msg = chatHistory[i];
                if (msg.sender === 'dm') {
                    historyPrompt += `Scene ${qCount} (DM): ${msg.text}\n`;
                } else if (msg.sender === 'user') {
                    historyPrompt += `Player Action: ${msg.text}\n\n`;
                    qCount++;
                }
            }
        }

        const breakdownPrompt = `${historyPrompt}\n[SYSTEM INSTRUCTION] Analyze all 10 scenes individually. For each scene provide:
1. narrativePrompt: Thai summary of scenario (1-2 lines)
2. userChoice: Player's action
3. alignmentFocus: Moral impact in Thai (e.g. 'ผดุงธรรมเคร่งครัด (+เกียรติยศ)')
4. analysis: Deep psychological Thai literary prose (3-4 lines) — respectful unless player trolled
5. influencedClasses: English class IDs (e.g. ['Rogue','Bard'])

Return ONLY valid raw JSON:
{"breakdown":[{"questionNumber":1,"sceneTitle":"ชื่อฉากไทย","narrativePrompt":"...","userChoice":"...","alignmentFocus":"...","analysis":"...","influencedClasses":["Rogue"]}]}`;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: breakdownPrompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });

        const responseText = result.response.text();
        const parsed = extractAndParseJson(responseText);

        // ป้องกัน Error ในหน้า Breakdown: ถ้า AI ไม่คืนค่า array breakdown มาให้
        if (!parsed.breakdown || !Array.isArray(parsed.breakdown)) {
            parsed.breakdown = [];
        }

        res.json(parsed);
    } catch (error) {
        console.error("Gemini Analyze Breakdown Error:", error.message || error);
        res.status(500).json({ error: "Failed to generate live breakdown", details: error.message });
    }
});

module.exports = router;