import Swal from 'sweetalert2';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import SpeciesForm from '../components/admin/SpeciesForm';
import ClassForm from '../components/admin/ClassForm';
import BackgroundForm from '../components/admin/BackgroundForm';
import FeatForm from '../components/admin/FeatForm';
import SpellForm from '../components/admin/SpellForm';
import ItemForm from '../components/admin/ItemForm';
import SubclassForm from '../components/admin/SubclassForm';
// Utility helper for random avatar color badges
const getAvatarColor = (name) => {
  const colors = [
    { bg: '#fee2e2', text: '#991b1b' },
    { bg: '#eff6ff', text: '#1d4ed8' },
    { bg: '#f0fdf4', text: '#166534' },
    { bg: '#fef3c7', text: '#92400e' },
    { bg: '#faf5ff', text: '#6b21a8' },
    { bg: '#ecfeff', text: '#0369a1' },
    { bg: '#f0fdfa', text: '#115e59' }
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Admin Authentication State
  const [adminUser, setAdminUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'catalog' | 'users' | 'feedback'
  const [catalogSubTab, setCatalogSubTab] = useState('items'); // 'items' | 'spells' | 'races' | 'classes' | 'backgrounds' | 'feats'

  // Master Data States
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    characters: 0,
    spells: 0,
    items: 0,
    races: 0,
    classes: 0,
    feats: 0,
    backgrounds: 0,
    feedbacks: 0,
    unread_feedbacks: 0,
    bug_feedbacks: 0
  });

  const [usersList, setUsersList] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [ccData, setCcData] = useState({
    races: [],
    lineages: [],
    classes: [],
    subclasses: [],
    backgrounds: [],
    spells: [],
    feats: [],
    items: []
  });

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterSubcategory, setFilterSubcategory] = useState('all');
  const [filterSpellSchool, setFilterSpellSchool] = useState('all');
  const [filterSpellLevel, setFilterSpellLevel] = useState('all');
  const [filterClassHitDie, setFilterClassHitDie] = useState('all');
  const [filterFeatType, setFilterFeatType] = useState('all');

  // Modal & Form States
  const [modalType, setModalType] = useState(null); // 'user_edit' | 'feedback_respond' | 'item_form' | 'spell_form' | 'race_form' | 'class_form' | 'delete_confirm'
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  // Load Admin Profile from localStorage
  useEffect(() => {
    const savedAdmin = localStorage.getItem('dnd_admin');
    const savedUser = localStorage.getItem('dnd_user');

    let adminObj = null;
    if (savedAdmin) {
      try {
        const parsed = JSON.parse(savedAdmin);
        if (parsed.role === 'admin') adminObj = parsed;
      } catch (e) {}
    }

    if (!adminObj && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.role === 'admin') adminObj = parsed;
      } catch (e) {}
    }

    if (!adminObj) {
      navigate('/admin-login');
      return;
    }
    setAdminUser(adminObj);
  }, [navigate]);

  const handleAdminLogout = () => {
    localStorage.removeItem('dnd_admin');
    navigate('/admin-login');
  };

  // Fetch Master Data
  const refreshAllData = async () => {
    if (!adminUser?.user_id) return;
    setLoading(true);
    try {
      // 1. Fetch Stats
      const statsRes = await fetch('http://localhost:5000/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_admin_stats', admin_id: adminUser.user_id })
      });
      const statsJson = await statsRes.json();
      if (statsJson.status === 'success') setStats(statsJson.stats);

      // 2. Fetch Catalog (get_cc_data)
      const ccRes = await fetch('http://localhost:5000/api?action=get_cc_data');
      const ccJson = await ccRes.json();
      setCcData(ccJson || {});

      // 3. Fetch Users List
      const usersRes = await fetch('http://localhost:5000/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_users', admin_id: adminUser.user_id })
      });
      const usersJson = await usersRes.json();
      if (usersJson.status === 'success') setUsersList(usersJson.users || []);

      // 4. Fetch Feedback List
      const fbRes = await fetch('http://localhost:5000/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_feedbacks', admin_id: adminUser.user_id })
      });
      const fbJson = await fbRes.json();
      if (fbJson.status === 'success') setFeedbackList(fbJson.feedbacks || []);

    } catch (err) {
      console.error("Error refreshing admin data:", err);
      showToast("ไม่สามารถดึงข้อมูลจากเซิร์ฟเวอร์ได้", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminUser?.user_id) {
      refreshAllData();
    }
  }, [adminUser]);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --------------------------------------------------------------------------
  // USER MANAGEMENT HANDLERS
  // --------------------------------------------------------------------------
  const handleOpenUserEdit = (user) => {
    setSelectedItem(user);
    setFormData({
      user_id: user.user_id,
      user_name: user.user_name || '',
      user_email: user.user_email || '',
      role: user.role || 'user',
      status: user.status || 'active',
      new_password: ''
    });
    setModalType('user_edit');
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_user',
          admin_id: adminUser.user_id,
          target_user_id: formData.user_id,
          user_name: formData.user_name,
          user_email: formData.user_email,
          role: formData.role,
          status: formData.status,
          new_password: formData.new_password || null
        })
      });
      const json = await res.json();
      if (json.status === 'success') {
        showToast("อัปเดตข้อมูลผู้ใช้งานเรียบร้อย");
        setModalType(null);
        refreshAllData();
      } else {
        showToast(`❌ ${json.message}`, "error");
      }
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการบันทึกข้อมูล", "error");
    }
  };


  const handleToggleUserStatus = async (user, newStatus) => {
    const actionText = newStatus === 'suspended' ? 'ระงับ' : 'ปลดระงับ';
    const result = await Swal.fire({
      title: 'ยืนยันการดำเนินการ',
      text: "คุณต้องการทำรายการนี้ใช่หรือไม่?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      confirmButtonText: 'ใช่, ดำเนินการ',
      cancelButtonText: 'ยกเลิก',
      background: '#1e293b',
      color: '#f8fafc'
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch('http://localhost:5000/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_user',
          admin_id: adminUser.user_id,
          target_user_id: user.user_id,
          status: newStatus
        })
      });
      const json = await res.json();
      if (json.status === 'success') {
        showToast(`${actionText}บัญชีผู้ใช้เรียบร้อยแล้ว`);
        refreshAllData();
      } else {
        showToast(`❌ ${json.message}`, "error");
      }
    } catch (err) {
      showToast(`เกิดข้อผิดพลาดในการ${actionText}ผู้ใช้`, "error");
    }
  };

  const handleDeleteUser = async (user) => {
    const result = await Swal.fire({
      title: 'ยืนยันการดำเนินการ',
      text: "คุณต้องการทำรายการนี้ใช่หรือไม่?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      confirmButtonText: 'ใช่, ดำเนินการ',
      cancelButtonText: 'ยกเลิก',
      background: '#1e293b',
      color: '#f8fafc'
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch('http://localhost:5000/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_user',
          admin_id: adminUser.user_id,
          target_user_id: user.user_id
        })
      });
      const json = await res.json();
      if (json.status === 'success') {
        showToast(<> <i className="fa-solid fa-circle-check" style={{marginRight:"4px"}}></i> ลบบัญชีผู้ใช้เรียบร้อยแล้ว </>);
        refreshAllData();
      } else {
        showToast(`❌ ${json.message}`, "error");
      }
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการลบผู้ใช้", "error");
    }
  };

  // --------------------------------------------------------------------------
  // FEEDBACK MANAGEMENT HANDLERS
  // --------------------------------------------------------------------------
  const handleSelectFeedback = async (fb) => {
    setSelectedItem(fb);
    setFormData({
      feedback_id: fb.feedback_id,
      status: fb.status || 'new',
      priority: fb.priority || 'medium',
      admin_response: fb.admin_response || ''
    });

    if (!fb.is_read || fb.is_read === 0) {
      try {
        await fetch('http://localhost:5000/api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'mark_feedback_read',
            admin_id: adminUser.user_id,
            feedback_id: fb.feedback_id
          })
        });
        refreshAllData(); // Refresh to update the unread count and UI
      } catch (e) {
        console.error("Error marking feedback as read:", e);
      }
    }
  };

  const handleSaveFeedback = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_feedback',
          admin_id: adminUser.user_id,
          feedback_id: formData.feedback_id,
          status: formData.status,
          priority: formData.priority,
          admin_response: formData.admin_response,
          is_read: 1
        })
      });
      const json = await res.json();
      if (json.status === 'success') {
        showToast("อัปเดตการตอบกลับเรียบร้อย");
        setModalType(null);
        refreshAllData();
      } else {
        showToast(`❌ ${json.message}`, "error");
      }
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการอัปเดตข้อเสนอแนะ", "error");
    }
  };

  const handleDeleteFeedback = async (fbId) => {
    const result = await Swal.fire({
      title: 'ยืนยันการดำเนินการ',
      text: "คุณต้องการทำรายการนี้ใช่หรือไม่?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      confirmButtonText: 'ใช่, ดำเนินการ',
      cancelButtonText: 'ยกเลิก',
      background: '#1e293b',
      color: '#f8fafc'
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch('http://localhost:5000/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_feedback',
          admin_id: adminUser.user_id,
          feedback_id: fbId
        })
      });
      const json = await res.json();
      if (json.status === 'success') {
        showToast(<> <i className="fa-solid fa-circle-check" style={{marginRight:"4px"}}></i> ลบข้อเสนอแนะเรียบร้อย </>);
        refreshAllData();
      } else {
        showToast(`❌ ${json.message}`, "error");
      }
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการลบข้อเสนอแนะ", "error");
    }
  };

  // --------------------------------------------------------------------------
  // COMPENDIUM / DATA CATALOG CRUD HANDLERS
  // --------------------------------------------------------------------------
  const handleOpenCatalogModal = (mode, table, item = null) => {
    setSelectedItem(item);
    if (mode === 'add') {
      if (table === 'items') {
        setFormData({ item_id: '', item_name: '', item_type: 'Gear', subcategory: '', rarity: 'None', cost: '1 GP', weight: '1 lb.', item_desc: '', damage: '', ac: '', properties: '' });
      } else if (table === 'spells') {
        setFormData({ spell_id: '', spell_name: '', spell_level: 0, school: 'Evocation', casting_time: '1 Action', spell_range: '60 feet', components: 'V, S', duration: 'Instantaneous', spell_desc: '', classes: 'Wizard' });
      } else if (table === 'species') {
        setFormData({ species_id: '', species_name: '', size: 'Medium', speed: '30 ft.', species_desc: '', traits: '' });
      } else if (table === 'classes') {
        setFormData({ class_id: '', class_name: '', hit_die: 'd8', primary_ability: 'Strength', class_desc: '' });
      } else if (table === 'backgrounds') {
        setFormData({ background_id: '', background_name: '', background_desc: '', skill_proficiencies: 'Athletics, Perception' });
      } else if (table === 'feats') {
        setFormData({ feat_id: '', feat_name: '', feat_type: 'General', prerequisite: 'None', feat_desc: '' });
      } else if (table === 'subclasses') {
        setFormData({ subclass_id: '', subclass_name: '', subclass_desc: '', class_id: '' });
      }
    } else {
      setFormData({ ...item });
    }
    setModalType(`${table}_form`);
  };

  const handleSaveCatalogItem = async (e, table, mode, submitData = null) => {
    e.preventDefault();
    try {
      const actionName = mode === 'add' ? 'create_compendium_item' : 'update_compendium_item';
      const res = await fetch('http://localhost:5000/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionName,
          admin_id: adminUser.user_id,
          target_table: table,
          item_data: submitData || formData
        })
      });
      const json = await res.json();
      if (json.status === 'success') {
        showToast(`✅ ${mode === 'add' ? 'เพิ่มข้อมูลสำเร็จ' : 'อัปเดตข้อมูลสำเร็จ'}`);
        setModalType(null);
        refreshAllData();
      } else {
        showToast(`❌ ${json.message}`, "error");
      }
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการบันทึกข้อมูล", "error");
    }
  };

  const handleDeleteCatalogItem = async (table, itemId) => {
    const result = await Swal.fire({
      title: 'ยืนยันการดำเนินการ',
      text: "คุณต้องการทำรายการนี้ใช่หรือไม่?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      confirmButtonText: 'ใช่, ดำเนินการ',
      cancelButtonText: 'ยกเลิก',
      background: '#1e293b',
      color: '#f8fafc'
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch('http://localhost:5000/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_compendium_item',
          admin_id: adminUser.user_id,
          target_table: table,
          item_id: itemId
        })
      });
      const json = await res.json();
      if (json.status === 'success') {
        showToast(<> <i className="fa-solid fa-circle-check" style={{marginRight:"4px"}}></i> ลบรายการข้อมูลเรียบร้อยแล้ว </>);
        refreshAllData();
      } else {
        showToast(`❌ ${json.message}`, "error");
      }
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการลบข้อมูล", "error");
    }
  };

  // --------------------------------------------------------------------------
  // FILTERED DATASETS
  // --------------------------------------------------------------------------
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const q = searchTerm.toLowerCase();
      const matchQuery = (u.user_name || '').toLowerCase().includes(q) || (u.user_email || '').toLowerCase().includes(q);
      const matchRole = filterRole === 'all' || u.role === filterRole;
      const matchStatus = filterStatus === 'all' || u.status === filterStatus;
      return matchQuery && matchRole && matchStatus;
    });
  }, [usersList, searchTerm, filterRole, filterStatus]);

  const filteredFeedbacks = useMemo(() => {
    return feedbackList.filter(f => {
      const q = searchTerm.toLowerCase();
      const matchQuery = (f.title || '').toLowerCase().includes(q) || (f.message || '').toLowerCase().includes(q) || (f.user_name || '').toLowerCase().includes(q);
      const matchCat = filterCategory === 'all' || f.category === filterCategory;
      const matchPrio = filterPriority === 'all' || f.priority === filterPriority;
      const matchStatus = filterStatus === 'all' || f.status === filterStatus;
      return matchQuery && matchCat && matchPrio && matchStatus;
    });
  }, [feedbackList, searchTerm, filterCategory, filterPriority, filterStatus]);

  const filteredItems = useMemo(() => {

  return (ccData.items || []).filter(i => {
      const q = searchTerm.toLowerCase();
      const matchQuery = (i.item_name || '').toLowerCase().includes(q) || (i.item_type || '').toLowerCase().includes(q) || (i.item_desc || '').toLowerCase().includes(q);
      const matchSub = filterSubcategory === 'all' || i.item_type === filterSubcategory;
      return matchQuery && matchSub;
    });
  }, [ccData.items, searchTerm, filterSubcategory]);

  const filteredSpells = useMemo(() => {
    return (ccData.spells || []).filter(s => {
      const q = searchTerm.toLowerCase();
      const matchQuery = (s.spell_name || '').toLowerCase().includes(q) || (s.school || '').toLowerCase().includes(q) || (s.spell_desc || '').toLowerCase().includes(q);
      const matchSchool = filterSpellSchool === 'all' || (s.school || '') === filterSpellSchool;
      const matchLevel = filterSpellLevel === 'all' || String(s.spell_level) === filterSpellLevel;
      return matchQuery && matchSchool && matchLevel;
    });
  }, [ccData.spells, searchTerm, filterSpellSchool, filterSpellLevel]);

  const filteredRaces = useMemo(() => {
    return (ccData.races || []).filter(r => (r.species_name || '').toLowerCase().includes(searchTerm.toLowerCase()));
  }, [ccData.races, searchTerm]);

  const filteredClasses = useMemo(() => {
    return (ccData.classes || []).filter(c => {
      const matchQuery = (c.class_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchHitDie = filterClassHitDie === 'all' || String(c.hit_die) === filterClassHitDie;
      return matchQuery && matchHitDie;
    });
  }, [ccData.classes, searchTerm, filterClassHitDie]);

  const filteredSubclasses = useMemo(() => {
    return (ccData.subclasses || []).filter(s => (s.subclass_name || '').toLowerCase().includes(searchTerm.toLowerCase()));
  }, [ccData.subclasses, searchTerm]);

  const filteredBackgrounds = useMemo(() => {
    return (ccData.backgrounds || []).filter(b => (b.background_name || '').toLowerCase().includes(searchTerm.toLowerCase()));
  }, [ccData.backgrounds, searchTerm]);

  const filteredFeats = useMemo(() => {
    return (ccData.feats || []).filter(f => {
      const matchQuery = (f.feat_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterFeatType === 'all' || (f.feat_type || '') === filterFeatType;
      return matchQuery && matchType;
    });
  }, [ccData.feats, searchTerm, filterFeatType]);

    // 📊 Calculate Spell Distribution (By Level)
  const spellLevels = useMemo(() => {
    if (!ccData.spells) return { cantrips: 0, low: 0, mid: 0, high: 0, total: 1 };
    return ccData.spells.reduce((acc, spell) => {
      const lvl = parseInt(spell.spell_level ?? spell.level ?? 0);
      if (lvl === 0) acc.cantrips++;
      else if (lvl <= 3) acc.low++;
      else if (lvl <= 6) acc.mid++;
      else acc.high++;
      return acc;
    }, { cantrips: 0, low: 0, mid: 0, high: 0, total: ccData.spells.length || 1 });
  }, [ccData.spells]);

  // 📊 Calculate Item Distribution (By Type - Real DB values)
  const itemTypes = useMemo(() => {
    if (!ccData.items) return { weapon: 0, armor: 0, magicItem: 0, gear: 0, tool: 0, vehicle: 0, total: 1 };
    return ccData.items.reduce((acc, item) => {
      const t = (item.item_type || '').toLowerCase();
      if (t === 'weapon') acc.weapon++;
      else if (t === 'armor') acc.armor++;
      else if (t === 'magic item') acc.magicItem++;
      else if (t === 'tool') acc.tool++;
      else if (t === 'vehicle' || t === 'mount') acc.vehicle++;
      else acc.gear++;
      return acc;
    }, { weapon: 0, armor: 0, magicItem: 0, gear: 0, tool: 0, vehicle: 0, total: ccData.items.length || 1 });
  }, [ccData.items]);

  // 📊 Calculate Class Distribution (By Hit Dice)
  const classHitDice = useMemo(() => {
    if (!ccData.classes) return { d6: 0, d8: 0, d10: 0, d12: 0, total: 1 };
    return ccData.classes.reduce((acc, cls) => {
      const hd = parseInt(cls.hit_die) || 8;
      if (hd <= 6) acc.d6++;
      else if (hd === 8) acc.d8++;
      else if (hd === 10) acc.d10++;
      else acc.d12++;
      return acc;
    }, { d6: 0, d8: 0, d10: 0, d12: 0, total: ccData.classes.length || 1 });
  }, [ccData.classes]);

  // Chart Gradient Helpers
  const spC = (spellLevels.cantrips / spellLevels.total) * 360;
  const spL = (spellLevels.low / spellLevels.total) * 360;
  const spM = (spellLevels.mid / spellLevels.total) * 360;
  const spellConic = `conic-gradient(#94a3b8 0deg ${spC}deg, #4ade80 ${spC}deg ${spC+spL}deg, #38bdf8 ${spC+spL}deg ${spC+spL+spM}deg, #c084fc ${spC+spL+spM}deg 360deg)`;

  const itW = (itemTypes.weapon / itemTypes.total) * 360;
  const itA = (itemTypes.armor / itemTypes.total) * 360;
  const itMI = (itemTypes.magicItem / itemTypes.total) * 360;
  const itT = (itemTypes.tool / itemTypes.total) * 360;
  const itV = (itemTypes.vehicle / itemTypes.total) * 360;
  const itemConic = `conic-gradient(#ef4444 0deg ${itW}deg, #3b82f6 ${itW}deg ${itW+itA}deg, #a855f7 ${itW+itA}deg ${itW+itA+itMI}deg, #f59e0b ${itW+itA+itMI}deg ${itW+itA+itMI+itT}deg, #14b8a6 ${itW+itA+itMI+itT}deg ${itW+itA+itMI+itT+itV}deg, #94a3b8 ${itW+itA+itMI+itT+itV}deg 360deg)`;

  const cl6 = (classHitDice.d6 / classHitDice.total) * 360;
  const cl8 = (classHitDice.d8 / classHitDice.total) * 360;
  const cl10 = (classHitDice.d10 / classHitDice.total) * 360;
  const classConic = `conic-gradient(#38bdf8 0deg ${cl6}deg, #a855f7 ${cl6}deg ${cl6+cl8}deg, #f43f5e ${cl6+cl8}deg ${cl6+cl8+cl10}deg, #f59e0b ${cl6+cl8+cl10}deg 360deg)`;

return (
<div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          backgroundColor: toastMessage.type === 'error' ? '#991b1b' : '#065f46',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {toastMessage.text}
        </div>
      )}

      

      {/* Main Container Layout */}
      <div style={{ display: 'flex', flex: 1 }}>
        
        {/* Sidebar Navigation */}
        <aside style={{ width: '260px', backgroundColor: '#1e293b', borderRight: '1px solid #334155', padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* User Info & Refresh */}
          <div style={{ padding: '0 8px 16px 8px', borderBottom: '1px solid #334155', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#0f172a', padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {adminUser?.user_name || 'Admin'}
              </span>
            </div>
            
            <button
              onClick={refreshAllData}
              disabled={loading}
              style={{ width: '100%', backgroundColor: 'transparent', color: '#38bdf8', border: '1px solid #38bdf8', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}
            >
              {loading ? <><i className="fa-solid fa-rotate-right fa-spin" style={{marginRight:"4px"}}></i>กำลังโหลด...</> : <><i className="fa-solid fa-rotate-right" style={{marginRight:"4px"}}></i>รีเฟรชข้อมูล</>}
            </button>
          </div>

          <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', padding: '8px 8px 12px 8px' }}>
            เมนูควบคุมระบบ
          </div>

          <button
            onClick={() => setActiveTab('overview')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '8px', border: 'none',
              backgroundColor: activeTab === 'overview' ? '#991b1b' : 'transparent', color: activeTab === 'overview' ? '#ffffff' : '#94a3b8',
              fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
            }}
          >
            <span><i className="fa-solid fa-chart-pie" style={{marginRight:"8px"}}></i>ภาพรวมระบบ</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '8px', border: 'none',
              backgroundColor: activeTab === 'catalog' ? '#991b1b' : 'transparent', color: activeTab === 'catalog' ? '#ffffff' : '#94a3b8',
              fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
            }}
          >
            <span><i className="fa-solid fa-book-journal-whills" style={{marginRight:"8px"}}></i>จัดการคลังข้อมูล</span>
            <span style={{ backgroundColor: '#0f172a', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', color: '#cbd5e1' }}>
              {(ccData.items?.length || 0) + (ccData.spells?.length || 0)}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '8px', border: 'none',
              backgroundColor: activeTab === 'users' ? '#991b1b' : 'transparent', color: activeTab === 'users' ? '#ffffff' : '#94a3b8',
              fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
            }}
          >
            <span><i className="fa-solid fa-users" style={{marginRight:"8px"}}></i>จัดการบัญชีผู้ใช้</span>
            <span style={{ backgroundColor: '#0f172a', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', color: '#cbd5e1' }}>
              {usersList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '8px', border: 'none',
              backgroundColor: activeTab === 'feedback' ? '#991b1b' : 'transparent', color: activeTab === 'feedback' ? '#ffffff' : '#94a3b8',
              fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
            }}
          >
            <span><i className="fa-solid fa-comments" style={{marginRight:"8px"}}></i>ข้อเสนอแนะ & แจ้งปัญหา</span>
            {stats.unread_feedbacks > 0 && (
              <span style={{ backgroundColor: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '800' }}>
                {stats.unread_feedbacks} ใหม่
              </span>
            )}
          </button>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', backgroundColor: '#0f172a' }}>

          {/* TAB 1: OVERVIEW & SYSTEM STATS */}
          {activeTab === 'overview' && (
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '20px', color: '#f1f5f9' }}>
                <i className="fa-solid fa-thumbtack" style={{marginRight:"8px"}}></i>ภาพรวมระบบและสถิติหลัก
              </h2>

              {/* KPI Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                
                <div className="admin-kpi-card glow-blue" style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>ผู้ใช้งานทั้งหมด</div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', color: '#38bdf8', marginTop: '6px' }}>{stats.users}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>บัญชีในระบบ</div>
                </div>

                <div className="admin-kpi-card glow-green" style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>ตัวละครในระบบ</div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', color: '#4ade80', marginTop: '6px' }}>{stats.characters}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>ตัวละครที่ถูกสร้าง</div>
                </div>

                <div className="admin-kpi-card glow-purple" style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>คลังคาถาเวทมนตร์</div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', color: '#c084fc', marginTop: '6px' }}>{stats.spells}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>คาถาใน SQL DB</div>
                </div>

                <div className="admin-kpi-card glow-yellow" style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>คลังไอเทม & อุปกรณ์</div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', color: '#fbbf24', marginTop: '6px' }}>{stats.items}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>ไอเทมใน SQL DB</div>
                </div>

                <div className="admin-kpi-card glow-red" style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>ข้อเสนอแนะ & บั๊ก</div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', color: '#f87171', marginTop: '6px' }}>{stats.feedbacks}</div>
                  <div style={{ fontSize: '0.75rem', color: '#fca5a5', marginTop: '4px' }}>{stats.unread_feedbacks} ยังไม่ได้อ่าน | {stats.bug_feedbacks} รายงานบั๊ก</div>
                </div>

              </div>

              {/* System Info Quick Summary */}
              <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', margin: '0 0 14px 0', color: '#cbd5e1' }}>
                  <i className="fa-solid fa-screwdriver-wrench" style={{marginRight:"8px"}}></i>ข้อมูลสรุปคลังข้อมูลกฎ D&D 
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  <div style={{ backgroundColor: '#0f172a', padding: '12px 16px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>เผ่าพันธุ์ (Species):</span>
                    <strong style={{ display: 'block', fontSize: '1.2rem', color: '#38bdf8' }}>{stats.races} เผ่า</strong>
                  </div>
                  <div style={{ backgroundColor: '#0f172a', padding: '12px 16px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>คลาส (Classes):</span>
                    <strong style={{ display: 'block', fontSize: '1.2rem', color: '#4ade80' }}>{stats.classes} คลาส</strong>
                  </div>
                  <div style={{ backgroundColor: '#0f172a', padding: '12px 16px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ความสามารถพิเศษ (Feats):</span>
                    <strong style={{ display: 'block', fontSize: '1.2rem', color: '#facc15' }}>{stats.feats} รายการ</strong>
                  </div>
                  <div style={{ backgroundColor: '#0f172a', padding: '12px 16px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ประวัติ (Backgrounds):</span>
                      <strong style={{ display: 'block', fontSize: '1.2rem', color: '#f472b6' }}>{stats.backgrounds} ประวัติ</strong>
                    </div>
                  </div>

                  {/* 📈 NEW DONUT CHARTS DASHBOARD */}
                  <div style={{ marginTop: '32px', paddingTop: '28px', borderTop: '1px solid #334155' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '20px', color: '#f8fafc' }}>
                      <i className="fa-solid fa-chart-pie" style={{marginRight:"8px", color:"#38bdf8"}}></i>สัดส่วนข้อมูลเชิงลึก
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                      
                      {/* SPELL CHART */}
                      <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '50%', background: spellConic, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: '75px', height: '75px', backgroundColor: '#0f172a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#f1f5f9' }}>{spellLevels.total}</span>
                            <span style={{ fontSize: '0.55rem', color: '#64748b' }}>SPELLS</span>
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>หมวดหมู่คาถาเวทมนตร์</h4>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><span style={{ color: '#94a3b8' }}>●</span> Cantrip</span> <strong>{spellLevels.cantrips}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><span style={{ color: '#4ade80' }}>●</span> Lv 1-3</span> <strong>{spellLevels.low}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><span style={{ color: '#38bdf8' }}>●</span> Lv 4-6</span> <strong>{spellLevels.mid}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><span style={{ color: '#c084fc' }}>●</span> Lv 7-9</span> <strong>{spellLevels.high}</strong></div>
                          </div>
                        </div>
                      </div>

                      {/* ITEM CHART */}
                      <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '50%', background: itemConic, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: '75px', height: '75px', backgroundColor: '#0f172a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#f1f5f9' }}>{itemTypes.total}</span>
                            <span style={{ fontSize: '0.55rem', color: '#64748b' }}>ITEMS</span>
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>ประเภทไอเทมและอุปกรณ์</h4>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><span style={{ color: '#ef4444' }}>●</span> Weapons</span> <strong>{itemTypes.weapon}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><span style={{ color: '#3b82f6' }}>●</span> Armor</span> <strong>{itemTypes.armor}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><span style={{ color: '#a855f7' }}>●</span> Magic Items</span> <strong>{itemTypes.magicItem}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><span style={{ color: '#f59e0b' }}>●</span> Tools</span> <strong>{itemTypes.tool}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><span style={{ color: '#14b8a6' }}>●</span> Vehicles</span> <strong>{itemTypes.vehicle}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><span style={{ color: '#94a3b8' }}>●</span> Gear/Packs</span> <strong>{itemTypes.gear}</strong></div>
                          </div>
                        </div>
                      </div>

                      {/* CLASS CHART */}
                      <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '50%', background: classConic, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: '75px', height: '75px', backgroundColor: '#0f172a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#f1f5f9' }}>{classHitDice.total}</span>
                            <span style={{ fontSize: '0.55rem', color: '#64748b' }}>CLASSES</span>
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>สัดส่วนประเภทคลาส</h4>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><span style={{ color: '#38bdf8' }}>●</span> d6 (Caster)</span> <strong>{classHitDice.d6}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><span style={{ color: '#a855f7' }}>●</span> d8 (Mid)</span> <strong>{classHitDice.d8}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><span style={{ color: '#f43f5e' }}>●</span> d10 (Martial)</span> <strong>{classHitDice.d10}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><span style={{ color: '#f59e0b' }}>●</span> d12 (Tank)</span> <strong>{classHitDice.d12}</strong></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* TAB 2: COMPENDIUM / DATA CATALOG MANAGEMENT */}
          {activeTab === 'catalog' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, color: '#f1f5f9' }}>
                    <i className="fa-solid fa-book-journal-whills" style={{marginRight:"8px"}}></i>จัดการคลังข้อมูลหลัก
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
                    เพิ่ม แก้ไข และลบ ข้อมูลคาถา ไอเทม เผ่าพันธุ์ คลาส ประวัติ และความสามารถพิเศษในระบบ
                  </p>
                </div>

                <button
                  onClick={() => handleOpenCatalogModal('add', catalogSubTab)}
                  style={{ backgroundColor: '#991b1b', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <i className="fa-solid fa-plus" style={{marginRight:"6px"}}></i>เพิ่มรายการใหม่ในหมวดนี้
                </button>
              </div>

              {/* Sub-Category Switcher Tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '12px', overflowX: 'auto' }}>
                {[
                  { id: 'items', label: 'ไอเทม & อุปกรณ์', count: ccData.items?.length },
                  { id: 'spells', label: 'เวทมนตร์', count: ccData.spells?.length },
                  { id: 'races', label: 'เผ่าพันธุ์ (Species)', count: ccData.races?.length },
                  { id: 'classes', label: 'คลาสอาชีพ (Classes)', count: ccData.classes?.length },
                  { id: 'subclasses', label: 'เส้นทางอาชีพ (Subclasses)', count: ccData.subclasses?.length },
                  { id: 'backgrounds', label: 'ประวัติ (Backgrounds)', count: ccData.backgrounds?.length },
                  { id: 'feats', label: 'ความสามารถพิเศษ (Feats)', count: ccData.feats?.length }
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => { setCatalogSubTab(sub.id); setSearchTerm(''); setFilterSubcategory('all'); setFilterSpellSchool('all'); setFilterSpellLevel('all'); setFilterClassHitDie('all'); setFilterFeatType('all'); }}
                    style={{
                      padding: '8px 16px', borderRadius: '20px', border: 'none',
                      backgroundColor: catalogSubTab === sub.id ? '#991b1b' : '#1e293b',
                      color: catalogSubTab === sub.id ? '#ffffff' : '#94a3b8',
                      fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <span>{sub.label}</span>
                    <span style={{ backgroundColor: '#0f172a', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem' }}>{sub.count || 0}</span>
                  </button>
                ))}
              </div>

              {/* Search & Filter Controls */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder={`ค้นหาชื่อในหมวด ${catalogSubTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem' }}
                />

                {catalogSubTab === 'items' && (
                  <select
                    value={filterSubcategory}
                    onChange={(e) => setFilterSubcategory(e.target.value)}
                    style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem' }}
                  >
                    <option value="all">ประเภททั้งหมด</option>
                    <option value="Weapon">อาวุธ (Weapon)</option>
                    <option value="Armor">ชุดเกราะ (Armor)</option>
                    <option value="Gear">สัมภาระ (Gear)</option>
                    <option value="Tool">เครื่องมือ (Tool)</option>
                    <option value="Magic Item">ไอเทมเวทมนตร์ (Magic Item)</option>
                    <option value="Mount">พาหนะ (Mount)</option>
                    <option value="Vehicle">ยานพาหนะ (Vehicle)</option>
                    <option value="Pack">ชุดสัมภาระ (Pack)</option>
                  </select>
                )}

                {catalogSubTab === 'spells' && (<>
                  <select value={filterSpellLevel} onChange={(e) => setFilterSpellLevel(e.target.value)}
                    style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <option value="all">ทุกระดับ</option>
                    <option value="0">Cantrip</option>
                    <option value="1">Level 1</option>
                    <option value="2">Level 2</option>
                    <option value="3">Level 3</option>
                    <option value="4">Level 4</option>
                    <option value="5">Level 5</option>
                    <option value="6">Level 6</option>
                    <option value="7">Level 7</option>
                    <option value="8">Level 8</option>
                    <option value="9">Level 9</option>
                  </select>
                  <select value={filterSpellSchool} onChange={(e) => setFilterSpellSchool(e.target.value)}
                    style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <option value="all">ทุกสำนักเวท</option>
                    <option value="Abjuration">Abjuration</option>
                    <option value="Conjuration">Conjuration</option>
                    <option value="Divination">Divination</option>
                    <option value="Enchantment">Enchantment</option>
                    <option value="Evocation">Evocation</option>
                    <option value="Illusion">Illusion</option>
                    <option value="Necromancy">Necromancy</option>
                    <option value="Transmutation">Transmutation</option>
                  </select>
                </>)}

                {catalogSubTab === 'classes' && (
                  <select value={filterClassHitDie} onChange={(e) => setFilterClassHitDie(e.target.value)}
                    style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <option value="all">Hit Die ทั้งหมด</option>
                    <option value="6">d6 (สายเวท)</option>
                    <option value="8">d8 (สายซัพพอร์ต)</option>
                    <option value="10">d10 (สายปะทะ)</option>
                    <option value="12">d12 (สายแทงค์)</option>
                  </select>
                )}

                {catalogSubTab === 'feats' && (
                  <select value={filterFeatType} onChange={(e) => setFilterFeatType(e.target.value)}
                    style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <option value="all">ทุกประเภท</option>
                    <option value="Origin Feat">Origin Feat</option>
                    <option value="General Feat">General Feat</option>
                    <option value="Fighting Style Feat">Fighting Style Feat</option>
                    <option value="Epic Boon Feat">Epic Boon Feat</option>
                  </select>
                )}
              </div>

              {/* Result Count Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '8px 16px', backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  แสดง <strong style={{ color: '#f8fafc' }}>
                    {catalogSubTab === 'items' ? filteredItems.length :
                     catalogSubTab === 'spells' ? filteredSpells.length :
                     catalogSubTab === 'races' ? filteredRaces.length :
                     catalogSubTab === 'classes' ? filteredClasses.length :
                     catalogSubTab === 'subclasses' ? filteredSubclasses.length :
                     catalogSubTab === 'backgrounds' ? filteredBackgrounds.length :
                     catalogSubTab === 'feats' ? filteredFeats.length : 0}
                  </strong> จาก <strong style={{ color: '#f8fafc' }}>
                    {catalogSubTab === 'items' ? (ccData.items?.length || 0) :
                     catalogSubTab === 'spells' ? (ccData.spells?.length || 0) :
                     catalogSubTab === 'races' ? (ccData.races?.length || 0) :
                     catalogSubTab === 'classes' ? (ccData.classes?.length || 0) :
                     catalogSubTab === 'subclasses' ? (ccData.subclasses?.length || 0) :
                     catalogSubTab === 'backgrounds' ? (ccData.backgrounds?.length || 0) :
                     catalogSubTab === 'feats' ? (ccData.feats?.length || 0) : 0}
                  </strong> รายการ
                </span>
              </div>

              {/* SUB-SECTION 1: ITEMS TABLE */}
              {catalogSubTab === 'items' && (
                <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
                  <table className="admin-catalog-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                        <th style={{ padding: '12px 16px' }}>รหัส / ชื่อไอเทม</th>
                        <th style={{ padding: '12px 16px' }}>ประเภท</th>
                        <th style={{ padding: '12px 16px' }}>ความหายาก / ราคา / น้ำหนัก</th>
                        <th style={{ padding: '12px 16px' }}>สเตตัส / คำอธิบาย</th>
                        <th style={{ padding: '12px 16px', textWrap: 'nowrap' }}>จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map(item => (
                        <tr key={item.item_id} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <strong style={{ color: '#f1f5f9', display: 'block' }}>{item.item_name}</strong>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>ID: {item.item_id}</span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ backgroundColor: '#0f172a', border: '1px solid #334155', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', color: '#fbbf24' }}>
                              {item.item_type || 'Gear'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>{item.cost || '-'} | {item.weight || 0} lb.</div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.rarity || 'Common'}</div>
                          </td>
                          <td style={{ padding: '12px 16px', maxWidth: '350px' }}>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {item.item_desc || item.description || 'ไม่มีคำอธิบาย'}
                            </p>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => handleOpenCatalogModal('edit', 'items', item)} style={{ backgroundColor: 'transparent', color: '#38bdf8', border: '1px solid #38bdf8', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}><i className="fa-solid fa-pen-to-square" style={{marginRight:"4px"}}></i>แก้ไข</button>
                              <button onClick={() => handleDeleteCatalogItem('items', item.item_id)} style={{ backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}><i className="fa-solid fa-trash" style={{marginRight:"4px"}}></i>ลบ</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SUB-SECTION 2: SPELLS TABLE */}
              {catalogSubTab === 'spells' && (
                <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
                  <table className="admin-catalog-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                        <th style={{ padding: '12px 16px' }}>ชื่อคาถา</th>
                        <th style={{ padding: '12px 16px' }}>ระดับ & สำนักเวท</th>
                        <th style={{ padding: '12px 16px' }}>การร่าย & ระยะ</th>
                        <th style={{ padding: '12px 16px' }}>คำอธิบายกติกา</th>
                        <th style={{ padding: '12px 16px' }}>จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSpells.map(sp => (
                        <tr key={sp.spell_id} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <strong style={{ color: '#f1f5f9', display: 'block' }}>{sp.spell_name}</strong>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>ID: {sp.spell_id}</span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ backgroundColor: sp.spell_level === 0 ? '#166534' : '#581c87', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '800' }}>
                              {sp.spell_level === 0 ? 'Cantrip' : `Level ${sp.spell_level}`}
                            </span>
                            <div style={{ fontSize: '0.75rem', color: '#c084fc', marginTop: '4px' }}>{sp.school || 'Evocation'}</div>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#cbd5e1' }}>
                            <div>{sp.casting_time || '1 Action'}</div>
                            <div>{sp.range_dist || sp.spell_range || '60 ft'}</div>
                          </td>
                          <td style={{ padding: '12px 16px', maxWidth: '350px' }}>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {sp.spell_desc || sp.description || 'ไม่มีคำอธิบาย'}
                            </p>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => handleOpenCatalogModal('edit', 'spells', sp)} style={{ backgroundColor: 'transparent', color: '#38bdf8', border: '1px solid #38bdf8', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}><i className="fa-solid fa-pen-to-square" style={{marginRight:"4px"}}></i>แก้ไข</button>
                              <button onClick={() => handleDeleteCatalogItem('spells', sp.spell_id)} style={{ backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}><i className="fa-solid fa-trash" style={{marginRight:"4px"}}></i>ลบ</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SUB-SECTION 3: RACES */}
              {catalogSubTab === 'races' && (
                <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
                  <table className="admin-catalog-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                        <th style={{ padding: '12px 16px' }}>ชื่อเผ่าพันธุ์</th>
                        <th style={{ padding: '12px 16px' }}>ขนาด & ความเร็ว</th>
                        <th style={{ padding: '12px 16px' }}>รายละเอียดเผ่า</th>
                        <th style={{ padding: '12px 16px' }}>จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRaces.map(rc => (
                        <tr key={rc.species_id} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <strong style={{ color: '#f1f5f9' }}>{rc.species_name}</strong>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#cbd5e1' }}>
                            Size: {rc.size || 'Medium'} | Speed: {rc.speed || '30 ft.'}
                          </td>
                          <td style={{ padding: '12px 16px', maxWidth: '350px', fontSize: '0.78rem', color: '#94a3b8' }}>
                            {rc.species_desc || 'ไม่มีคำอธิบาย'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => handleOpenCatalogModal('edit', 'species', rc)} style={{ backgroundColor: 'transparent', color: '#38bdf8', border: '1px solid #38bdf8', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}><i className="fa-solid fa-pen-to-square" style={{marginRight:"4px"}}></i>แก้ไข</button>
                              <button onClick={() => handleDeleteCatalogItem('species', rc.species_id)} style={{ backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}><i className="fa-solid fa-trash" style={{marginRight:"4px"}}></i>ลบ</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SUB-SECTION 4: CLASSES */}
              {catalogSubTab === 'classes' && (
                <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
                  <table className="admin-catalog-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                        <th style={{ padding: '12px 16px' }}>คลาส</th>
                        <th style={{ padding: '12px 16px' }}>Hit Die & Ability</th>
                        <th style={{ padding: '12px 16px' }}>รายละเอียดคลาส</th>
                        <th style={{ padding: '12px 16px' }}>จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClasses.map(cl => (
                        <tr key={cl.class_id} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <strong style={{ color: '#f1f5f9' }}>{cl.class_name}</strong>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#4ade80' }}>
                            Hit Die: 1{cl.hit_die || 'd8'} | Primary: {cl.primary_ability || 'STR'}
                          </td>
                          <td style={{ padding: '12px 16px', maxWidth: '350px', fontSize: '0.78rem', color: '#94a3b8' }}>
                            {cl.class_desc || 'ไม่มีคำอธิบาย'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => handleOpenCatalogModal('edit', 'classes', cl)} style={{ backgroundColor: 'transparent', color: '#38bdf8', border: '1px solid #38bdf8', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}><i className="fa-solid fa-pen-to-square" style={{marginRight:"4px"}}></i>แก้ไข</button>
                              <button onClick={() => handleDeleteCatalogItem('classes', cl.class_id)} style={{ backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}><i className="fa-solid fa-trash" style={{marginRight:"4px"}}></i>ลบ</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SUB-SECTION 4.5: SUBCLASSES */}
              {catalogSubTab === 'subclasses' && (
                <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
                  <table className="admin-catalog-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                        <th style={{ padding: '12px 16px' }}>ชื่อซับคลาส</th>
                        <th style={{ padding: '12px 16px' }}>คลาสหลัก</th>
                        <th style={{ padding: '12px 16px' }}>คำอธิบาย</th>
                        <th style={{ padding: '12px 16px' }}>จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubclasses.map(sub => {
                        const parentClass = ccData.classes?.find(c => c.class_id === sub.class_id);
                        return (
                          <tr key={sub.subclass_id} style={{ borderBottom: '1px solid #334155' }}>
                            <td style={{ padding: '12px 16px' }}>
                              <strong style={{ color: '#f1f5f9' }}>{sub.subclass_name}</strong>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>ID: {sub.subclass_id}</div>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ backgroundColor: '#0f172a', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', color: '#4ade80' }}>
                                {parentClass ? parentClass.class_name : sub.class_id}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', maxWidth: '300px' }}>
                              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {sub.subclass_desc || 'ไม่มีคำอธิบาย'}
                              </p>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleOpenCatalogModal('edit', 'subclasses', sub)} style={{ backgroundColor: 'transparent', color: '#38bdf8', border: '1px solid #38bdf8', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}><i className="fa-solid fa-pen-to-square" style={{marginRight:"4px"}}></i>แก้ไข</button>
                                <button onClick={() => handleDeleteCatalogItem('subclasses', sub.subclass_id)} style={{ backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}><i className="fa-solid fa-trash" style={{marginRight:"4px"}}></i>ลบ</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SUB-SECTION 5: BACKGROUNDS */}
              {catalogSubTab === 'backgrounds' && (
                <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
                  <table className="admin-catalog-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                        <th style={{ padding: '12px 16px' }}>ชื่อประวัติ</th>
                        <th style={{ padding: '12px 16px' }}>ความชำนาญ (Skills)</th>
                        <th style={{ padding: '12px 16px' }}>คำอธิบาย</th>
                        <th style={{ padding: '12px 16px' }}>จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBackgrounds.map(bg => (
                        <tr key={bg.background_id} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <strong style={{ color: '#f1f5f9' }}>{bg.background_name}</strong>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#f472b6' }}>
                            {(() => {
                              if (!bg.skill_proficiencies) return '-';
                              try {
                                const parsed = JSON.parse(bg.skill_proficiencies);
                                return parsed.display || (parsed.logic?.granted ? parsed.logic.granted.join(', ') : bg.skill_proficiencies);
                              } catch(e) {
                                return bg.skill_proficiencies;
                              }
                            })()}
                          </td>
                          <td style={{ padding: '12px 16px', maxWidth: '350px', fontSize: '0.78rem', color: '#94a3b8' }}>
                            {bg.background_desc || 'ไม่มีคำอธิบาย'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => handleOpenCatalogModal('edit', 'backgrounds', bg)} style={{ backgroundColor: 'transparent', color: '#38bdf8', border: '1px solid #38bdf8', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}><i className="fa-solid fa-pen-to-square" style={{marginRight:"4px"}}></i>แก้ไข</button>
                              <button onClick={() => handleDeleteCatalogItem('backgrounds', bg.background_id)} style={{ backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}><i className="fa-solid fa-trash" style={{marginRight:"4px"}}></i>ลบ</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SUB-SECTION 6: FEATS */}
              {catalogSubTab === 'feats' && (
                <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
                  <table className="admin-catalog-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                        <th style={{ padding: '12px 16px' }}>ชื่อ Feat</th>
                        <th style={{ padding: '12px 16px' }}>ประเภท & เงื่อนไข</th>
                        <th style={{ padding: '12px 16px' }}>รายละเอียดความสามารถ</th>
                        <th style={{ padding: '12px 16px' }}>จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFeats.map(ft => (
                        <tr key={ft.feat_id} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <strong style={{ color: '#f1f5f9' }}>{ft.feat_name}</strong>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#facc15' }}>
                            Type: {ft.feat_type || 'General'} | Pre: {ft.prerequisite || 'None'}
                          </td>
                          <td style={{ padding: '12px 16px', maxWidth: '350px', fontSize: '0.78rem', color: '#94a3b8' }}>
                            {ft.feat_desc || 'ไม่มีคำอธิบาย'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => handleOpenCatalogModal('edit', 'feats', ft)} style={{ backgroundColor: 'transparent', color: '#38bdf8', border: '1px solid #38bdf8', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}><i className="fa-solid fa-pen-to-square" style={{marginRight:"4px"}}></i>แก้ไข</button>
                              <button onClick={() => handleDeleteCatalogItem('feats', ft.feat_id)} style={{ backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}><i className="fa-solid fa-trash" style={{marginRight:"4px"}}></i>ลบ</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: USER ACCOUNT MANAGEMENT */}
          {activeTab === 'users' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, color: '#f1f5f9' }}>
                    <i className="fa-solid fa-users" style={{marginRight:"8px"}}></i>จัดการบัญชีผู้ใช้งาน
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
                    ค้นหา กำหนดสิทธิ์ เปลี่ยนสถานะ รีเซ็ตรหัสผ่าน และลบบัญชีผู้ใช้ในระบบ
                  </p>
                </div>
              </div>

              {/* Filters & Search */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="ค้นหาชื่อผู้ใช้ หรืออีเมล..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem' }}
                />

                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem' }}
                >
                  <option value="all">สิทธิ์ทั้งหมด (All Roles)</option>
                  <option value="admin">ผู้ดูแลระบบ (Admin)</option>

                  <option value="user">ผู้ใช้งานทั่วไป (User)</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem' }}
                >
                  <option value="all">สถานะทั้งหมด (All Status)</option>
                  <option value="active">ปกติ (Active)</option>
                  <option value="suspended">ระงับชั่วคราว (Suspended)</option>
                  <option value="banned">ระงับถาวร (Banned)</option>
                </select>
              </div>

              {/* Users Table */}
              <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
                <table className="admin-catalog-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                      <th style={{ padding: '14px 18px' }}>ผู้ใช้งาน</th>
                      <th style={{ padding: '14px 18px' }}>อีเมล</th>
                      <th style={{ padding: '14px 18px' }}>สิทธิ์การใช้งาน (Role)</th>
                      <th style={{ padding: '14px 18px' }}>สถานะบัญชี</th>
                      <th style={{ padding: '14px 18px' }}>ตัวละครในบัญชี</th>
                      <th style={{ padding: '14px 18px' }}>วันที่สมัคร</th>
                      <th style={{ padding: '14px 18px' }}>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => {
                      const avatar = getAvatarColor(user.user_name);
                      return (
                        <tr key={user.user_id} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {user.avatar_url || user.avatar ? (
                                <img 
                                  src={user.avatar_url || user.avatar} 
                                  alt={user.user_name} 
                                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #334155' }} 
                                />
                              ) : (
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: avatar.bg, color: avatar.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                                  {(user.user_name || 'U').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <strong style={{ color: '#f1f5f9', display: 'block' }}>{user.user_name}</strong>
                                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>ID: {user.user_id}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>{user.user_email}</td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{
                              padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800',
                              backgroundColor: user.role === 'admin' ? '#7f1d1d' : '#0f172a',
                              color: user.role === 'admin' ? '#fca5a5' : '#94a3b8',
                              border: '1px solid #334155'
                            }}>
                              {user.role === 'admin' ? 'Admin' : 'User'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{
                              padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800',
                              backgroundColor: user.status === 'banned' ? '#450a0a' : (user.status === 'suspended' ? '#451a03' : '#064e3b'),
                              color: user.status === 'banned' ? '#f87171' : (user.status === 'suspended' ? '#fbbf24' : '#34d399')
                            }}>
                              {user.status === 'banned' ? 'Banned' : (user.status === 'suspended' ? 'Suspended' : 'Active')}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px', fontWeight: '700', color: '#38bdf8' }}>
                            {user.character_count || 0} ตัว
                          </td>
                          <td style={{ padding: '14px 18px', fontSize: '0.75rem', color: '#94a3b8' }}>
                            {new Date(user.created_at).toLocaleDateString('th-TH')}
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => handleOpenUserEdit(user)} style={{ backgroundColor: 'transparent', color: '#38bdf8', border: '1px solid #38bdf8', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}><i className="fa-solid fa-pen-to-square" style={{marginRight:"4px"}}></i>แก้ไข</button>
                              {user.role !== 'admin' && (
                                <>
                                  {user.status === 'active' ? (
                                    <button onClick={() => handleToggleUserStatus(user, 'suspended')} style={{ backgroundColor: 'transparent', color: '#f59e0b', border: '1px solid #f59e0b', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}><i className="fa-solid fa-ban" style={{marginRight:"4px"}}></i>ระงับบัญชี</button>
                                  ) : (
                                    <button onClick={() => handleToggleUserStatus(user, 'active')} style={{ backgroundColor: 'transparent', color: '#10b981', border: '1px solid #10b981', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}><i className="fa-solid fa-check" style={{marginRight:"4px"}}></i>ปลดระงับ</button>
                                  )}
                                  <button onClick={() => handleDeleteUser(user)} style={{ backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}><i className="fa-solid fa-trash" style={{marginRight:"4px"}}></i>ลบ</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: FEEDBACK & BUG REPORTS (EMAIL LAYOUT) */}
          {activeTab === 'feedback' && (
            <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, color: '#f1f5f9' }}>
                    <i className="fa-solid fa-inbox" style={{marginRight:"8px"}}></i>กล่องข้อความช่วยเหลือ
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
                    จัดการความคิดเห็น รายงานข้อผิดพลาด และข้อซักถามจากผู้ใช้ในรูปแบบเลย์เอาต์อีเมลระดับมืออาชีพ
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
                {/* LEFT PANE (Inbox List) */}
                <div style={{ width: '380px', display: 'flex', flexDirection: 'column', backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
                  {/* Filters inside Left Pane */}
                  <div style={{ padding: '16px', borderBottom: '1px solid #334155', backgroundColor: '#0f172a' }}>
                    <input
                      type="text"
                      placeholder="ค้นหาคำร้อง..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '12px' }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '8px', borderRadius: '6px', fontSize: '0.75rem' }}
                      >
                        <option value="all">ประเภททั้งหมด</option>
                        <option value="bug">ข้อผิดพลาด</option>
                        <option value="feature">ฟีเจอร์</option>
                        <option value="ui">UI/UX</option>
                        <option value="general">ทั่วไป</option>
                      </select>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '8px', borderRadius: '6px', fontSize: '0.75rem' }}
                      >
                        <option value="all">สถานะทั้งหมด</option>
                        <option value="new">ใหม่</option>
                        <option value="in_review">กำลังตรวจสอบ</option>
                        <option value="resolved">แก้ไขแล้ว</option>
                      </select>
                    </div>
                  </div>

                  {/* Ticket List */}
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {filteredFeedbacks.map(fb => {
                      const isUnread = !fb.is_read || fb.is_read === 0;
                      const isSelected = selectedItem && selectedItem.feedback_id === fb.feedback_id;
  return (
<div 
                          key={fb.feedback_id} 
                          onClick={() => handleSelectFeedback(fb)}
                          style={{ 
                            padding: '16px', 
                            borderBottom: '1px solid #334155', 
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#334155' : (isUnread ? 'rgba(56, 189, 248, 0.05)' : 'transparent'),
                            borderLeft: isSelected ? '4px solid #38bdf8' : (isUnread ? '4px solid #38bdf8' : '4px solid transparent'),
                            transition: 'background-color 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontWeight: 'bold', fontSize: '0.75rem' }}>
                                {fb.user_name ? fb.user_name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <span style={{ fontSize: '0.85rem', fontWeight: isUnread ? '800' : '600', color: isUnread ? '#f8fafc' : '#cbd5e1' }}>
                                {fb.user_name}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              {new Date(fb.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: isUnread ? '800' : '600', color: isUnread ? '#f8fafc' : '#94a3b8', margin: '0 0 6px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {fb.title}
                          </h4>
                          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 10px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {fb.description || fb.message}
                          </p>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: fb.category === 'bug' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(56, 189, 248, 0.1)', color: fb.category === 'bug' ? '#fca5a5' : '#7dd3fc' }}>
                              {fb.category.toUpperCase()}
                            </span>
                            <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: fb.status === 'resolved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: fb.status === 'resolved' ? '#6ee7b7' : '#fcd34d' }}>
                              {fb.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {filteredFeedbacks.length === 0 && (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                        No tickets found.
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT PANE (Detail View) */}
                <div style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  {selectedItem ? (
                    <>
                      {/* Ticket Header */}
                      <div style={{ padding: '24px', borderBottom: '1px solid #334155', backgroundColor: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                            <span style={{ padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '800', backgroundColor: '#334155', color: '#f8fafc', border: '1px solid #475569' }}>
                              Ticket #{selectedItem.feedback_id}
                            </span>
                            <span style={{ padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '800', backgroundColor: selectedItem.status === 'resolved' ? 'rgba(16, 185, 129, 0.1)' : (selectedItem.status === 'in_review' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)'), color: selectedItem.status === 'resolved' ? '#6ee7b7' : (selectedItem.status === 'in_review' ? '#fcd34d' : '#93c5fd'), border: `1px solid ${selectedItem.status === 'resolved' ? 'rgba(16, 185, 129, 0.2)' : (selectedItem.status === 'in_review' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)')}` }}>
                              {selectedItem.status.toUpperCase()}
                            </span>
                            <span style={{ padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '800', backgroundColor: selectedItem.priority === 'critical' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(248, 250, 252, 0.1)', color: selectedItem.priority === 'critical' ? '#fca5a5' : '#cbd5e1', border: `1px solid ${selectedItem.priority === 'critical' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(248, 250, 252, 0.2)'}` }}>
                              PRIORITY: {selectedItem.priority ? selectedItem.priority.toUpperCase() : 'MEDIUM'}
                            </span>
                          </div>
                          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#f8fafc', margin: '0 0 16px 0' }}>
                            {selectedItem.title}
                          </h2>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontWeight: 'bold', fontSize: '1rem' }}>
                              {selectedItem.user_name ? selectedItem.user_name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div style={{ color: '#f8fafc', fontWeight: '700', fontSize: '0.95rem' }}>{selectedItem.user_name}</div>
                              <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                                {selectedItem.user_email} • {new Date(selectedItem.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteFeedback(selectedItem.feedback_id)} style={{ backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '800', fontSize: '0.8rem', transition: 'all 0.2s' }}>
                          <i className="fa-solid fa-trash"></i> ลบ
                        </button>
                      </div>

                      {/* Ticket Body */}
                      <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
                        <div style={{ backgroundColor: '#0f172a', padding: '24px', borderRadius: '8px', border: '1px solid #334155', marginBottom: '30px' }}>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '16px', display: 'flex', gap: '20px' }}>
                            <span><strong>Device:</strong> {selectedItem.device_info || 'Unknown'}</span>
                            <span><strong>Satisfaction Rating:</strong> ⭐ {selectedItem.rating || 5}/5</span>
                          </div>
                          <div style={{ fontSize: '0.95rem', color: '#e2e8f0', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                            {selectedItem.description || selectedItem.message}
                          </div>
                        </div>

                        {/* Admin Action Box */}
                        <div style={{ backgroundColor: '#1e293b', border: '1px solid #38bdf8', borderRadius: '8px', padding: '24px', position: 'relative' }}>
                          <div style={{ position: 'absolute', top: '-12px', left: '20px', backgroundColor: '#1e293b', padding: '0 10px', color: '#38bdf8', fontWeight: '800', fontSize: '0.8rem' }}>
                            คำตอบจากผู้ดูแลระบบ
                          </div>
                          <form onSubmit={handleSaveFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <textarea 
                              rows="5" 
                              value={formData.admin_response} 
                              onChange={e => setFormData({ ...formData, admin_response: e.target.value })} 
                              placeholder="พิมพ์ข้อความตอบกลับผู้ใช้..." 
                              style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '16px', borderRadius: '6px', fontSize: '0.9rem', resize: 'vertical' }} 
                            />
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div>
                                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Set Status:</label>
                                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem' }}>
                                    <option value="new">New</option>
                                    <option value="in_review">Reviewing</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                  </select>
                                </div>
                                <div>
                                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Set Priority:</label>
                                  <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem' }}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                  </select>
                                </div>
                              </div>
                              <button type="submit" style={{ backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(56, 189, 248, 0.2)', transition: 'all 0.2s' }}>
                                <i className="fa-solid fa-paper-plane"></i>ส่งการตอบกลับ
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                      <i className="fa-solid fa-envelope-open-text" style={{ fontSize: '4rem', marginBottom: '20px', color: '#334155' }}></i>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: '600', margin: '0 0 8px 0', color: '#94a3b8' }}>เลือกรายการเพื่อดูรายละเอียด</h3>
                      <p style={{ fontSize: '0.9rem' }}>เลือกจากกล่องข้อความทางด้านซ้ายเพื่อเริ่มตอบกลับ</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODALS SECTION (EDIT USER, RESPOND FEEDBACK, CATALOG CRUD FORMS) */}
      {/* ========================================================================= */}

      {/* 1. EDIT USER MODAL */}
      {modalType === 'user_edit' && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: '0 0 16px 0', color: '#f8fafc' }}>
              <i className="fa-solid fa-pen-to-square" style={{marginRight:"4px"}}></i>แก้ไขข้อมูลผู้ใช้ ({selectedItem?.user_name})
            </h3>
            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ชื่อผู้ใช้งาน:</label>
                <input type="text" value={formData.user_name} onChange={e => setFormData({ ...formData, user_name: e.target.value })} required style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '6px' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>อีเมล:</label>
                <input type="email" value={formData.user_email} onChange={e => setFormData({ ...formData, user_email: e.target.value })} required style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '6px' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>สิทธิ์ (Role):</label>
                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '6px' }}>
                  <option value="user">User (ผู้ใช้งาน)</option>
                  <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>เปลี่ยนรหัสผ่าน (เว้นว่างไว้หากไม่ต้องการเปลี่ยน):</label>
                <input type="password" placeholder="ตั้งรหัสผ่านใหม่..." value={formData.new_password} onChange={e => setFormData({ ...formData, new_password: e.target.value })} style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '6px' }} />
                <p style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '4px', fontStyle: 'italic' }}>* ไม่สามารถแสดงรหัสผ่านเดิมได้ เนื่องจากระบบเข้ารหัส (Hash) ไว้เพื่อความปลอดภัย</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setModalType(null)} style={{ backgroundColor: '#334155', color: '#e2e8f0', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>ยกเลิก</button>
                <button type="submit" style={{ backgroundColor: '#991b1b', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>บันทึกการเปลี่ยนแปลง</button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* 3. CATALOG ITEM FORM MODAL (UNIVERSAL FOR ITEMS, SPELLS, SPECIES, CLASSES) */}
      {modalType && modalType.endsWith('_form') && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', width: '100%', maxWidth: '600px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: '0 0 16px 0', color: '#f8fafc' }}>
              {selectedItem ? '<i className="fa-solid fa-pen-to-square" style={{marginRight:"4px"}}></i>แก้ไขรายการ' : 'เพิ่มรายการใหม่'} ({catalogSubTab.toUpperCase()})
            </h3>
            {catalogSubTab === 'races' && <SpeciesForm initialData={selectedItem} availableFeats={ccData.feats || []} onSave={(data) => handleSaveCatalogItem({ preventDefault: () => {} }, 'races', selectedItem ? 'edit' : 'add', data)} onCancel={() => setModalType(null)} />}
            {catalogSubTab === 'classes' && <ClassForm initialData={selectedItem} availableFeats={ccData.feats || []} onSave={(data) => handleSaveCatalogItem({ preventDefault: () => {} }, 'classes', selectedItem ? 'edit' : 'add', data)} onCancel={() => setModalType(null)} />}
            {catalogSubTab === 'backgrounds' && <BackgroundForm initialData={selectedItem} availableItems={ccData.items || []} availableFeats={ccData.feats || []} onSave={(data) => handleSaveCatalogItem({ preventDefault: () => {} }, 'backgrounds', selectedItem ? 'edit' : 'add', data)} onCancel={() => setModalType(null)} />}
            {catalogSubTab === 'feats' && <FeatForm initialData={selectedItem} onSave={(data) => handleSaveCatalogItem({ preventDefault: () => {} }, 'feats', selectedItem ? 'edit' : 'add', data)} onCancel={() => setModalType(null)} />}
            {catalogSubTab === 'spells' && <SpellForm initialData={selectedItem} onSave={(data) => handleSaveCatalogItem({ preventDefault: () => {} }, 'spells', selectedItem ? 'edit' : 'add', data)} onCancel={() => setModalType(null)} />}
            {catalogSubTab === 'items' && <ItemForm initialData={selectedItem} onSave={(data) => handleSaveCatalogItem({ preventDefault: () => {} }, 'items', selectedItem ? 'edit' : 'add', data)} onCancel={() => setModalType(null)} />}
            {catalogSubTab === 'subclasses' && <SubclassForm initialData={selectedItem} availableClasses={ccData.classes || []} availableFeats={ccData.feats || []} onSave={(data) => handleSaveCatalogItem({ preventDefault: () => {} }, 'subclasses', selectedItem ? 'edit' : 'add', data)} onCancel={() => setModalType(null)} />}
          </div>
        </div>
      )}

    </div>
  );
}
