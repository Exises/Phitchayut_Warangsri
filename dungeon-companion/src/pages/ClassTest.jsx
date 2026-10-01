import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CLASS_INFO = {
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

function ClassTest() {
    const navigate = useNavigate();
    const [quizData, setQuizData] = useState(null);
    const [currentState, setCurrentState] = useState('start'); // start, quiz, result
    const [currentQuestionId, setCurrentQuestionId] = useState('Q1_Main');
    const [questionCount, setQuestionCount] = useState(1);
    const [selectedOption, setSelectedOption] = useState(null);
    const [scores, setScores] = useState({
        Barbarian: 0, Bard: 0, Cleric: 0, Druid: 0, Fighter: 0, Monk: 0,
        Paladin: 0, Ranger: 0, Rogue: 0, Sorcerer: 0, Warlock: 0, Wizard: 0
    });
    const [topClasses, setTopClasses] = useState([]);
    const [showAccessDenied, setShowAccessDenied] = useState(false);

    const handleAIDMClick = () => {
        const user = localStorage.getItem('dnd_user');
        if (!user) {
            setShowAccessDenied(true);
        } else {
            navigate('/class-test-dm');
        }
    };

    useEffect(() => {
        fetch('/data/dnd_quiz.json')
            .then(response => response.json())
            .then(data => setQuizData(data))
            .catch(error => console.error("Error loading quiz data:", error));
    }, []);

    const handleStart = () => {
        setCurrentState('quiz');
        setCurrentQuestionId('Q1_Main');
        setQuestionCount(1);
        setSelectedOption(null);
        setScores({
            Barbarian: 0, Bard: 0, Cleric: 0, Druid: 0, Fighter: 0, Monk: 0,
            Paladin: 0, Ranger: 0, Rogue: 0, Sorcerer: 0, Warlock: 0, Wizard: 0
        });
    };

    const handleSelectOption = (choice) => {
        setSelectedOption(choice);
    };

    const handleConfirmAnswer = () => {
        if (!selectedOption) return;
        
        const choice = selectedOption;
        
        // อัปเดตคะแนน
        if (choice.scores) {
            setScores(prev => {
                const newScores = { ...prev };
                for (const [className, points] of Object.entries(choice.scores)) {
                    newScores[className] += points;
                }
                return newScores;
            });
        }

        // รีเซ็ตตัวเลือกสำหรับข้อถัดไป
        setSelectedOption(null);

        // ไปข้อถัดไปหรือจบ
        if (choice.next_id === 'END') {
            calculateResults();
        } else {
            setCurrentQuestionId(choice.next_id);
            setQuestionCount(prev => prev + 1);
        }
    };

    const calculateResults = () => {
        // แปลงเป็น Array เพื่อจัดเรียง
        let resultsArray = Object.entries(scores).map(([className, score]) => ({
            className,
            score
        }));

        // กรองเอาเฉพาะคลาสที่มีคะแนน > 0 ก่อน (ถ้าจำเป็น แต่เรียงทั้งหมดดีกว่า)
        // จัดเรียงคะแนนจากมากไปน้อย
        // Tie-breaker: ถ้าคะแนนเท่ากัน ใช้สุ่ม Math.random() เพื่อสร้าง Destiny Roll
        resultsArray.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            } else {
                return Math.random() - 0.5; // สุ่มสลับตำแหน่ง
            }
        });

        const top3 = resultsArray.slice(0, 3).map(item => ({
            ...CLASS_INFO[item.className],
            id: item.className,
            score: item.score
        }));

        setTopClasses(top3);
        setCurrentState('result');
    };

    if (!quizData) {
        return <div className="class-test-loading">กำลังเตรียมบททดสอบ...</div>;
    }

    return (
        <div className="class-test-page">
            {/* Access Denied Modal for Guest */}
            {showAccessDenied && (
                <div className="modal-overlay">
                    <div className="modal-content-minimal animate-slide-down">
                        <button className="modal-close-minimal" onClick={() => setShowAccessDenied(false)}>
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                        <div className="access-denied-container">
                            <div className="denied-icon-wrapper">
                                <i className="fa-solid fa-lock"></i>
                            </div>
                            <h2 className="denied-title">สิทธิ์การเข้าถึงถูกจำกัด</h2>
                            <p className="denied-subtitle">
                                คุณไม่สามารถเข้าถึงส่วนนี้ได้ <br />
                                เนื่องจากฟีเจอร์นี้เปิดให้ใช้งานเฉพาะสมาชิกเท่านั้น
                            </p>
                            <div className="denied-actions">
                                <button className="btn-denied-main" onClick={() => navigate('/login')}>
                                    สมัครสมาชิก / เข้าสู่ระบบ
                                </button>
                                <button className="btn-denied-secondary" onClick={() => { setShowAccessDenied(false); handleStart(); }}>
                                    ทำแบบทดสอบหาอาชีพแทน
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {currentState === 'start' && (
                <div className="test-start-layout animate-fade-in">
                    <div className="test-start-left-panel">
                        <div className="info-card">
                            <h3><i className="fa-solid fa-circle-info"></i> เกี่ยวกับแบบทดสอบ</h3>
                            <p>แบบทดสอบนี้ถูกออกแบบมาเพื่อวิเคราะห์ลักษณะนิสัย การตัดสินใจ และรูปแบบการเล่นเกมของคุณ เพื่อค้นหาคลาสใน Dungeons & Dragons ที่สะท้อนตัวตนของคุณมากที่สุด</p>
                        </div>
                        <div className="info-card mt-16">
                            <h3><i className="fa-solid fa-list-check"></i> วิธีใช้งาน</h3>
                            <ul className="instruction-list">
                                <li><i className="fa-solid fa-check text-primary"></i> มีคำถามทั้งหมด 10 ข้อ</li>
                                <li><i className="fa-solid fa-check text-primary"></i> เลือกคำตอบที่เป็นตัวคุณมากที่สุด</li>
                                <li><i className="fa-solid fa-check text-primary"></i> ไม่มีการจับเวลา ใช้เวลาคิดได้อย่างเต็มที่</li>
                                <li><i className="fa-solid fa-check text-primary"></i> ระบบจะคำนวณและแสดง 3 อันดับคลาสที่เหมาะสมกับคุณ</li>
                            </ul>
                        </div>
                        <div className="info-card mt-16" style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
                            <h3><i className="fa-solid fa-users-viewfinder"></i> สายอาชีพหลักใน D&D</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                                <div style={{ fontSize: '0.85rem' }}><strong><i className="fa-solid fa-shield-halved" style={{color: '#711a19'}}></i> แนวหน้า (Tank)</strong><br/>เน้นการป้องกันและรับการโจมตีแทนเพื่อน</div>
                                <div style={{ fontSize: '0.85rem' }}><strong><i className="fa-solid fa-wand-magic-sparkles" style={{color: '#711a19'}}></i> เวทมนตร์ (Caster)</strong><br/>ควบคุมสนามรบและสร้างความเสียหายรุนแรง</div>
                                <div style={{ fontSize: '0.85rem' }}><strong><i className="fa-solid fa-hand-holding-medical" style={{color: '#711a19'}}></i> สนับสนุน (Support)</strong><br/>ฟื้นฟูพลังและเพิ่มความสามารถให้ทีม</div>
                                <div style={{ fontSize: '0.85rem' }}><strong><i className="fa-solid fa-crosshairs" style={{color: '#711a19'}}></i> โจมตี (Striker)</strong><br/>สร้างความเสียหายอย่างรวดเร็วและแม่นยำ</div>
                            </div>
                        </div>
                    </div>

                    <div className="test-start-main-panel">
                        <div className="test-start-container">
                            <div className="test-icon-wrapper">
                                <i className="fa-solid fa-book-open"></i>
                            </div>
                            <h1 className="test-title">ค้นหาตัวตนที่แท้จริง<br/>ในโลก D&D</h1>
                            <p className="test-subtitle">
                                "คุณอยากค้นพบตัวตนแบบไหน?"
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                                <button className="btn-start-test" onClick={handleStart}>
                                    <i className="fa-solid fa-list-ol"></i> โหมดปรนัย (Standard Quiz)
                                </button>
                                <button 
                                    className="btn-start-test" 
                                    style={{ background: '#8b0000', color: 'white', border: '1px solid #5a0000' }}
                                    onClick={handleAIDMClick}
                                >
                                    <i className="fa-solid fa-dragon"></i> โหมด AI DM (The Grand Weaver)
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="test-start-right-panel">
                        <div className="info-card highlight-card">
                            <h3><i className="fa-solid fa-lightbulb"></i> คำแนะนำก่อนเริ่ม</h3>
                            <p>พยายามตอบตามสัญชาตญาณแรกของคุณ อย่าคิดมากเกินไป เพราะคำตอบแรกมักจะสะท้อนตัวตนที่แท้จริงของคุณได้ดีที่สุด!</p>
                        </div>
                        <div className="class-preview-grid">
                            <div className="class-preview-icon" title="Barbarian"><i className="fa-solid fa-gavel"></i></div>
                            <div className="class-preview-icon" title="Bard"><i className="fa-solid fa-guitar"></i></div>
                            <div className="class-preview-icon" title="Cleric"><i className="fa-solid fa-cross"></i></div>
                            <div className="class-preview-icon" title="Druid"><i className="fa-solid fa-leaf"></i></div>
                            <div className="class-preview-icon" title="Fighter"><i className="fa-solid fa-shield-halved"></i></div>
                            <div className="class-preview-icon" title="Monk"><i className="fa-solid fa-yin-yang"></i></div>
                            <div className="class-preview-icon" title="Paladin"><i className="fa-solid fa-khanda"></i></div>
                            <div className="class-preview-icon" title="Ranger"><i className="fa-solid fa-crosshairs"></i></div>
                            <div className="class-preview-icon" title="Rogue"><i className="fa-solid fa-mask"></i></div>
                            <div className="class-preview-icon" title="Sorcerer"><i className="fa-solid fa-fire"></i></div>
                            <div className="class-preview-icon" title="Warlock"><i className="fa-solid fa-eye"></i></div>
                            <div className="class-preview-icon" title="Wizard"><i className="fa-solid fa-hat-wizard"></i></div>
                        </div>
                        <div className="info-card mt-16" style={{ background: '#fef2f2', border: '1px solid #fca5a5' }}>
                            <h3 style={{ color: '#991b1b', borderBottomColor: '#fecaca' }}><i className="fa-solid fa-dice-d20"></i> รู้หรือไม่?</h3>
                            <p style={{ color: '#7f1d1d' }}>ใน D&D 5e มีคลาสพื้นฐานให้เลือกถึง 12 คลาส และเมื่อรวมกับ Subclass (ความเชี่ยวชาญเฉพาะทาง) จะมีรูปแบบตัวละครให้เลือกเล่นมากกว่า 100 แบบ! การเลือกคลาสที่เข้ากับตัวคุณจะทำให้การสวมบทบาทสนุกและเป็นธรรมชาติมากขึ้น</p>
                        </div>
                    </div>
                </div>
            )}

            {currentState === 'quiz' && quizData[currentQuestionId] && (
                <div className="test-quiz-container animate-slide-up">
                    <div className="quiz-header">
                        <span className="quiz-progress-text">Question {questionCount} Of 10</span>
                        <span className="quiz-progress-percent">{Math.round((questionCount / 10) * 100)}%</span>
                    </div>
                    <div className="quiz-progress-bar-bg">
                        <div 
                            className="quiz-progress-bar-fill" 
                            style={{ width: `${(questionCount / 10) * 100}%` }}
                        ></div>
                    </div>

                    <div className="quiz-card">
                        <h2 className="quiz-question-text">{quizData[currentQuestionId].text}</h2>
                        
                        <div className="quiz-choices-container">
                            {quizData[currentQuestionId].choices.map((choice, index) => (
                                <button 
                                    key={index} 
                                    className={`quiz-choice-btn ${selectedOption === choice ? 'selected' : ''}`}
                                    onClick={() => handleSelectOption(choice)}
                                >
                                    <div className="choice-radio-circle"></div>
                                    <span className="choice-text">{choice.text}</span>
                                </button>
                            ))}
                        </div>
                        
                        {/* ปุ่มยืนยัน (แสดงเฉพาะตอนที่เลือกคำตอบแล้ว) */}
                        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center' }}>
                            <button 
                                className="btn-primary" 
                                style={{ 
                                    opacity: selectedOption ? 1 : 0.5, 
                                    cursor: selectedOption ? 'pointer' : 'not-allowed',
                                    padding: '12px 40px',
                                    fontSize: '1.1rem',
                                    transition: 'all 0.3s'
                                }}
                                onClick={handleConfirmAnswer}
                                disabled={!selectedOption}
                            >
                                {questionCount === 10 ? (
                                    <>ดูผลลัพธ์บทสรุปของคุณ <i className="fa-solid fa-scroll" style={{ marginLeft: '8px' }}></i></>
                                ) : (
                                    <>ยืนยันคำตอบ และไปต่อ <i className="fa-solid fa-arrow-right" style={{ marginLeft: '8px' }}></i></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {currentState === 'result' && topClasses.length > 0 && (
                <div className="test-result-container animate-fade-in">
                    <div className="result-header">
                        <i className="fa-solid fa-scroll"></i>
                        <h2>YOUR DESTINY</h2>
                        <p>จากคำตอบของคุณ นี่คือ 3 คลาสที่เหมาะสมกับสไตล์การเล่นของคุณมากที่สุด</p>
                    </div>

                    <div className="result-cards-wrapper">
                        {/* อันดับ 1 */}
                        <div className="result-card-main">
                            <div className="rank-badge">อันดับ 1 (BEST MATCH)</div>
                            <div className="result-icon-main">
                                <i className={`fa-solid ${topClasses[0].icon}`}></i>
                            </div>
                            <h3 className="result-class-name-main">{topClasses[0].name}</h3>
                            <p className="result-class-desc-main">{topClasses[0].desc}</p>
                        </div>

                        <div className="result-sub-cards">
                            {/* อันดับ 2 */}
                            <div className="result-card-sub">
                                <div className="result-card-sub-left">
                                    <i className={`fa-solid ${topClasses[1].icon}`}></i>
                                </div>
                                <div className="result-card-sub-right">
                                    <span className="sub-rank-text">อันดับ 2 (ALTERNATIVE)</span>
                                    <h4>{topClasses[1].name}</h4>
                                    <p>{topClasses[1].desc}</p>
                                </div>
                            </div>

                            {/* อันดับ 3 */}
                            <div className="result-card-sub">
                                <div className="result-card-sub-left">
                                    <i className={`fa-solid ${topClasses[2].icon}`}></i>
                                </div>
                                <div className="result-card-sub-right">
                                    <span className="sub-rank-text">อันดับ 3 (WILDCARD)</span>
                                    <h4>{topClasses[2].name}</h4>
                                    <p>{topClasses[2].desc}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="result-actions">
                        <button className="btn-result-primary" onClick={() => navigate('/')}>
                            <i className="fa-solid fa-arrow-left"></i> กลับไปหน้าเริ่มต้น
                        </button>
                        <button className="btn-result-secondary" onClick={handleStart}>
                            <i className="fa-solid fa-rotate-right"></i> ทำแบบทดสอบอีกครั้ง
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ClassTest;
