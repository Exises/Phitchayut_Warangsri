import Swal from 'sweetalert2';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const getClassIcon = (classId) => {
  const id = (classId || '').toLowerCase();
  switch(id) {
    case 'barbarian': return 'fa-solid fa-gavel';
    case 'bard': return 'fa-solid fa-guitar';
    case 'cleric': return 'fa-solid fa-hand-holding-medical';
    case 'druid': return 'fa-solid fa-leaf';
    case 'fighter': return 'fa-solid fa-shield-halved';
    case 'monk': return 'fa-solid fa-hand-fist';
    case 'paladin': return 'fa-solid fa-cross';
    case 'ranger': return 'fa-solid fa-bullseye';
    case 'rogue': return 'fa-solid fa-user-ninja';
    case 'sorcerer': return 'fa-solid fa-fire-flame-curved';
    case 'warlock': return 'fa-solid fa-eye';
    case 'wizard': return 'fa-solid fa-hat-wizard';
    case 'artificer': return 'fa-solid fa-gear';
    default: return 'fa-solid fa-user-shield';
  }
};

const getClassColor = (classId) => {
  const id = (classId || '').toLowerCase();
  switch(id) {
    case 'barbarian': return '#b91c1c'; // red-700
    case 'bard': return '#7c3aed'; // violet-600
    case 'cleric': return '#2563eb'; // blue-600
    case 'druid': return '#15803d'; // green-700
    case 'fighter': return 'var(--color-gray)'; // slate-600
    case 'monk': return '#0284c7'; // sky-600
    case 'paladin': return '#d97706'; // amber-600
    case 'ranger': return '#166534'; // green-800
    case 'rogue': return 'var(--color-ink)'; // slate-800
    case 'sorcerer': return '#dc2626'; // red-600
    case 'warlock': return '#6d28d9'; // purple-700
    case 'wizard': return '#4338ca'; // indigo-700
    case 'artificer': return '#b45309'; // amber-700
    default: return '#711a19'; // default crimson
  }
};

function Sheets() {
  const [isLoggedIn] = useState(() => Boolean(localStorage.getItem('dnd_user')));
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  const getCurrentUserId = () => {
    try {
      const u = JSON.parse(localStorage.getItem('dnd_user'));
      if (u && u.user_id) return parseInt(u.user_id) || 1;
    } catch (e) {}
    return 1;
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:5000/api?action=get_user_characters&user_id=${getCurrentUserId()}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setCharacters(data);
      } else if (data.error) {
        setError(data.error);
      } else {
        setCharacters([]);
      }
    } catch (err) {
      console.error('Failed to load characters:', err);
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์เพื่อดึงข้อมูลตัวละครได้');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    localStorage.removeItem('workshop_characterState');
    localStorage.removeItem('workshop_load_char_id');
    localStorage.setItem('workshop_currentStep', JSON.stringify(1));
    navigate('/workshop?autoOpen=true');
  };

  const handlePlay = (char) => {
    localStorage.setItem('workshop_load_char_id', char.char_id);
    navigate(`/character/${char.char_id}`);
  };

  const handleEdit = (char) => {
    localStorage.setItem('workshop_load_char_id', char.char_id);
    localStorage.setItem('workshop_currentStep', JSON.stringify(1));
    navigate(`/workshop?autoOpen=true&load_char_id=${char.char_id}&step=1`);
  };

  const handleExportJson = async (char) => {
    try {
      const u = JSON.parse(localStorage.getItem('dnd_user') || '{}');
      const uid = u.user_id || '';
      const res = await fetch(`http://localhost:5000/api?action=get_character_by_id&id=${char.char_id}&user_id=${uid}`);
      const charObj = await res.json();
      if (charObj && !charObj.error) {
        const exportPayload = charObj.build_data || charObj;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `${(char.char_name || 'character').replace(/\s+/g, '_')}_DND2024.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      }
    } catch (err) {
      alert('ไม่สามารถดาวน์โหลดไฟล์ตัวละครได้: ' + err.message);
    }
  };

  const handleImportJson = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (!importedData.description || !importedData.classData) {
          throw new Error('ไฟล์ไม่ถูกต้องหรือไม่ใช่ไฟล์ตัวละคร D&D Companion');
        }
        
        // ลบ ID ออกเพื่อให้ถือเป็นการสร้างตัวละครใหม่ (ไม่เซฟทับตัวเก่าถ้าเคยมี)
        delete importedData.char_id;
        
        // บันทึกลง LocalStorage ให้ Workshop อ่านเป็น Draft
        localStorage.setItem('workshop_characterState', JSON.stringify(importedData));
        localStorage.setItem('workshop_currentStep', "1");
        localStorage.removeItem('workshop_load_char_id');
        
        // พาไปหน้า Workshop เพื่อให้ผู้ใช้กดยืนยันเซฟ
        navigate('/workshop?autoOpen=true&step=1');
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + err.message);
      }
      // รีเซ็ตค่า input เผื่อต้องการอัปโหลดไฟล์เดิมอีกครั้ง
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleDelete = async (charId, charName) => {
    const { value: typedText } = await Swal.fire({
      title: '⚠️ ยืนยันการลบตัวละคร',
      html: `
        <div style="text-align: left; margin-top: 10px;">
          <p style="margin-bottom: 10px;">คุณกำลังจะลบตัวละคร <strong>"${charName}"</strong> อย่างถาวร</p>
          <p style="color: #991b1b; font-size: 0.9em; margin-bottom: 15px; padding: 10px; background-color: #fee2e2; border-left: 4px solid #dc2626; border-radius: 4px;">
            ⚠️ <strong>คำเตือน:</strong> ข้อมูลแผ่นตัวละคร (Character Sheet), สถิติ, พลังชีวิต, และสิ่งของในช่องเก็บของทั้งหมดของตัวละครนี้ จะถูกลบทิ้งจากฐานข้อมูลและ<strong>ไม่สามารถกู้คืนได้อีก</strong>
          </p>
          <p style="font-size: 0.9em; font-weight: bold; margin-bottom: 5px;">
            โปรดยืนยันโดยการพิมพ์คำว่า <span style="color: #dc2626; letter-spacing: 1px; user-select: none;">DELETE</span> ลงในช่องด้านล่าง:
          </p>
        </div>
      `,
      input: 'text',
      inputPlaceholder: 'พิมพ์ DELETE',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#711a19',
      cancelButtonColor: '#a8a29e',
      confirmButtonText: '<i className="fa-solid fa-trash"></i> ลบตัวละครถาวร',
      cancelButtonText: 'ยกเลิก',
      background: 'var(--bg-paper, #fdf9ec)',
      color: 'var(--color-ink, #333333)',
      inputValidator: (value) => {
        if (value !== 'DELETE') {
          return 'กรุณาพิมพ์คำว่า DELETE ตัวพิมพ์ใหญ่ทั้งหมดให้ถูกต้องเพื่อยืนยัน';
        }
      }
    });

    if (typedText !== 'DELETE') {
      return;
    }

    setDeletingId(charId);
    try {
      const res = await fetch('http://localhost:5000/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_character', char_id: charId, user_id: getCurrentUserId() })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setCharacters(prev => prev.filter(c => c.char_id !== charId));
        Swal.fire({
          title: 'ลบสำเร็จ',
          text: `ตัวละคร "${charName}" ถูกลบออกจากสารบบแล้ว`,
          icon: 'success',
          background: 'var(--bg-paper, #fdf9ec)',
          color: 'var(--color-ink, #333333)',
          confirmButtonColor: '#711a19',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          title: 'ลบไม่สำเร็จ',
          text: data.message || 'Unknown error',
          icon: 'error',
          background: 'var(--bg-paper, #fdf9ec)',
          color: 'var(--color-ink, #333333)',
          confirmButtonColor: '#711a19'
        });
      }
    } catch (err) {
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: err.message,
        icon: 'error',
        background: 'var(--bg-paper, #fdf9ec)',
        color: 'var(--color-ink, #333333)',
        confirmButtonColor: '#711a19'
      });
    } finally {
      setDeletingId(null);
    }
  };

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

  // Filter & Search
  const filteredCharacters = characters.filter(c => {
    const matchesSearch = !searchQuery || (
      (c.char_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.species_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.primary_class_id || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesClass = selectedClassFilter === 'ALL' || (c.primary_class_id || '').toLowerCase() === selectedClassFilter.toLowerCase();
    return matchesSearch && matchesClass;
  });

  const classFilters = [
    { id: 'ALL', label: 'ทั้งหมด' },
    { id: 'Fighter', label: 'Fighter' },
    { id: 'Wizard', label: 'Wizard' },
    { id: 'Cleric', label: 'Cleric' },
    { id: 'Rogue', label: 'Rogue' },
    { id: 'Paladin', label: 'Paladin' },
    { id: 'Barbarian', label: 'Barbarian' },
    { id: 'Bard', label: 'Bard' },
    { id: 'Druid', label: 'Druid' },
    { id: 'Monk', label: 'Monk' },
    { id: 'Ranger', label: 'Ranger' },
    { id: 'Sorcerer', label: 'Sorcerer' },
    { id: 'Warlock', label: 'Warlock' },
    { id: 'Artificer', label: 'Artificer' },
  ];

  return (
    <div id="page-sheets" className="page animate-fade-in" style={{ paddingBottom: '60px' }}>
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #2b0c0c 0%, #4a1212 50%, #1a1a1a 100%)',
        color: 'var(--bg-white)',
        padding: '40px 20px',
        borderRadius: '12px',
        margin: '20px auto 30px auto',
        maxWidth: '1240px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(212, 175, 55, 0.3)'
      }}>
        <div style={{ position: 'absolute', right: '-30px', top: '-30px', opacity: '0.08', fontSize: '15rem', pointerEvents: 'none', color: '#d4af37' }}>
          <i className="fa-solid fa-dragon"></i>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ backgroundColor: 'rgba(212, 175, 55, 0.2)', color: '#d4af37', padding: '6px 14px', borderRadius: '20px', fontSize: '0.88rem', fontWeight: 'bold', border: '1px solid rgba(212, 175, 55, 0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-users"></i> ตัวละครทั้งหมด: <b style={{ color: 'var(--bg-white)', marginLeft: '2px' }}>{characters.length}</b> ตัว
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-header)', fontSize: '2.4rem', color: '#fff', margin: '0 0 10px 0', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              คลังตัวละครของฉัน <span style={{ color: '#d4af37' }}>(My Characters)</span>
            </h1>
            <p style={{ color: 'var(--border-color)', fontSize: '1.05rem', margin: 0, maxWidth: '680px', lineHeight: '1.6' }}>
              จัดการข้อมูลนักผจญภัยของคุณทั้งหมด พร้อมเข้าสู่โหมดชีตต่อสู้ (Combat Sheet), ปรับแต่งเลเวล, หรือส่งออกไฟล์ JSON เพื่อนำไปใช้เล่นต่อได้ทันที
            </p>
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <input 
              type="file" 
              id="import-json-input" 
              accept=".json" 
              style={{ display: 'none' }} 
              onChange={handleImportJson} 
            />
            <button
              onClick={() => document.getElementById('import-json-input').click()}
              style={{
                backgroundColor: 'transparent',
                color: '#d4af37',
                padding: '14px 24px',
                borderRadius: '8px',
                border: '2px solid #d4af37',
                fontWeight: '800',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.2s',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
              }}
              onMouseOver={e => {
                e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <i className="fa-solid fa-file-import text-lg"></i> นำเข้าตัวละคร
            </button>

            <button
              onClick={handleCreateNew}
              style={{
                backgroundColor: '#d4af37',
                color: '#1a1a1a',
                padding: '14px 28px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '800',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)',
                transition: 'all 0.2s transform'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <i className="fa-solid fa-plus text-lg"></i> สร้างตัวละครใหม่
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 15px' }}>
        {/* Filter & Search Bar */}
        <div style={{
          backgroundColor: 'var(--bg-white)',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          marginBottom: '30px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '15px',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid #e2e8f0'
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '400px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray)' }}></i>
            <input
              type="text"
              placeholder="ค้นหาชื่อตัวละคร, อาชีพ, หรือเผ่าพันธุ์..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 15px 10px 42px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#711a19'}
              onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>

          {/* Class Pills */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', flex: '2 1 500px' }}>
            {classFilters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setSelectedClassFilter(filter.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: selectedClassFilter === filter.id ? 'bold' : 'normal',
                  border: selectedClassFilter === filter.id ? '1px solid #711a19' : '1px solid #e2e8f0',
                  backgroundColor: selectedClassFilter === filter.id ? '#711a19' : 'var(--bg-white)',
                  color: selectedClassFilter === filter.id ? 'var(--bg-white)' : 'var(--color-gray)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <i className="fa-solid fa-spinner fa-spin text-4xl" style={{ color: '#711a19', marginBottom: '15px' }}></i>
            <h3 style={{ color: 'var(--color-gray)', fontSize: '1.2rem' }}>กำลังโหลดคลังตัวละครของคุณ...</h3>
          </div>
        ) : error ? (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #f87171', borderRadius: '8px', padding: '30px', textAlign: 'center', margin: '20px 0' }}>
            <i className="fa-solid fa-triangle-exclamation text-4xl" style={{ color: '#ef4444', marginBottom: '15px' }}></i>
            <h3 style={{ color: '#991b1b', fontSize: '1.2rem', marginBottom: '10px' }}>เกิดข้อผิดพลาด</h3>
            <p style={{ color: '#b91c1c', marginBottom: '20px' }}>{error}</p>
            <button onClick={fetchCharacters} style={{ padding: '10px 20px', backgroundColor: '#dc2626', color: 'var(--bg-white)', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              <i className="fa-solid fa-rotate mr-2"></i> ลองใหม่อีกครั้ง
            </button>
          </div>
        ) : filteredCharacters.length === 0 ? (
          <div style={{ backgroundColor: 'var(--bg-white)', borderRadius: '12px', padding: '60px 20px', textAlign: 'center', border: '2px dashed #cbd5e1', margin: '20px 0' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--bg-sidebar)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', color: 'var(--color-gray)', fontSize: '2.2rem' }}>
              <i className="fa-solid fa-folder-open"></i>
            </div>
            <h3 style={{ color: 'var(--color-ink)', fontSize: '1.4rem', marginBottom: '10px' }}>ไม่พบตัวละครที่ตรงเงื่อนไข</h3>
            <p style={{ color: 'var(--color-gray)', maxWidth: '450px', margin: '0 auto 25px auto', lineHeight: '1.6' }}>
              {searchQuery || selectedClassFilter !== 'ALL' 
                ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรองอาชีพใหม่อีกครั้ง'
                : 'คุณยังไม่มีตัวละครในคลัง เริ่มสร้างนักผจญภัยคนแรกของคุณได้ทันทีตอนนี้!'}
            </p>
            {searchQuery || selectedClassFilter !== 'ALL' ? (
              <button
                onClick={() => { setSearchQuery(''); setSelectedClassFilter('ALL'); }}
                style={{ padding: '10px 22px', backgroundColor: 'var(--color-gray)', color: 'var(--bg-white)', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                ล้างตัวกรองทั้งหมด
              </button>
            ) : (
              <button
                onClick={handleCreateNew}
                style={{ padding: '12px 28px', backgroundColor: '#711a19', color: 'var(--bg-white)', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(113, 26, 25, 0.2)' }}
              >
                <i className="fa-solid fa-plus mr-2"></i> สร้างตัวละครแรก
              </button>
            )}
          </div>
        ) : (
          /* Character Cards Grid */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px' }}>
            {filteredCharacters.map(char => {
              const primaryClass = char.primary_class_id || 'Adventurer';
              const classColor = getClassColor(primaryClass);
              const classIcon = getClassIcon(primaryClass);
              const hpMax = char.hp_max || 10;
              const hpCur = char.hp_current !== null && char.hp_current !== undefined ? char.hp_current : hpMax;
              const hpPct = Math.max(0, Math.min(100, Math.round((hpCur / hpMax) * 100)));
              const isDeleting = deletingId === char.char_id;

              return (
                <div
                  key={char.char_id}
                  style={{
                    backgroundColor: 'var(--bg-white)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    position: 'relative'
                  }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(0,0,0,0.12)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.06)'; }}
                >
                  {/* Class Color Header Bar */}
                  <div style={{ backgroundColor: classColor, padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--bg-white)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <i className={`${classIcon} text-lg`}></i>
                      <span>{primaryClass}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        Level {char.char_level || 1}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '16px' }}>
                      {/* Avatar / Icon */}
                      {(() => {
                        let avatar = char.avatar_url;
                        if (!avatar && char.build_data) {
                          try {
                            const bd = typeof char.build_data === 'string' ? JSON.parse(char.build_data) : char.build_data;
                            avatar = bd?.description?.avatarUrl;
                          } catch (e) {}
                        }
                        return avatar ? (
                          <img
                            src={avatar}
                            alt={char.char_name || 'Hero'}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            style={{
                              width: '64px',
                              height: '64px',
                              borderRadius: '10px',
                              objectFit: 'cover',
                              border: `2px solid ${classColor}`,
                              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                              flexShrink: 0
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '10px',
                            backgroundColor: 'var(--bg-white)',
                            border: `2px solid ${classColor}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.8rem',
                            color: classColor,
                            flexShrink: 0
                          }}>
                            <i className={classIcon}></i>
                          </div>
                        );
                      })()}

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.3rem', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {char.char_name || 'Unnamed Hero'}
                        </h3>
                        <div style={{ color: 'var(--color-gray)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <i className="fa-solid fa-dna text-xs"></i>
                          <span style={{ textTransform: 'capitalize' }}>{char.species_id || 'Human'}</span>
                          {char.lineage_id && <span style={{ color: 'var(--color-gray)' }}>({char.lineage_id})</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <span style={{ backgroundColor: 'var(--bg-sidebar)', color: 'var(--color-gray)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                            {char.char_alignment || 'True Neutral'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* HP Bar */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', fontWeight: '600', marginBottom: '5px' }}>
                        <span style={{ color: 'var(--color-gray)' }}><i className="fa-solid fa-heart mr-1 text-red-600"></i> Hit Points</span>
                        <span style={{ color: hpPct > 50 ? '#16a34a' : hpPct > 20 ? '#d97706' : '#dc2626' }}>{hpCur} / {hpMax} HP ({hpPct}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${hpPct}%`,
                          height: '100%',
                          backgroundColor: hpPct > 50 ? '#22c55e' : hpPct > 20 ? '#f59e0b' : '#ef4444',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>

                    {/* Stats Overview Pill Bar */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', backgroundColor: 'var(--bg-white)', padding: '8px', borderRadius: '6px', textAlign: 'center', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-gray)', fontWeight: 'bold' }}>STR</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-ink)' }}>{char.str_score || 10}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-gray)', fontWeight: 'bold' }}>DEX</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-ink)' }}>{char.dex_score || 10}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-gray)', fontWeight: 'bold' }}>CON</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-ink)' }}>{char.con_score || 10}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-gray)', fontWeight: 'bold' }}>INT</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-ink)' }}>{char.int_score || 10}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-gray)', fontWeight: 'bold' }}>WIS</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-ink)' }}>{char.wis_score || 10}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-gray)', fontWeight: 'bold' }}>CHA</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-ink)' }}>{char.cha_score || 10}</div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--color-gray)', textAlign: 'right', marginTop: 'auto' }}>
                      บันทึกล่าสุด: {char.updated_at ? new Date(char.updated_at).toLocaleDateString('th-TH') : 'ไม่ระบุ'}
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '6px', padding: '12px 16px', backgroundColor: 'var(--bg-white)', borderTop: '1px solid #e2e8f0' }}>
                    <button
                      onClick={() => handlePlay(char)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#711a19',
                        color: 'var(--bg-white)',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '700',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = '#8c201f'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = '#711a19'}
                    >
                      <i className="fa-solid fa-gamepad"></i> เล่นตัวละคร
                    </button>

                    <button
                      onClick={() => handleEdit(char)}
                      title="แก้ไขใน Workshop"
                      style={{
                        padding: '8px',
                        backgroundColor: 'var(--bg-white)',
                        color: 'var(--color-gray)',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--color-gray)'; e.currentTarget.style.backgroundColor = 'var(--bg-sidebar)'; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.backgroundColor = 'var(--bg-white)'; }}
                    >
                      <i className="fa-solid fa-pen text-slate-700"></i>
                    </button>

                    <button
                      onClick={() => handleExportJson(char)}
                      title="ดาวน์โหลดไฟล์ JSON"
                      style={{
                        padding: '8px',
                        backgroundColor: 'var(--bg-white)',
                        color: 'var(--color-gray)',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = '#0284c7'; e.currentTarget.style.color = '#0284c7'; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--color-gray)'; }}
                    >
                      <i className="fa-solid fa-file-export"></i>
                    </button>

                    <button
                      onClick={() => handleDelete(char.char_id, char.char_name)}
                      disabled={isDeleting}
                      title="ลบตัวละคร"
                      style={{
                        padding: '8px',
                        backgroundColor: 'var(--bg-white)',
                        color: isDeleting ? 'var(--color-gray)' : '#ef4444',
                        border: '1px solid #fca5a5',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        cursor: isDeleting ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={e => !isDeleting && (e.currentTarget.style.backgroundColor = '#fef2f2')}
                      onMouseOut={e => !isDeleting && (e.currentTarget.style.backgroundColor = 'var(--bg-white)')}
                    >
                      {isDeleting ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-trash-can"></i>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Sheets;
