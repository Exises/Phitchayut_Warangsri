import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import WorkshopCharacterBuilder from '../components/WorkshopCharacterBuilder';

function Workshop() {
  const location = useLocation();
  const [activeForm, setActiveForm] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const hasSavedDraft = localStorage.getItem('workshop_characterState') && localStorage.getItem('workshop_characterState') !== 'null';
    if (params.get('step') || params.get('load_char_id') || localStorage.getItem('workshop_load_char_id') || params.get('autoOpen') === 'true' || hasSavedDraft) {
      return 'character';
    }
    return null;
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hasParams = params.get('step') || params.get('load_char_id') || params.get('autoOpen');
    
    if (!hasParams) {
      setActiveForm(null);
    } else {
      setActiveForm('character');
    }
  }, [location.search, location.pathname]);

  const [builderKey, setBuilderKey] = useState(() => Date.now());
  const [isLoggedIn] = useState(() => Boolean(localStorage.getItem('dnd_user')));

  if (!isLoggedIn) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[70vh] bg-cream" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="access-denied-container animate-slide-down" style={{
          backgroundColor: 'var(--bg-white)',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          border: '1px solid #e5e7eb'
        }}>
          <div className="denied-icon-wrapper" style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#fef2f2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            color: '#ef4444',
            fontSize: '1.8rem'
          }}>
            <i className="fa-solid fa-lock"></i>
          </div>
          <h2 className="denied-title" style={{ fontFamily: 'var(--font-header)', color: 'var(--color-ink)', fontSize: '1.5rem', marginBottom: '10px' }}>สิทธิ์การเข้าถึงถูกจำกัด</h2>
          <p className="denied-subtitle" style={{ color: 'var(--color-gray)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '30px' }}>
            คุณไม่สามารถเข้าถึงส่วนนี้ได้ <br />
            เนื่องจากฟีเจอร์นี้เปิดให้ใช้งานเฉพาะสมาชิกเท่านั้น
          </p>
          <div className="denied-actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link to="/login" style={{
              padding: '12px 20px',
              backgroundColor: '#711a19',
              color: 'var(--bg-white)',
              borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              transition: 'all 0.3s'
            }} className="btn-denied-main">
              สมัครสมาชิก / เข้าสู่ระบบ
            </Link>
            <Link to="/" style={{
              padding: '12px 20px',
              backgroundColor: 'var(--bg-white)',
              color: 'var(--color-gray)',
              borderRadius: '4px',
              textDecoration: 'none',
              border: '1px solid #d1d5db',
              fontWeight: '500',
              fontSize: '0.9rem',
              transition: 'all 0.3s'
            }} className="btn-denied-secondary">
              กลับหน้าแรก
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleStartBuilder = (forceNew = false) => {
    if (forceNew) {
      localStorage.setItem('workshop_currentStep', JSON.stringify(1));
      localStorage.removeItem('workshop_characterState');
      localStorage.removeItem('workshop_diaryNotes');
      const url = new URL(window.location.href);
      url.searchParams.set('step', '1');
      window.history.replaceState({}, '', url);
    }
    setBuilderKey(Date.now());
    setActiveForm('character');
  };

  return (
    <div id="page-builder" className="page">
        {/* ส่วนเมนูหลัก: จะแสดงก็ต่อเมื่อ activeForm เป็น null (ยังไม่ได้เลือกอะไร) */}
        {!activeForm && (
            <div className="container-center" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 16px' }}>
                {/* 1. Header Banner Section */}
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '6px 16px', borderRadius: '20px', color: '#711a19', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '12px' }}>
                        <i className="fa-solid fa-wand-magic-sparkles"></i> D&D 2024 Character Builder Engine
                    </div>
                    <h1 style={{ fontFamily: 'var(--font-header)', color: 'var(--color-ink)', fontSize: '2.2rem', margin: '0 0 8px 0', fontWeight: 'bold' }}>
                        เวิร์คช็อปสร้างตัวละคร (Character Workshop)
                    </h1>
                    <p style={{ color: 'var(--color-gray)', fontSize: '1rem', maxWidth: '700px', margin: '0 auto', lineHeight: '1.6' }}>
                        ยินดีต้อนรับสู่ระบบสร้างและจัดการตัวละคร D&D 2024 ครบวงจร ใช้งานง่าย เหมาะสำหรับผู้เล่นใหม่และผู้เล่นระดับสูง พร้อมระบบคำนวณกลไกเกมอัตโนมัติ
                    </p>
                </div>

                {/* 2. Hero Start Action Button Banner */}
                <div style={{
                    backgroundColor: 'var(--bg-white)',
                    border: '2px solid #711a19',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '35px',
                    boxShadow: '0 10px 25px rgba(113, 26, 25, 0.08)',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '20px',
                    background: 'linear-gradient(135deg, #ffffff 0%, #fff8f8 100%)'
                }}>
                    <div style={{ flex: '1 1 350px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <span style={{ backgroundColor: '#711a19', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>PC BUILDER</span>
                            <h3 style={{ margin: 0, color: 'var(--color-ink)', fontSize: '1.35rem', fontWeight: 'bold' }}>
                                <i className="fa-solid fa-user-shield" style={{ color: '#711a19', marginRight: '8px' }}></i>
                                เริ่มสร้างตัวละครใหม่ (Create Adventurer)
                            </h3>
                        </div>
                        <p style={{ margin: 0, color: 'var(--color-gray)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                            เริ่มสร้างตัวละครใหม่ทีละขั้นตอน พร้อมคำแนะนำ คำนวณค่าพลัง อาวุธ และเวทมนตร์ให้อัตโนมัติตามกฎ D&D 2024
                        </p>
                    </div>
                    <button
                        onClick={handleStartBuilder}
                        style={{
                            padding: '14px 28px',
                            backgroundColor: '#711a19',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            boxShadow: '0 4px 14px rgba(113, 26, 25, 0.3)',
                            transition: 'all 0.2s',
                            flexShrink: 0
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <i className="fa-solid fa-plus-circle" style={{ fontSize: '1.2rem' }}></i>
                        สร้างตัวละครผู้เล่น (PC)
                    </button>
                </div>

                {/* 3. Two-Column Proportional Layout (Left: Core Guide / Right: Step-by-Step Instructions) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px', alignItems: 'start' }}>
                    
                    {/* LEFT COLUMN: ความรู้พื้นฐาน D&D 2024 สำหรับผู้เล่นใหม่ */}
                    <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <div style={{ borderBottom: '2px solid #711a19', paddingBottom: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fa-solid fa-book-open-reader" style={{ color: '#711a19', fontSize: '1.3rem' }}></i>
                            <h3 style={{ margin: 0, color: '#711a19', fontSize: '1.15rem', fontWeight: 'bold' }}>
                                ข้อมูลพื้นฐานสำหรับผู้เล่นใหม่ (Core Concepts)
                            </h3>
                        </div>
                        <p style={{ fontSize: '0.88rem', color: 'var(--color-gray)', lineHeight: '1.6', marginBottom: '18px' }}>
                            หากคุณเป็นผู้เล่นใหม่หรือเริ่มเล่นครั้งแรก D&D 2024 ประกอบด้วย 4 องค์ประกอบสำคัญในการสร้างตัวละคร:
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ padding: '12px', backgroundColor: '#fdf4f4', borderRadius: '8px', borderLeft: '4px solid #711a19' }}>
                                <div style={{ fontWeight: 'bold', color: '#711a19', fontSize: '0.92rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    🧬 1. เผ่าพันธุ์ (Species)
                                </div>
                                <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: '1.5' }}>
                                    คือชาติตระกูลของตัวละคร เช่น <strong>Human, Elf, Dwarf, Dragonborn, Tiefling</strong> กำหนดขนาดร่างกาย ความเร็วการเดิน สายตาในความมืด (Darkvision) และพรสวรรค์พิเศษประจำเผ่า
                                </div>
                            </div>

                            <div style={{ padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '8px', borderLeft: '4px solid #0284c7' }}>
                                <div style={{ fontWeight: 'bold', color: '#0369a1', fontSize: '0.92rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    🛡️ 2. คลาสอาชีพ (Class)
                                </div>
                                <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: '1.5' }}>
                                    คือสายอาชีพและความชำนาญในการต่อสู้ เช่น <strong>Fighter, Wizard, Rogue, Cleric</strong> กำหนดความถึก (Hit Dice/HP) อาวุธและชุดเกราะที่สวมใส่ได้ สล็อตเวทมนตร์ และทักษะเฉพาะตัว
                                </div>
                            </div>

                            <div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #16a34a' }}>
                                <div style={{ fontWeight: 'bold', color: '#15803d', fontSize: '0.92rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    📜 3. ประวัติภูมิหลัง (Background)
                                </div>
                                <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: '1.5' }}>
                                    คือภูมิหลังชีวิตก่อนมาเป็นนักผจญภัย เช่น <strong>Acolyte, Criminal, Sage, Soldier</strong> มอบพรสวรรค์เริ่มต้น (Origin Feat) ความชำนาญทักษะ และอุปกรณ์เริ่มต้น
                                </div>
                            </div>

                            <div style={{ padding: '12px', backgroundColor: '#fefce8', borderRadius: '8px', borderLeft: '4px solid #ca8a04' }}>
                                <div style={{ fontWeight: 'bold', color: '#a16207', fontSize: '0.92rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    🎲 4. ค่าสถานะ (Ability Scores)
                                </div>
                                <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: '1.5' }}>
                                    คือความสามารถ 6 ด้านของตัวละคร ได้แก่ <strong>STR</strong> (พละกำลัง), <strong>DEX</strong> (ความคล่องแคล่ว), <strong>CON</strong> (ความถึก), <strong>INT</strong> (ปัญญา), <strong>WIS</strong> (รับรู้/จิตใจ), <strong>CHA</strong> (เสน่ห์)
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: ขั้นตอนการใช้งาน Workshop (7 Steps Guide) */}
                    <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <div style={{ borderBottom: '2px solid #711a19', paddingBottom: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fa-solid fa-list-check" style={{ color: '#711a19', fontSize: '1.3rem' }}></i>
                            <h3 style={{ margin: 0, color: '#711a19', fontSize: '1.15rem', fontWeight: 'bold' }}>
                                ขั้นตอนการสร้างตัวละคร (7 Steps Overview)
                            </h3>
                        </div>
                        <p style={{ fontSize: '0.88rem', color: 'var(--color-gray)', lineHeight: '1.6', marginBottom: '18px' }}>
                            ระบบจะพาคุณสร้างตัวละครทีละขั้นตอนจนเสร็จสมบูรณ์ดังนี้:
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {[
                                { step: '1', name: 'Race (Species)', desc: 'เลือกเผ่าพันธุ์และสายเลือด (Lineage/Subrace)', icon: 'fa-dna', color: '#991b1b' },
                                { step: '2', name: 'Class', desc: 'เลือกคลาสอาชีพ ปรับระดับเลเวล และเลือก Subclass', icon: 'fa-khanda', color: '#0369a1' },
                                { step: '3', name: 'Background', desc: 'เลือกภูมิหลัง รับ Origin Feat และทักษะประจำตัว', icon: 'fa-user-graduate', color: '#15803d' },
                                { step: '4', name: 'Abilities', desc: 'จัดสรรค่าพลัง 6 ด้านด้วย Point Buy หรือ Standard Array', icon: 'fa-dice-d20', color: '#a16207' },
                                { step: '5', name: 'Equipment', desc: 'เลือกชุดอุปกรณ์เริ่มต้น อาวุธ เกราะ และเงินทอง (GP)', icon: 'fa-shield-halved', color: '#475569' },
                                { step: '6', name: 'Details', desc: 'ตั้งชื่อตัวละคร พันธมิตร ปรับแต่งรูปลักษณ์ และปฏิทิน', icon: 'fa-pen-to-square', color: '#6b21a8' },
                                { step: '7', name: 'Review', desc: 'ตรวจสอบใบบันทึกตัวละครฉบับเต็ม และทดลองทอยลูกเต๋า 3D', icon: 'fa-clipboard-check', color: '#711a19' }
                            ].map((s) => (
                                <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                    <div style={{ width: '28px', height: '28px', backgroundColor: s.color, color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.82rem', flexShrink: 0 }}>
                                        {s.step}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold', color: 'var(--color-ink)', fontSize: '0.86rem' }}>
                                            Step {s.step}: {s.name}
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--color-gray)' }}>{s.desc}</div>
                                    </div>
                                    <i className={`fa-solid ${s.icon}`} style={{ color: s.color, opacity: 0.8, fontSize: '0.95rem' }}></i>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        )}

        {/* ส่วนฟอร์มสร้างตัวละคร: จะแสดงเมื่อ activeForm === 'character' */}
        {activeForm === 'character' && (
            <div className="workshop-full-form animate-fade-in" style={{ width: '96%', maxWidth: '1420px', margin: '15px auto' }}>
                <WorkshopCharacterBuilder key={builderKey} onCancel={() => setActiveForm(null)} />
            </div>
        )}
    </div>
  );
}

export default Workshop;
