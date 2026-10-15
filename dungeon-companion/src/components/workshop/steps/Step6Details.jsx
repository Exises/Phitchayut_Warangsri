import React, { useState } from 'react';

export default function Step6Details({
  characterState,
  setCharacterState
}) {
  const desc = characterState.description || {};
  const handleDescChange = (key, val) => {
    setCharacterState(prev => ({
      ...prev,
      description: {
        ...(prev.description || {}),
        [key]: val
      }
    }));
  };

  return (
    <div className="builder-step-content animate-fade-in" style={{ padding: '16px' }}>
      {/* Top Section: CHARACTER DETAILS */}
      <div style={{ marginBottom: '28px' }}>
        <h3 className="step-title" style={{ fontSize: '1.6rem', color: 'var(--color-ink)', fontWeight: '800', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '14px', letterSpacing: '0.5px' }}>
          CHARACTER DETAILS
        </h3>
        <div style={{ backgroundColor: 'var(--bg-white)', padding: '16px 18px', borderRadius: '8px', borderLeft: '4px solid #711a19', border: '1px solid #cbd5e1', borderLeftWidth: '4px', borderLeftColor: '#711a19', marginBottom: '24px' }}>
          <p style={{ color: 'var(--color-gray)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
            ตัวละครมีความหมายและมิติที่ลึกซึ้งมากกว่าเพียงแค่เผ่าพันธุ์และคลาส พวกเขาคือบุคคลที่มีเรื่องราว ความสนใจ สายสัมพันธ์ และความสามารถเฉพาะตัวที่อยู่นอกเหนือจากสิ่งที่คลาสหรือเผ่ากำหนดไว้ ในส่วนนี้จะช่วยระบุรายละเอียดเพื่อสร้างเอกลักษณ์ให้กับตัวละครของคุณ ตั้งแต่ข้อมูลพื้นฐาน เช่น ชื่อ รูปลักษณ์ภายนอก ภูมิหลัง ภาษา ไปจนถึงบุคลิกภาพและแนวคิดเจตคติ (Alignment)
          </p>
        </div>

        {/* Grid 1: Basic Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div>
            <label htmlFor="char-name" style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-gray)', letterSpacing: '0.5px', marginBottom: '6px' }}>
              CHARACTERS NAME
            </label>
            <input
              id="char-name"
              name="char-name"
              type="text"
              placeholder="e.g. Arthur / Roland / หรือชื่อตามต้องการ"
              value={desc.name || ''}
              onChange={(e) => handleDescChange('name', e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: 'var(--color-ink)', fontWeight: '600' }}
            />
          </div>
          <div>
            <label htmlFor="char-avatar-url" style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-gray)', letterSpacing: '0.5px', marginBottom: '6px' }}>
              PORTRAIT IMAGE / PROFILE PICTURE
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                id="char-avatar-url"
                name="char-avatar-url"
                type="text"
                placeholder="Paste Image URL (https://...)"
                value={desc.avatarUrl || ''}
                onChange={(e) => handleDescChange('avatarUrl', e.target.value)}
                style={{ flex: '1 1 180px', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: 'var(--color-ink)' }}
              />
              <label
                style={{
                  backgroundColor: '#711a19',
                  color: 'var(--bg-white)',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
                title="เลือกไฟล์รูปภาพจากเครื่องของท่าน"
              >
                <i className="fa-solid fa-upload"></i> อัปโหลดรูปจากเครื่อง
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const img = new Image();
                      img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_SIZE = 350;
                        let width = img.width;
                        let height = img.height;
                        if (width > height) {
                          if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                          }
                        } else {
                          if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                          }
                        }
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
                        handleDescChange('avatarUrl', dataUrl);
                      };
                      img.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              {desc.avatarUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <img
                    src={desc.avatarUrl}
                    alt="Avatar"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #711a19' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleDescChange('avatarUrl', '')}
                    style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                    title="ลบรูปโปรไฟล์"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              ) : (
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gray)', fontSize: '1.1rem', fontWeight: 'bold' }}>
                  <i className="fa-solid fa-user"></i>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-gray)', fontWeight: '600' }}>ตัวเลือกด่วน:</span>
              {[
                { name: 'Wizard', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=150&auto=format&fit=crop&q=80' },
                { name: 'Warrior', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=150&auto=format&fit=crop&q=80' },
                { name: 'Rogue', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&auto=format&fit=crop&q=80' },
                { name: 'Elf', url: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=150&auto=format&fit=crop&q=80' }
              ].map(p => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleDescChange('avatarUrl', p.url)}
                  style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: desc.avatarUrl === p.url ? '#fef2f2' : 'var(--bg-white)', color: desc.avatarUrl === p.url ? '#711a19' : 'var(--color-gray)', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="char-gender" style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-gray)', letterSpacing: '0.5px', marginBottom: '6px' }}>
              GENDER
            </label>
            <select
              id="char-gender"
              name="char-gender"
              value={desc.gender || ''}
                    onChange={(e) => handleDescChange('gender', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: 'var(--color-ink)', fontWeight: '600', backgroundColor: 'var(--bg-white)' }}
                  >
                    <option value="">-- Select Gender --</option>
                    <option value="Male">Male (ชาย)</option>
                    <option value="Female">Female (หญิง)</option>
                    <option value="Non-Binary">Non-Binary (ไม่ระบุเพศ)</option>
                    <option value="Androgynous">Androgynous (กึ่งชายกึ่งหญิง)</option>
                    <option value="Genderfluid">Genderfluid (ลื่นไหลทางเพศ)</option>
                    <option value="Agender">Agender (ไร้เพศ)</option>
                    <option value="Masculine">Masculine (บุคลิกชาย)</option>
                    <option value="Feminine">Feminine (บุคลิกหญิง)</option>
                    <option value="Shapeshifter">Shapeshifter (เปลี่ยนรูปตามต้องการ)</option>
                    <option value="Construct / Sexless">Construct / Sexless (หุ่นกลจักรกล)</option>
                    <option value="Custom">Other (Custom...)</option>
                  </select>
                  {desc.gender === 'Custom' && (
                    <input
                      type="text"
                      placeholder="Type custom gender..."
                      onChange={(e) => handleDescChange('gender', e.target.value)}
                      style={{ width: '100%', marginTop: '6px', padding: '8px 10px', borderRadius: '4px', border: '1px solid #711a19', fontSize: '0.85rem' }}
                    />
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-gray)', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    ALIGNMENT
                  </label>
                  <select
                    value={desc.alignment || ''}
                    onChange={(e) => handleDescChange('alignment', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: 'var(--color-ink)', fontWeight: '600', backgroundColor: 'var(--bg-white)' }}
                  >
                    <option value="">-- Select Alignment --</option>
                    <option value="Lawful Good">Lawful Good</option>
                    <option value="Neutral Good">Neutral Good</option>
                    <option value="Chaotic Good">Chaotic Good</option>
                    <option value="Lawful Neutral">Lawful Neutral</option>
                    <option value="True Neutral">True Neutral</option>
                    <option value="Chaotic Neutral">Chaotic Neutral</option>
                    <option value="Lawful Evil">Lawful Evil</option>
                    <option value="Neutral Evil">Neutral Evil</option>
                    <option value="Chaotic Evil">Chaotic Evil</option>
                    <option value="Unaligned">Unaligned</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-gray)', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    PLAYER NAME
                  </label>
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={desc.playerName || ''}
                    onChange={(e) => handleDescChange('playerName', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: 'var(--color-ink)', fontWeight: '600' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-gray)', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    CURRENT EXPERIENCE
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0 XP"
                    value={desc.currentExperience || ''}
                    onChange={(e) => handleDescChange('currentExperience', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: 'var(--color-ink)', fontWeight: '600' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-gray)', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    DEITY (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. God of Light / The Sun God / เทพแห่งแสง / None"
                    value={desc.deity || ''}
                    onChange={(e) => handleDescChange('deity', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: 'var(--color-ink)', fontWeight: '600' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-gray)', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    PARTY / CAMPAIGN (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Silver Vanguard / Guild of Adventurers / กลุ่มผู้กล้าแดนเหนือ"
                    value={desc.partyName || ''}
                    onChange={(e) => handleDescChange('partyName', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: 'var(--color-ink)', fontWeight: '600' }}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: APPEARANCE */}
            <div style={{ marginBottom: '32px', borderTop: '2px solid #e2e8f0', paddingTop: '24px' }}>
              <h4 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', fontWeight: '800', marginBottom: '4px', letterSpacing: '0.5px' }}>
                APPEARANCE
              </h4>
              <p style={{ color: 'var(--color-gray)', fontSize: '0.88rem', marginBottom: '18px' }}>
                กำหนดรูปลักษณ์ภายนอกและลักษณะทางกายภาพของตัวละครของคุณที่นี่
              </p>

              {/* Grid 2: Appearance */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-gray)', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    AGE
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 25"
                    value={desc.age || ''}
                    onChange={(e) => handleDescChange('age', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: 'var(--color-ink)', fontWeight: '600' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-gray)', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    HEIGHT
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5'10&quot;"
                    value={desc.height || ''}
                    onChange={(e) => handleDescChange('height', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: 'var(--color-ink)', fontWeight: '600' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-gray)', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    WEIGHT
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 165 lbs"
                    value={desc.weight || ''}
                    onChange={(e) => handleDescChange('weight', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: 'var(--color-ink)', fontWeight: '600' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-gray)', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    EYES
                  </label>
                  <select
                    value={desc.eyes || ''}
                    onChange={(e) => handleDescChange('eyes', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: 'var(--color-ink)', fontWeight: '600', backgroundColor: 'var(--bg-white)' }}
                  >
                    <option value="">-- Select Eye Color --</option>
                    <optgroup label="Natural Colors">
                      <option value="Brown / Dark Brown">Brown / Dark Brown (สีน้ำตาลเข้ม)</option>
                      <option value="Hazel / Forest">Hazel / Forest (สีน้ำตาลประกายเขียวป่า)</option>
                      <option value="Amber / Honey">Amber / Honey (สีเหลืองอำพันน้ำผึ้ง)</option>
                      <option value="Emerald Green">Emerald Green (สีเขียวมรกตสดใส)</option>
                      <option value="Azure Blue">Azure Blue (สีฟ้าครามสดใส)</option>
                      <option value="Ice Blue / Sapphire">Ice Blue / Sapphire (สีฟ้าไพลินน้ำแข็ง)</option>
                      <option value="Grey / Slate">Grey / Slate (สีเทาหมอกศิลา)</option>
                    </optgroup>
                    <optgroup label="Exotic & Magical Colors">
                      <option value="Amethyst Purple">Amethyst Purple (สีม่วงอเมทิสต์)</option>
                      <option value="Blood Ruby Red">Blood Ruby Red (สีแดงทับทิม)</option>
                      <option value="Glowing Gold">Glowing Gold (สีทองประกายเรืองแสง)</option>
                      <option value="Glowing Crimson">Glowing Crimson (สีแดงเพลิงเรืองแสง)</option>
                      <option value="Electric Cyan">Electric Cyan (สีฟ้าสายฟ้าเวทมนตร์)</option>
                      <option value="Silver / Platinum">Silver / Platinum (สีเงินยวงสว่าง)</option>
                      <option value="Black Onyx / Void">Black Onyx / Void (สีดำรัตติกาลไร้แวว)</option>
                      <option value="Pure White / Orbless">Pure White / Orbless (สีขาวโพลนดวงตาทิพย์)</option>
                      <option value="Molten Fire">Molten Fire (สีเปลวเพลิงลาวาคุกรุ่น)</option>
                      <option value="Heterochromia (Dual Colors)">Heterochromia (ตาสองสีซ้ายขวา)</option>
                    </optgroup>
                    <option value="Custom">Other (Custom...)</option>
                  </select>
                  {desc.eyes === 'Custom' && (
                    <input
                      type="text"
                      placeholder="Type custom eye color..."
                      onChange={(e) => handleDescChange('eyes', e.target.value)}
                      style={{ width: '100%', marginTop: '6px', padding: '8px 10px', borderRadius: '4px', border: '1px solid #711a19', fontSize: '0.85rem' }}
                    />
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-gray)', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    SKIN
                  </label>
                  <select
                    value={desc.skin || ''}
                    onChange={(e) => handleDescChange('skin', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: 'var(--color-ink)', fontWeight: '600', backgroundColor: 'var(--bg-white)' }}
                  >
                    <option value="">-- Select Skin Tone / Complexion --</option>
                    <optgroup label="Humanoid Tones">
                      <option value="Fair / Porcelain">Fair / Porcelain (ผิวขาวเนียนดุจกระเบื้อง)</option>
                      <option value="Pale / Ivory">Pale / Ivory (ผิวขาวงาช้าง)</option>
                      <option value="Sun-Kissed / Peach">Sun-Kissed / Peach (ผิวขาวอมชมพูบ่มแดด)</option>
                      <option value="Tan / Golden">Tan / Golden (ผิวสีแทนทอง)</option>
                      <option value="Olive / Mediterranean">Olive / Mediterranean (ผิวสีมะกอกธรรมชาติ)</option>
                      <option value="Warm Brown / Caramel">Warm Brown / Caramel (ผิวสีน้ำตาลคาราเมลอบอุ่น)</option>
                      <option value="Rich Mahogany / Copper">Rich Mahogany / Copper (ผิวสีน้ำตาลทองแดงเข้ม)</option>
                      <option value="Deep Ebony / Obsidian">Deep Ebony / Obsidian (ผิวสีดำสนิทดุจหินออบซิเดียน)</option>
                    </optgroup>
                    <optgroup label="Fantasy & Monstrous Tones">
                      <option value="Ash Grey / Slate">Ash Grey / Slate (ผิวสีเทาขี้เถ้า / ศิลา)</option>
                      <option value="Verdant Green / Emerald">Verdant Green / Emerald (ผิวสีเขียวใบไม้ / ออร์ค)</option>
                      <option value="Crimson Red / Fiery">Crimson Red / Fiery (ผิวสีแดงเพลิง / ทิฟลิง)</option>
                      <option value="Deep Sapphire Blue">Deep Sapphire Blue (ผิวสีน้ำเงินครามทะเลลึก)</option>
                      <option value="Mystic Violet / Lavender">Mystic Violet / Lavender (ผิวสีม่วงลาเวนเดอร์ลึกลับ)</option>
                      <option value="Metallic Gold Scales">Metallic Gold Scales (เกล็ดมังกรทองประกาย)</option>
                      <option value="Metallic Silver Scales">Metallic Silver Scales (เกล็ดมังกรเงินประกาย)</option>
                      <option value="Metallic Brass / Bronze">Metallic Brass / Bronze (เกล็ดทองเหลือง / ทองแดง)</option>
                      <option value="Bark / Wood-grained">Bark / Wood-grained (ผิวลายเปลือกไม้พฤกษา)</option>
                      <option value="Crystalline / Translucent">Crystalline / Translucent (ผิวกึ่งโปร่งแสงผลึกคริสตัล)</option>
                    </optgroup>
                    <option value="Custom">Other (Custom...)</option>
                  </select>
                  {desc.skin === 'Custom' && (
                    <input
                      type="text"
                      placeholder="Type custom skin tone..."
                      onChange={(e) => handleDescChange('skin', e.target.value)}
                      style={{ width: '100%', marginTop: '6px', padding: '8px 10px', borderRadius: '4px', border: '1px solid #711a19', fontSize: '0.85rem' }}
                    />
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-gray)', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    HAIR COLOR (สีผม)
                  </label>
                  <select
                    value={desc.hair || ''}
                    onChange={(e) => handleDescChange('hair', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: 'var(--color-ink)', fontWeight: '600', backgroundColor: 'var(--bg-white)' }}
                  >
                    <option value="">-- Select Hair Color --</option>
                    <optgroup label="Natural Hair Colors">
                      <option value="Jet Black / Raven">Jet Black / Raven (สีดำขลับดุจขนนกอีกา)</option>
                      <option value="Dark Chestnut Brown">Dark Chestnut Brown (สีน้ำตาลเข้มเกาลัด)</option>
                      <option value="Warm Auburn / Russet">Warm Auburn / Russet (สีน้ำตาลอมแดงอบอุ่น)</option>
                      <option value="Honey Blonde">Honey Blonde (สีบลอนด์ทองน้ำผึ้ง)</option>
                      <option value="Platinum Blonde / White">Platinum Blonde / White (สีขาวบลอนด์สว่าง)</option>
                      <option value="Fiery Ginger Red">Fiery Ginger Red (สีแดงขิงสดจัดจ้าน)</option>
                      <option value="Silver Grey / Sage">Silver Grey / Sage (สีเงินเทาผู้อาวุโส)</option>
                      <option value="Pure White / Snow">Pure White / Snow (สีขาวหิมะบริสุทธิ์)</option>
                    </optgroup>
                    <optgroup label="Exotic & Magical Colors">
                      <option value="Midnight Blue / Indigo">Midnight Blue / Indigo (สีน้ำเงินราตรีลึกล้ำ)</option>
                      <option value="Emerald Forest Green">Emerald Forest Green (สีเขียวพงไพรลึกลับ)</option>
                      <option value="Mystic Violet / Purple">Mystic Violet / Purple (สีม่วงมนตราอเมทิสต์)</option>
                      <option value="Crimson Cherry Red">Crimson Cherry Red (สีแดงเชอร์รี่เวทมนตร์)</option>
                      <option value="Living Flame / Flaming">Living Flame / Flaming (เปลวเพลิงเวทมนตร์ลุกโชน)</option>
                      <option value="Pastel Pink / Sakura">Pastel Pink / Sakura (สีชมพูพาสเทลดอกซากุระ)</option>
                      <option value="Ombre Dual-Tone">Ombre Dual-Tone (ไล่เฉดสองสี)</option>
                    </optgroup>
                    <option value="Custom">Other (Custom...)</option>
                  </select>
                  {desc.hair === 'Custom' && (
                    <input
                      type="text"
                      placeholder="Type custom hair color..."
                      onChange={(e) => handleDescChange('hair', e.target.value)}
                      style={{ width: '100%', marginTop: '6px', padding: '8px 10px', borderRadius: '4px', border: '1px solid #711a19', fontSize: '0.85rem' }}
                    />
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-gray)', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    HAIR STYLE (ทรงผม)
                  </label>
                  <select
                    value={desc.hairStyle || ''}
                    onChange={(e) => handleDescChange('hairStyle', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: 'var(--color-ink)', fontWeight: '600', backgroundColor: 'var(--bg-white)' }}
                  >
                    <option value="">-- Select Hair Style --</option>
                    <optgroup label="Long & Flowing Styles">
                      <option value="Long Flowing Straight">Long Flowing Straight (ผมยาวตรงสลวยพริ้วไหว)</option>
                      <option value="Long Wavy / Cascading Curls">Long Wavy / Cascading Curls (ผมยาวดัดลอนคลื่นธรรมชาติ)</option>
                      <option value="High Ponytail / Sleek Tail">High Ponytail / Sleek Tail (มัดหางม้าสูงทะมัดทะแมง)</option>
                      <option value="Twin Tails / Pigtails">Twin Tails / Pigtails (มัดแกละสองข้าง)</option>
                      <option value="Half-Up Half-Down">Half-Up Half-Down (มัดครึ่งหัวปล่อยยาวข้างหลัง)</option>
                      <option value="Messy Bedhair / Wild Long">Messy Bedhair / Wild Long (ผมยาวเซอร์เป็นธรรมชาติไม่จัดทรง)</option>
                    </optgroup>
                    <optgroup label="Braids & Warrior Styles">
                      <option value="Viking Warrior Braids">Viking Warrior Braids (ถักเปียสไตล์นักรบไวกิ้ง)</option>
                      <option value="Braided with Runes & Beads">Braided with Runes & Beads (เปียยาวประดับลูกปัดรูนอักขระมนตรา)</option>
                      <option value="Crown Braid / Halo">Crown Braid / Halo (ถักเปียม้วนรอบศีรษะดุจมงกุฎ)</option>
                      <option value="Single Long Dorsal Plait">Single Long Dorsal Plait (เปียเดี่ยวยาวถึงกลางหลัง)</option>
                      <option value="Dreadlocks / Locs">Dreadlocks / Locs (ถักเดรดล็อกส์หนาแน่นหนานุ่ม)</option>
                    </optgroup>
                    <optgroup label="Short & Medium Styles">
                      <option value="Pixie Cut / Textured Short">Pixie Cut / Textured Short (ซอยสั้นเก๋กระฉับกระเฉง)</option>
                      <option value="Classic Bob / Jaw-Length">Classic Bob / Jaw-Length (ผมบอบสั้นระดับขากรรไกร)</option>
                      <option value="Shag Cut / Wolf Cut">Shag Cut / Wolf Cut (ซอยไล่เลเยอร์สไตล์วูล์ฟคัต)</option>
                      <option value="Undercut / Shaved Sides">Undercut / Shaved Sides (ไถข้างเปิดหูอันเดอร์คัตเท่ๆ)</option>
                      <option value="Bowl Cut / Mushroom">Bowl Cut / Mushroom (ผมทรงกะลาโครอบสุดคลาสสิก)</option>
                      <option value="Buzz Cut / Military Crew">Buzz Cut / Military Crew (ตัดเกรียนสั้นสไตล์ทหาร)</option>
                    </optgroup>
                    <optgroup label="Exotic & Fantasy Styles">
                      <option value="Samurai Topknot / Bun">Samurai Topknot / Bun (มวยผมจุกสูงสไตล์ซามูไร)</option>
                      <option value="Wild Feathered Mane">Wild Feathered Mane (แผงผมฟูฟ่องประดับขนนกป่าและเครื่องราง)</option>
                      <option value="Rebel Mohawk / Spikes">Rebel Mohawk / Spikes (ตั้งแหลมโมฮอว์กนักรบกบฏ)</option>
                      <option value="Floating Arcane Locks">Floating Arcane Locks (เส้นผมลอยพริ้วไหวด้วยพลังเวทมนตร์ตลอดเวลา)</option>
                      <option value="Living Tendrils / Medusa Strands">Living Tendrils / Medusa Strands (เส้นผมมีชีวิตเคลื่อนไหวได้เอง)</option>
                    </optgroup>
                    <optgroup label="No Hair / Special">
                      <option value="Bald / Smooth Shaven">Bald / Smooth Shaven (ศีรษะล้านเรียบเกลี้ยงเกลา)</option>
                      <option value="Tonsure / Monk Shave">Tonsure / Monk Shave (โกนกลางศีรษะสไตล์นักบวช)</option>
                      <option value="Crown of Horns / Crest Only">Crown of Horns / Crest Only (ไร้เส้นผม ประดับด้วยเขาหรือหงอนเกล็ดมังกร)</option>
                    </optgroup>
                    <option value="Custom">Other (Custom...)</option>
                  </select>
                  {desc.hairStyle === 'Custom' && (
                    <input
                      type="text"
                      placeholder="Type custom hair style description..."
                      onChange={(e) => handleDescChange('hairStyle', e.target.value)}
                      style={{ width: '100%', marginTop: '6px', padding: '8px 10px', borderRadius: '4px', border: '1px solid #711a19', fontSize: '0.85rem' }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: BACKGROUND CHARACTERISTICS & BACKSTORY */}
            <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                {/* Left Column: BACKGROUND CHARACTERISTICS */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', fontWeight: '800', marginBottom: '4px', letterSpacing: '0.5px' }}>
                    BACKGROUND CHARACTERISTICS
                  </h4>
                  <p style={{ color: 'var(--color-gray)', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '18px' }}>
                    การเติมเต็มบุคลิกภาพของตัวละคร ทั้งลักษณะนิสัย กิริยาท่าทาง ความเชื่อ อุดมการณ์ และข้อบกพร่อง จะช่วยสร้างเอกลักษณ์เฉพาะตัวและทำให้ตัวละครมีชีวิตชีวาขึ้นมาในการเล่นเกม
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-gray)', letterSpacing: '0.5px', marginBottom: '6px' }}>
                        PERSONALITY TRAITS
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. ฉันเป็นคนสุภาพและให้เกียรติผู้อื่นเสมอ / ฉันตัดสินคนจากการกระทำ ไม่ใช่คำพูด..."
                        value={desc.personality || ''}
                        onChange={(e) => handleDescChange('personality', e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', color: 'var(--color-ink)', fontFamily: 'inherit', resize: 'vertical' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-gray)', letterSpacing: '0.5px', marginBottom: '6px' }}>
                        IDEAL
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. ความเอื้อเฟื้อ: ฉันพยายามช่วยเหลือผู้เดือดร้อนเสมอ ไม่ว่าจะต้องแลกด้วยสิ่งใด..."
                        value={desc.ideals || ''}
                        onChange={(e) => handleDescChange('ideals', e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', color: 'var(--color-ink)', fontFamily: 'inherit', resize: 'vertical' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-gray)', letterSpacing: '0.5px', marginBottom: '6px' }}>
                        BOND
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. ฉันติดหนี้บุญคุณผู้มีพระคุณที่คอยดูแลฉันในวัยเยาว์..."
                        value={desc.bonds || ''}
                        onChange={(e) => handleDescChange('bonds', e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', color: 'var(--color-ink)', fontFamily: 'inherit', resize: 'vertical' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-gray)', letterSpacing: '0.5px', marginBottom: '6px' }}>
                        FLAW
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. ฉันเป็นคนหัวรั้นยึดติดกับความคิดตัวเอง / ฉันไว้ใจผู้อื่นง่ายเกินไป..."
                        value={desc.flaws || ''}
                        onChange={(e) => handleDescChange('flaws', e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', color: 'var(--color-ink)', fontFamily: 'inherit', resize: 'vertical' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: BACKSTORY */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', fontWeight: '800', marginBottom: '4px', letterSpacing: '0.5px' }}>
                    BACKSTORY
                  </h4>
                  <p style={{ color: 'var(--color-gray)', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '18px' }}>
                    ทุกเรื่องราวย่อมมีจุดเริ่มต้น เรื่องราวเบื้องหลังจะบอกเล่าว่าคุณมาจากไหน กลายมาเป็นนักผจญภัยได้อย่างไร และบทบาทของคุณในโลกใบนี้คืออะไร
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-gray)', letterSpacing: '0.5px', marginBottom: '6px' }}>
                      WRITE YOUR STORY
                    </label>
                    <textarea
                      placeholder="บอกเล่าเรื่องราวอดีตของตัวละคร เหตุการณ์สำคัญ มิตรสหาย ศัตรู และแรงผลักดันที่ทำให้ก้าวเข้าสู่ชีวิตการเป็นนักผจญภัย..."
                      value={desc.backstory || ''}
                      onChange={(e) => handleDescChange('backstory', e.target.value)}
                      style={{ width: '100%', minHeight: '340px', height: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', color: 'var(--color-ink)', fontFamily: 'inherit', lineHeight: '1.6', resize: 'vertical', flex: 1 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
}
