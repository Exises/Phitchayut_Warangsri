import React, { useState, useEffect } from 'react';

export default function CharacterLogsDrawer({ isOpen, onClose, charId, localLogs = [] }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    if (!charId) return;
    setLoading(true);
    try {
      let dbLogs = [];
      if (charId && charId !== 'current') {
        const res = await fetch(`http://localhost:5000/api?action=get_character_logs&char_id=${charId}&category=gameplay`);
        const data = await res.json();
        if (Array.isArray(data)) dbLogs = data;
      }

      // Convert local session roll history into drawer log format
      const convertedLocal = (localLogs || []).map((l, i) => ({
        log_id: 'local_' + i + '_' + (l.timestamp || Date.now()),
        char_id: charId,
        category: 'gameplay',
        action_type: 'DICE_ROLL',
        title: l.title || 'การทอยเต๋า',
        formula: l.formula || '',
        total: l.total !== undefined ? l.total : '✓',
        log_text_th: l.title ? `ทอย ${l.title}: ได้ผลรวม ${l.total} (${l.formula || ''})` : (l.log_text_th || 'การทอยลูกเต๋า'),
        created_at: l.timestamp || 'เซสชันปัจจุบัน'
      }));

      // Combine DB logs with local session roll history
      const combined = [...dbLogs];
      convertedLocal.forEach(loc => {
        if (!combined.some(db => db.log_text_th === loc.log_text_th)) {
          combined.push(loc);
        }
      });

      setLogs(combined);
    } catch (err) {
      console.error("Failed to fetch dice roll logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && charId) {
      fetchLogs();
    }
  }, [isOpen, charId]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter(log => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const text = String(log.log_text_th || '').toLowerCase();
    const title = String(log.title || '').toLowerCase();
    return text.includes(term) || title.includes(term);
  });

  const handleExportLogs = () => {
    if (logs.length === 0) return;
    const exportText = logs.map(l => `[${l.created_at || 'N/A'}] 🎲 ${l.log_text_th || (l.title + ': ' + l.total)}`).join('\n');
    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `character_${charId}_roll_history.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(3px)',
      zIndex: 99999,
      display: 'flex',
      justifyContent: 'flex-end',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        height: '100%',
        backgroundColor: '#fff',
        boxShadow: '-8px 0 25px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '3px solid #711a19'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#fdfbf7',
          borderBottom: '1px solid #e2e8f0',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-dice-d20" style={{ color: '#711a19', fontSize: '1.4rem' }}></i>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#711a19', fontWeight: 'bold', fontFamily: 'var(--font-header)' }}>
                บันทึกประวัติการทอยเต๋า
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Dice Roll History & Results</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'none', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer', padding: '4px' }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Search Bar & Actions */}
        <div style={{ padding: '12px 16px', display: 'flex', gap: '8px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fafafa' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              placeholder="ค้นหาประวัติการทอย (เช่น Perception, Attack, 20)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            />
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.8rem' }}></i>
          </div>
          <button
            onClick={fetchLogs}
            title="รีเฟรชข้อมูล"
            style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            <i className="fa-solid fa-rotate"></i>
          </button>
          <button
            onClick={handleExportLogs}
            title="ส่งออกไฟล์บันทึกการทอย"
            style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #711a19', backgroundColor: '#fef2f2', color: '#711a19', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
          >
            <i className="fa-solid fa-file-export"></i>
          </button>
        </div>

        {/* Log Stream List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#fdfbf7' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: '0.9rem' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px', color: '#711a19' }}></i> กำลังโหลดประวัติการทอย...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '0.9rem' }}>
              <i className="fa-solid fa-dice-d20" style={{ fontSize: '2rem', display: 'block', marginBottom: '10px', opacity: 0.4, color: '#711a19' }}></i>
              ยังไม่มีประวัติการทอยเต๋าในเซสชันนี้
            </div>
          ) : (
            filteredLogs.map((item, idx) => (
              <div key={item.log_id || idx} style={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #711a19',
                borderRadius: '8px',
                padding: '12px 14px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#1e293b' }}>
                      🎲 {item.title || item.log_text_th?.split(':')[0]?.replace('ทอย ', '') || 'การทอยเต๋า'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    สูตร/สูตรคำนวณ: <span style={{ fontFamily: 'monospace', color: '#334155' }}>{item.formula || item.metadata_json?.formula || '-'}</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    <i className="fa-regular fa-clock" style={{ marginRight: '4px' }}></i>
                    {item.created_at || 'เซสชันปัจจุบัน'}
                  </span>
                </div>
                <div style={{
                  backgroundColor: '#711a19',
                  color: '#fff',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  minWidth: '46px',
                  textAlign: 'center',
                  boxShadow: '0 2px 4px rgba(113, 26, 25, 0.2)'
                }}>
                  {item.total !== undefined ? item.total : (item.metadata_json?.total ?? '✓')}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#fff', textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
          🎲 บันทึกประวัติการทอยเต๋าทั้งหมดจากเซสชันปัจจุบัน
        </div>
      </div>
    </div>
  );
}

