import sys

with open('src/pages/AdminDashboard.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

state_injection = "  const [selectedItem, setSelectedItem] = useState(null);\n  const [feedbackDeviceFilter, setFeedbackDeviceFilter] = useState('All');\n"

text = text.replace("  const [selectedItem, setSelectedItem] = useState(null);\n", state_injection)

# Add useMemo for feedback stats
memo_injection = """
  const feedbackStats = useMemo(() => {
    let filtered = feedbacks;
    if (feedbackDeviceFilter !== 'All') {
      filtered = feedbacks.filter(f => f.device_info === feedbackDeviceFilter);
    }
    const total = filtered.length;
    const unread = filtered.filter(f => f.is_read === 0 || f.status === 'new').length;
    
    // Calculate average rating
    const totalRating = filtered.reduce((acc, f) => acc + (parseInt(f.rating) || 5), 0);
    const avgRating = total > 0 ? (totalRating / total).toFixed(1) : '0.0';
    
    return { total, unread, avgRating };
  }, [feedbacks, feedbackDeviceFilter]);
"""

text = text.replace("  // === CATALOG FILTER & SEARCH LOGIC ===", memo_injection + "\n  // === CATALOG FILTER & SEARCH LOGIC ===")

# Inject UI
ui_injection = """
          {/* TAB 4: FEEDBACK & BUG REPORTS (EMAIL LAYOUT) */}
          {activeTab === 'feedback' && (
            <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, color: '#f1f5f9' }}>
                    <i className="fa-solid fa-inbox" style={{marginRight:"8px"}}></i>กล่องข้อความช่วยเหลือ
                  </h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>จัดการความคิดเห็น รายงานข้อผิดพลาด และข้อซักถามจากผู้ใช้ในรูปแบบอีเมลระดับมืออาชีพ</p>
                </div>
              </div>

              {/* FEEDBACK KPI SUMMARY DASHBOARD */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <div className="admin-kpi-card glow-blue" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600' }}>เรตติ้งเฉลี่ย (Average)</span>
                    <i className="fa-solid fa-star" style={{ color: '#3b82f6', fontSize: '1.2rem' }}></i>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f8fafc' }}>{feedbackStats.avgRating} <span style={{fontSize:'1rem', color:'#64748b'}}>/ 5</span></div>
                  
                  {/* Device Filter inside Rating card for UI compactness */}
                  <select 
                    value={feedbackDeviceFilter}
                    onChange={(e) => setFeedbackDeviceFilter(e.target.value)}
                    style={{ marginTop: '12px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', outline: 'none' }}
                  >
                    <option value="All">ทุกอุปกรณ์ (All Devices)</option>
                    <option value="คอมพิวเตอร์ / โน้ตบุ๊ก (Desktop)">คอมพิวเตอร์ / โน้ตบุ๊ก (Desktop)</option>
                    <option value="ไอโฟน / ไอแพด (iOS)">ไอโฟน / ไอแพด (iOS)</option>
                    <option value="สมาร์ทโฟน Android">สมาร์ทโฟน Android</option>
                    <option value="แท็บเล็ต (Tablet)">แท็บเล็ต (Tablet)</option>
                    <option value="อื่นๆ (Other)">อื่นๆ (Other)</option>
                  </select>
                </div>

                <div className="admin-kpi-card glow-purple" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600' }}>ข้อความทั้งหมด</span>
                    <i className="fa-solid fa-envelope" style={{ color: '#8b5cf6', fontSize: '1.2rem' }}></i>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f8fafc' }}>{feedbackStats.total}</div>
                </div>

                <div className="admin-kpi-card glow-red" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600' }}>รอการตรวจสอบ (Unread)</span>
                    <i className="fa-solid fa-bell" style={{ color: '#ef4444', fontSize: '1.2rem' }}></i>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f8fafc' }}>{feedbackStats.unread}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden' }}>
"""

# Replace the specific tab 4 header
old_tab_header = """          {/* TAB 4: FEEDBACK & BUG REPORTS (EMAIL LAYOUT) */}
          {activeTab === 'feedback' && (
            <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, color: '#f1f5f9' }}>
                    <i className="fa-solid fa-inbox" style={{marginRight:"8px"}}></i>กล่องข้อความช่วยเหลือ
                  </h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>จัดการความคิดเห็น รายงานข้อผิดพลาด และข้อซักถามจากผู้ใช้ในรูปแบบอีเมลระดับมืออาชีพ</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden' }}>"""

text = text.replace(old_tab_header, ui_injection)

with open('src/pages/AdminDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Added feedback dashboard summary')
