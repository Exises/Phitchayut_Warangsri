import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { unlockAchievementsForRun, getUserStorageKey } from '../utils/achievementSystem';

var CLASS_INFO = {
    Barbarian: { name: 'BARBARIAN', desc: 'นักรบผู้บ้าคลั่งที่อาศัยพละกำลังและความโกรธในการบดขยี้ศัตรู', icon: 'fa-gavel' },
    Bard: { name: 'BARD', desc: 'ศิลปินผู้ใช้บทเพลงและเวทมนตร์ในการสนับสนุนเพื่อนและป่วนศัตรู', icon: 'fa-guitar' },
    Cleric: { name: 'CLERIC', desc: 'นักบวชผู้รับใช้ทวยเทพ มีพลังในการรักษาและปกป้องพวกพ้อง', icon: 'fa-cross' },
    Druid: { name: 'DRUID', desc: 'ผู้พิทักษ์ธรรมชาติที่สามารถแปลงร่างเป็นสัตว์และควบคุมสภาพแวดล้อมได้', icon: 'fa-leaf' },
    Fighter: { name: 'FIGHTER', desc: 'นักรบผู้เชี่ยวชาญการใช้อาวุธและยุทธวิธีในการรบทุกรูปแบบ', icon: 'fa-shield-halved' },
    Monk: { name: 'MONK', desc: 'นักสู้มือเปล่าผู้ฝึกฝนร่างกายและจิตวิญญาณจนถึงขีดสุด', icon: 'fa-yin-yang' },
    Paladin: { name: 'PALADIN', desc: 'อัศวินศักดิ์สิทธิ์ผู้ผดุงความยุติธรรม พร้อมด้วยพลังเวทและเกราะหนา', icon: 'fa-khanda' },
    Ranger: { name: 'RANGER', desc: 'นักล่าผู้เชี่ยวชาญการเอาชีวิตรอดในป่าและการโจมตีระยะไกล', icon: 'fa-crosshairs' },
    Rogue: { name: 'ROGUE', desc: 'ผู้เชี่ยวชาญการลอบเร้นและการโจมตีจุดตายอย่างเงียบเชียบ', icon: 'fa-mask' },
    Sorcerer: { name: 'SORCERER', desc: 'ผู้มีสายเลือดเวทมนตร์ ปลดปล่อยพลังคาถาอันรุนแรงโดยสัญชาตญาณ', icon: 'fa-fire' },
    Warlock: { name: 'WARLOCK', desc: 'ผู้ทำพันธสัญญากับตัวตนลึกลับเพื่อแลกกับพลังเวทมนตร์อันมืดมิด', icon: 'fa-eye' },
    Wizard: { name: 'WIZARD', desc: 'จอมเวทผู้ศึกษาตำราเวทมนตร์อย่างลึกซึ้ง มีคาถาหลากหลายที่สุด', icon: 'fa-hat-wizard' }
};

function getClassInfo(classId) {
    if (CLASS_INFO[classId]) return CLASS_INFO[classId];
    var keys = Object.keys(CLASS_INFO);
    for (var i = 0; i < keys.length; i++) {
        if (keys[i].toLowerCase() === (classId || '').toLowerCase()) {
            return CLASS_INFO[keys[i]];
        }
    }
    return { name: (classId || 'UNKNOWN').toUpperCase(), desc: 'คลาสในโลก D&D 5e', icon: 'fa-question' };
}

function ClassTestResult() {
    var navigate = useNavigate();
    var location = useLocation();
    var state = location.state;

    var [showAllStats, setShowAllStats] = useState(false);
    var [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);
    var [expandedQuestion, setExpandedQuestion] = useState(null);
    var [aiBreakdownList, setAiBreakdownList] = useState(null);
    var [isAnalyzingAI, setIsAnalyzingAI] = useState(false);

    useEffect(function() {
        window.scrollTo(0, 0);
        if (state && state.topClasses && state.topClasses.length > 0) {
            try {
                var histKey = getUserStorageKey('dnd_destiny_history');
                var existingRaw = localStorage.getItem(histKey);
                if (!existingRaw) {
                    var legacyRaw = localStorage.getItem('dnd_destiny_history');
                    if (legacyRaw) {
                        localStorage.setItem(histKey, legacyRaw);
                        existingRaw = legacyRaw;
                    }
                }
                var historyArr = existingRaw ? JSON.parse(existingRaw) : [];
                var currentRunId = state.runTimestamp || (Date.now().toString());
                
                var alreadyExists = historyArr.some(function(item) {
                    return item.id === currentRunId || (item.narrative && item.narrative === state.narrative);
                });

                if (!alreadyExists) {
                    var newEntry = {
                        id: currentRunId,
                        date: new Date().toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                        topClass: enriched[0],
                        runnerUps: enriched.slice(1, 3),
                        alignment: alignment,
                        analysis: analysis,
                        narrative: narrative,
                        state: state
                    };
                    historyArr.unshift(newEntry);
                    if (historyArr.length > 20) historyArr = historyArr.slice(0, 20);
                    localStorage.setItem(histKey, JSON.stringify(historyArr));
                }
                if (enriched && enriched.length > 0 && enriched[0].id) {
                    unlockAchievementsForRun(enriched[0].id);
                }
            } catch (e) {
                console.error("Failed to save destiny history:", e);
            }
        }
    }, [state]);

    if (!state || !state.topClasses || state.topClasses.length < 1) {
        return (
            <div className="class-test-page">
                <div className="test-result-container animate-fade-in" style={{ textAlign: 'center', padding: '60px' }}>
                    <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '3rem', color: 'var(--color-red)', marginBottom: '20px' }}></i>
                    <h2 style={{ color: 'var(--color-red)', marginBottom: '15px' }}>ไม่พบข้อมูลผลลัพธ์</h2>
                    <p style={{ color: 'var(--color-gray)', marginBottom: '30px' }}>กรุณาทำแบบทดสอบให้ครบก่อนเข้าหน้านี้</p>
                    <button className="btn-result-primary" onClick={() => navigate('/class-test')}>
                        <i className="fa-solid fa-arrow-left"></i> กลับหน้าทดสอบ
                    </button>
                </div>
            </div>
        );
    }

    var topClassesRaw = state.topClasses;
    
    var alignFallbackMap = {
        'lawfulgood': { id: 'LawfulGood', name: 'ผดุงธรรมเคร่งครัด (Lawful Good)', reason: 'คุณเลือกหนทางแห่งเกียรติยศและกฎเกณฑ์ ยึดมั่นในความถูกต้องและปกป้องผู้อ่อนแอด้วยความยุติธรรม' },
        'neutralgood': { id: 'NeutralGood', name: 'ผู้มีจิตเมตตา (Neutral Good)', reason: 'คุณเลือกหนทางแห่งความสงบ ใช้สมาธิ ปัญญา และจิตใจอันบริสุทธิ์ในการแก้ปัญหา หลีกเลี่ยงการทำลายล้างเพื่อความสงบสุขของโลก' },
        'chaoticgood': { id: 'ChaoticGood', name: 'ขบถผู้ทรงธรรม (Chaotic Good)', reason: 'คุณยึดมั่นในความดีและอิสรภาพ พร้อมกล้าท้าทายกฎเกณฑ์ที่ไม่เป็นธรรมเพื่อปกป้องความถูกต้องตามสัญชาตญาณ' },
        'lawfulneutral': { id: 'LawfulNeutral', name: 'ผู้ผดุงกฎเที่ยงแท้ (Lawful Neutral)', reason: 'คุณยึดถือระเบียบ วินัย และความเป็นกลางเป็นสำคัญ กระทำสิ่งต่างๆ ตามหลักการและข้อตกลงอย่างเคร่งครัด' },
        'trueneutral': { id: 'TrueNeutral', name: 'ผู้รักษาความสมดุล (True Neutral)', reason: 'คุณดำรงตนเป็นกลางและรักษาสมดุลแห่งธรรมชาติ ตัดสินใจตามความจำเป็นของสถานการณ์อย่างสมเหตุสมผล' },
        'chaoticneutral': { id: 'ChaoticNeutral', name: 'วิญญาณเสรี (Chaotic Neutral)', reason: 'คุณรักในอิสรภาพเหนือสิ่งอื่นใด ทำตามความปรารถนาและสัญชาตญาณส่วนตนโดยไม่ยอมให้พันธะใดมาผูกมัด' },
        'lawfulevil': { id: 'LawfulEvil', name: 'ผู้ครองอำนาจด้วยกฎ (Lawful Evil)', reason: 'คุณใช้ระเบียบ โครงสร้าง และกฎเกณฑ์เป็นเครื่องมือในการบรรลุเป้าหมายและแสวงหาอำนาจส่วนตน' },
        'neutralevil': { id: 'NeutralEvil', name: 'ผู้แสวงหาผลประโยชน์ (Neutral Evil)', reason: 'คุณมุ่งเน้นผลประโยชน์และความได้เปรียบของตนเองเป็นหลัก พร้อมทำทุกทางเพื่อให้บรรลุเป้าหมายโดยไร้ความลังเล' },
        'chaoticevil': { id: 'ChaoticEvil', name: 'ผู้สร้างความโกลาหล (Chaotic Evil)', reason: 'คุณทำตามอารมณ์ชั่ววูบ สัญชาตญาณดิบ และทำลายล้างกฎเกณฑ์ทั้งปวงเพื่อปลดปล่อยอำนาจแห่งความโกลาหล' }
    };

    var rawAlign = state.alignment || {};
    var rawStr = typeof rawAlign === 'string' ? rawAlign : (rawAlign.id || rawAlign.name || rawAlign.alignment || rawAlign.title || '');
    var alignKey = String(rawStr).toLowerCase().replace(/[^a-z]/g, '');
    var matchedAlignPreset = alignFallbackMap[alignKey] || alignFallbackMap['neutralgood'];

    var alignment = {
        id: matchedAlignPreset.id,
        name: String((typeof rawAlign === 'object' && rawAlign.name && rawAlign.name.length > 3) ? rawAlign.name : matchedAlignPreset.name).normalize('NFC'),
        reason: String((typeof rawAlign === 'object' && rawAlign.reason && rawAlign.reason.trim()) ? rawAlign.reason : matchedAlignPreset.reason).normalize('NFC')
    };

    var analysis = String(state.analysis || '').normalize('NFC');
    var narrative = String(state.narrative || '').normalize('NFC');
    var chatHistory = state.chatHistory || [];

    // ========== ENRICHED TOP 3 ==========
    var enriched = topClassesRaw.map(function(cls, idx) {
        var info = getClassInfo(cls.id || cls.name);
        return {
            id: cls.id || cls.name || 'Unknown',
            name: info.name,
            desc: info.desc,
            icon: info.icon,
            matchPercentage: cls.matchPercentage || cls.score || [85, 70, 55][idx] || 50,
            reason: String(cls.reason || '').normalize('NFC')
        };
    });

    // Fallback if less than 3
    var fallbackPool = ['Rogue', 'Bard', 'Druid', 'Cleric', 'Ranger', 'Sorcerer', 'Warlock', 'Monk', 'Barbarian', 'Paladin', 'Wizard', 'Fighter'];
    var usedIds = {};
    enriched.forEach(function(e) { usedIds[e.id.toLowerCase()] = true; });
    var fbIdx = 0;
    while (enriched.length < 3 && fbIdx < fallbackPool.length) {
        var fbKey = fallbackPool[fbIdx];
        if (!usedIds[fbKey.toLowerCase()]) {
            usedIds[fbKey.toLowerCase()] = true;
            var fbInfo = CLASS_INFO[fbKey];
            enriched.push({
                id: fbKey, name: fbInfo.name, desc: fbInfo.desc, icon: fbInfo.icon,
                matchPercentage: [85, 70, 55][enriched.length] || 50, reason: ''
            });
        }
        fbIdx++;
    }

    // ========== ALL 12 CLASSES (CONSISTENT WITH TOP 3) ==========
    var allClassList = [];
    var lowestTop3Score = enriched[enriched.length - 1].matchPercentage;
    var unrankedCeiling = Math.max(1, lowestTop3Score - 5);
    var allKeys = Object.keys(CLASS_INFO);
    var unrankedCount = allKeys.length - enriched.length;
    var step = unrankedCount > 1 ? Math.floor(unrankedCeiling / (unrankedCount + 1)) : 3;

    allClassList = allKeys.map(function(k) {
        var cInfo = CLASS_INFO[k];
        var matchedEnriched = null;
        for (var m = 0; m < enriched.length; m++) {
            if (enriched[m].id.toLowerCase() === k.toLowerCase()) { matchedEnriched = enriched[m]; break; }
        }
        return {
            id: k, name: cInfo.name, icon: cInfo.icon,
            matchPercentage: matchedEnriched ? matchedEnriched.matchPercentage : -1
        };
    });

    var unrankedItems = allClassList.filter(function(c) { return c.matchPercentage === -1; });
    for (var u = 0; u < unrankedItems.length; u++) {
        unrankedItems[u].matchPercentage = Math.max(2, unrankedCeiling - (u * step));
    }
    allClassList.sort(function(a, b) { return b.matchPercentage - a.matchPercentage; });

    // ========== LIVE AI BREAKDOWN ==========
    var clientScenePairs = [];
    if (chatHistory && chatHistory.length > 0) {
        var tempNarrative = '';
        for (var h = 0; h < chatHistory.length; h++) {
            var msg = chatHistory[h];
            if (msg.sender === 'dm') { tempNarrative = msg.text || ''; }
            else if (msg.sender === 'user') {
                clientScenePairs.push({ narrativePrompt: tempNarrative, text: msg.text || '' });
                tempNarrative = '';
            }
        }
    }

    function toggleBreakdown() {
        if (!showDetailedBreakdown && !aiBreakdownList && !isAnalyzingAI) {
            setIsAnalyzingAI(true);
            fetch('http://localhost:5000/api/dm/analyze-breakdown', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatHistory: chatHistory })
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (data && data.breakdown && Array.isArray(data.breakdown)) {
                    var normalizedBreakdown = data.breakdown.map(function(item, idx) {
                        var fallbackNarrative = (clientScenePairs[idx] && clientScenePairs[idx].narrativePrompt) || '';
                        return {
                            questionNumber: item.questionNumber || (idx + 1),
                            sceneTitle: String(item.sceneTitle || ('ฉากการผจญภัยที่ ' + (idx + 1))).normalize('NFC'),
                            narrativePrompt: String(item.narrativePrompt || fallbackNarrative).normalize('NFC'),
                            userChoice: String(item.userChoice || item.text || '').normalize('NFC'),
                            alignmentFocus: String(item.alignmentFocus || '').normalize('NFC'),
                            analysis: String(item.analysis || '').normalize('NFC'),
                            influencedClasses: item.influencedClasses || []
                        };
                    });
                    setAiBreakdownList(normalizedBreakdown);
                } else {
                    setAiBreakdownList(clientScenePairs.map(function(pair, idx) {
                        return { questionNumber: idx + 1, sceneTitle: 'ฉากการผจญภัยที่ ' + (idx + 1), narrativePrompt: pair.narrativePrompt, userChoice: pair.text, alignmentFocus: '', analysis: 'ไม่สามารถวิเคราะห์ได้', influencedClasses: [] };
                    }));
                }
                setIsAnalyzingAI(false);
            })
            .catch(function() {
                setAiBreakdownList(clientScenePairs.map(function(pair, idx) {
                    return { questionNumber: idx + 1, sceneTitle: 'ฉากการผจญภัยที่ ' + (idx + 1), narrativePrompt: pair.narrativePrompt, userChoice: pair.text, alignmentFocus: '', analysis: 'ไม่สามารถวิเคราะห์ได้ (กรุณาลองใหม่)', influencedClasses: [] };
                }));
                setIsAnalyzingAI(false);
            });
        }
        setShowDetailedBreakdown(!showDetailedBreakdown);
    }

    var displayBreakdown = aiBreakdownList || clientScenePairs.map(function(pair, idx) {
        return { questionNumber: idx + 1, sceneTitle: 'ฉากที่ ' + (idx + 1), narrativePrompt: pair.narrativePrompt, userChoice: pair.text, alignmentFocus: '', analysis: 'กดปุ่มเพื่อให้ AI วิเคราะห์', influencedClasses: [] };
    });

    // ========== DISPLAY LIST (top 3 or all 12) ==========
    var displayList = showAllStats ? allClassList : allClassList.slice(0, 3);

    return (
        <div className="class-test-page">
            <div className="test-result-container animate-fade-in">
                {/* YOUR DESTINY HEADER */}
                <div className="result-header">
                    <i className="fa-solid fa-hat-wizard"></i>
                    <h2>YOUR DESTINY</h2>
                    <p>คลาสที่ถูกถักทอจากทางเลือกของคุณ</p>
                </div>

                {/* RANK 1 MAIN CARD */}
                <div className="result-cards-wrapper">
                    <div className="result-card-main">
                        <span className="rank-badge">★ RANK 1 — BEST MATCH</span>
                        <div className="result-icon-main">
                            <i className={"fa-solid " + enriched[0].icon}></i>
                        </div>
                        <h3 className="result-class-name-main">{enriched[0].name}</h3>
                        <p className="result-class-desc-main">{enriched[0].desc}</p>
                        {enriched[0].reason && (
                            <div className="hero-reason-box">
                                <i className="fa-solid fa-quote-left"></i>
                                <span>{enriched[0].reason}</span>
                            </div>
                        )}
                    </div>

                    {/* RANK 2 & 3 SUB CARDS */}
                    <div className="result-sub-cards">
                        {enriched.slice(1, 3).map(function(cls, idx) {
                            return (
                                <div key={cls.id} className="result-card-sub">
                                    <div className="result-card-sub-left">
                                        <i className={"fa-solid " + cls.icon}></i>
                                    </div>
                                    <div className="result-card-sub-right">
                                        <div className="sub-rank-header">
                                            <span className="sub-rank-text">RANK {idx + 2}</span>
                                            <span className="sub-percent-badge">{cls.matchPercentage}%</span>
                                        </div>
                                        <h4>{cls.name}</h4>
                                        <p>{cls.desc}</p>
                                        {cls.reason && <span className="sub-reason-text">{cls.reason}</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* STATISTICAL COMPATIBILITY ANALYSIS */}
                <div className="dm-result-section">
                    <div className="section-title-wrapper">
                        <h3 className="dm-result-section-title">
                            <i className="fa-solid fa-chart-bar"></i> STATISTICAL COMPATIBILITY ANALYSIS
                        </h3>
                        <button className="toggle-stats-btn" onClick={() => setShowAllStats(!showAllStats)}>
                            {showAllStats ? (
                                <><i className="fa-solid fa-ranking-star"></i> แสดงเฉพาะ 3 อันดับแรก</>
                            ) : (
                                <><i className="fa-solid fa-chart-simple"></i> แสดงสถิติทั้ง 12 อาชีพ</>
                            )}
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {displayList.map(function(cls, idx) {
                            return (
                                <div key={cls.id} className="dm-compat-row">
                                    <div className="dm-compat-label">
                                        <i className={"fa-solid " + cls.icon}></i>
                                        <span>{cls.name}</span>
                                    </div>
                                    <div className="dm-compat-bar-bg">
                                        <div 
                                            className="dm-compat-bar-fill" 
                                            style={{ 
                                                width: cls.matchPercentage + '%',
                                                background: idx === 0 ? 'linear-gradient(90deg, #711a19, #dc2626)' : (idx < 3 ? 'linear-gradient(90deg, #b91c1c, #f59e0b)' : '#94a3b8')
                                            }}
                                        ></div>
                                    </div>
                                    <span className="dm-compat-percent">{cls.matchPercentage}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* D&D ALIGNMENT SECTION */}
                <div className="dm-result-section">
                    <h3 className="dm-result-section-title">
                        <i className="fa-solid fa-compass"></i> D&D ALIGNMENT (เข็มทิศทัศนคติและจุดยืนตัวตน)
                    </h3>
                    <div className="alignment-container">
                        <div className="alignment-badge-box">
                            <div className="alignment-icon-header">
                                <i className="fa-solid fa-scale-balanced"></i>
                                <span className="alignment-name-title">{String(alignment.name || 'Neutral Good').normalize('NFC')}</span>
                            </div>
                            <p className="alignment-reason">{String(alignment.reason || '').normalize('NFC')}</p>
                        </div>

                        <div className="alignment-3x3-grid">
                            {[
                                { id: 'LawfulGood', title: 'Lawful Good', label: 'ผดุงธรรมเคร่งครัด' },
                                { id: 'NeutralGood', title: 'Neutral Good', label: 'ผู้มีจิตเมตตา' },
                                { id: 'ChaoticGood', title: 'Chaotic Good', label: 'ขบถผู้ทรงธรรม' },
                                { id: 'LawfulNeutral', title: 'Lawful Neutral', label: 'ผู้ผดุงกฎเที่ยงแท้' },
                                { id: 'TrueNeutral', title: 'True Neutral', label: 'ผู้รักษาความสมดุล' },
                                { id: 'ChaoticNeutral', title: 'Chaotic Neutral', label: 'วิญญาณเสรี' },
                                { id: 'LawfulEvil', title: 'Lawful Evil', label: 'ผู้ครองอำนาจด้วยกฎ' },
                                { id: 'NeutralEvil', title: 'Neutral Evil', label: 'ผู้แสวงหาผลประโยชน์' },
                                { id: 'ChaoticEvil', title: 'Chaotic Evil', label: 'ผู้สร้างความโกลาหล' }
                            ].map(function(gridItem) {
                                var isCurrent = gridItem.id.toLowerCase() === alignment.id.toLowerCase();
                                return (
                                    <div 
                                        key={gridItem.id} 
                                        className={"alignment-grid-cell " + (isCurrent ? 'active-alignment' : '')}
                                        style={isCurrent ? {
                                            background: '#8b0000',
                                            border: '2px solid #5a0000',
                                            color: '#ffffff',
                                            boxShadow: '0 4px 12px rgba(139, 0, 0, 0.35)',
                                            transform: 'translateY(-2px)'
                                        } : {}}
                                    >
                                        <span className="grid-cell-title" style={isCurrent ? { color: '#ffffff' } : {}}>{gridItem.title}</span>
                                        <span className="grid-cell-sub" style={isCurrent ? { color: '#fef08a' } : {}}>{gridItem.label}</span>
                                        {isCurrent && (
                                            <span className="current-match-pin">
                                                <i className="fa-solid fa-star"></i> ผลของคุณ
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* DETAILED BREAKDOWN */}
                <div className="dm-result-section">
                    <button className="btn-detailed-breakdown" onClick={toggleBreakdown}>
                        <i className="fa-solid fa-magnifying-glass-chart"></i>
                        {showDetailedBreakdown ? ' ปิดบทวิเคราะห์รายข้อ' : ' 🔍 ดูบทวิเคราะห์สถิติและการตอบคำถามรายข้อแบบละเอียด (10 ฉาก)'}
                    </button>

                    {showDetailedBreakdown && (
                        <div className="detailed-breakdown-container animate-slide-up">
                            <h4 className="breakdown-header-title">
                                <i className="fa-solid fa-list-check"></i> บทวิเคราะห์พฤติกรรมและการตัดสินใจรายข้อ (Scene Breakdown)
                            </h4>
                            <p className="breakdown-subtitle">เจาะลึกสถิติและจิตวิทยาเรียลไทม์ โดย The Grand Weaver วิเคราะห์เจาะลึกข้อต่อข้อ:</p>

                            {isAnalyzingAI ? (
                                <div className="ai-analyzing-loader">
                                    <i className="fa-solid fa-brain fa-spin"></i>
                                    <div>
                                        <strong>The Grand Weaver กำลังวิเคราะห์ประวัติการเลือกทั้ง 10 ฉากของคุณอย่างลึกซึ้ง...</strong>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', opacity: 0.8 }}>กระบวนการนี้ใช้เวลาประมาณ 3-5 วินาทีในการประมวลผลทั้ง 10 ฉากพร้อมกันครั้งเดียว</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="breakdown-list">
                                    {displayBreakdown.map(function(item, idx) {
                                        var isExpanded = expandedQuestion === idx || (expandedQuestion === null && idx === 0);
                                        return (
                                            <div key={idx} className={"breakdown-card " + (isExpanded ? 'active' : '')}>
                                                <div className="breakdown-card-header" onClick={() => setExpandedQuestion(isExpanded ? -1 : idx)}>
                                                    <div className="header-left">
                                                        <span className="scene-num-badge">ฉากที่ {item.questionNumber || (idx + 1)}</span>
                                                        <span className="scene-title-text">{item.sceneTitle || ('ฉากการผจญภัยที่ ' + (idx + 1))}</span>
                                                    </div>
                                                    <i className={"fa-solid " + (isExpanded ? 'fa-chevron-up' : 'fa-chevron-down')}></i>
                                                </div>

                                                {isExpanded && (
                                                    <div className="breakdown-card-body animate-fade-in">
                                                        {item.narrativePrompt && (
                                                            <div className="breakdown-field">
                                                                <strong className="field-label"><i className="fa-solid fa-scroll"></i> สถานการณ์ที่เผชิญหน้า:</strong>
                                                                <p className="field-text narrative-text">{item.narrativePrompt}</p>
                                                            </div>
                                                        )}
                                                        <div className="breakdown-field">
                                                            <strong className="field-label"><i className="fa-solid fa-user-check"></i> การตัดสินใจของคุณ:</strong>
                                                            <p className="field-text choice-text">"{item.userChoice || item.text}"</p>
                                                        </div>
                                                        {item.alignmentFocus && (
                                                            <div className="breakdown-field">
                                                                <strong className="field-label"><i className="fa-solid fa-compass"></i> สายคุณธรรมประจำฉากนี้ (Alignment Focus):</strong>
                                                                <p className="field-text alignment-focus-text">{item.alignmentFocus}</p>
                                                            </div>
                                                        )}
                                                        <div className="breakdown-field">
                                                            <strong className="field-label"><i className="fa-solid fa-brain"></i> วิเคราะห์เจาะลึกเชิงจิตวิทยาและยุทธวิธีประจำข้อนี้:</strong>
                                                            <p className="field-text analysis-text">{item.analysis}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* PSYCHOLOGICAL ANALYSIS */}
                {analysis && (
                    <div className="dm-result-section">
                        <h3 className="dm-result-section-title">
                            <i className="fa-solid fa-brain"></i> PSYCHOLOGICAL ANALYSIS (บทวิเคราะห์ภาพรวม)
                        </h3>
                        <div className="dm-analysis-box">
                            <p>{analysis}</p>
                        </div>
                    </div>
                )}

                {/* YOUR STORY */}
                {narrative && (
                    <div className="dm-result-section">
                        <h3 className="dm-result-section-title">
                            <i className="fa-solid fa-book-open"></i> YOUR STORY (มหากาพย์การผจญภัย)
                        </h3>
                        <div className="dm-story-box">
                            <p>{narrative}</p>
                        </div>
                    </div>
                )}

                {/* ACTIONS */}
                <div className="result-actions" style={{ marginTop: '40px' }}>
                    <button className="btn-result-primary" onClick={() => navigate('/workshop')}>
                        <i className="fa-solid fa-wand-magic-sparkles"></i> สร้างตัวละครใน Workshop
                    </button>
                    <button className="btn-result-secondary" onClick={() => navigate('/class-test-dm')}>
                        <i className="fa-solid fa-rotate-right"></i> เล่นโหมด AI DM อีกครั้ง
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ClassTestResult;
