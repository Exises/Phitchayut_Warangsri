import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

export default function AdventureDiaryModal({ isOpen, onClose, diaryEntries = [], onSaveDiaryEntries, initialSelectedEntry = null }) {
  const [viewState, setViewState] = useState('index'); // 'index' | 'spread'
  const [activeEntryId, setActiveEntryId] = useState(null);
  
  // Entry Fields
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  
  // Single Master Story Stream + Linked Pages Array
  // Page 0 (Spread 0 Left): strictly 12 lines max (360px height)
  // Page 1 (Spread 0 Right): strictly 16 lines max (480px height)
  // Page 2+ (Spread > 0 Left/Right): strictly 16 lines max (480px height)
  const [pages, setPages] = useState(['', '']);
  const [spreadIndex, setSpreadIndex] = useState(0);
  
  // Original backup for "ใช้มีดขูดคำทิ้ง (รีเซต)"
  const [originalBackup, setOriginalBackup] = useState(null);
  
  // Search state for Index view
  const [searchTitle, setSearchTitle] = useState('');

  // Refs for Left and Right page textareas on current spread & off-screen measurer
  const leftTextareaRef = useRef(null);
  const rightTextareaRef = useRef(null);
  const measurerRef = useRef(null);

  const handleOpenEntry = (entry) => {
    setActiveEntryId(entry.id);
    const title = entry.title || '';
    const date = entry.date || new Date().toISOString().split('T')[0];
    
    // Migrate saved content into clean linked pages array
    let loadedPages = [];
    if (Array.isArray(entry.pages) && entry.pages.length > 0) {
      loadedPages = [...entry.pages];
    } else if (Array.isArray(entry.spreads) && entry.spreads.length > 0) {
      entry.spreads.forEach(s => {
        loadedPages.push(s.left || '');
        loadedPages.push(s.right || '');
      });
    } else {
      loadedPages = [entry.contentLeft || entry.content || '', entry.contentRight || ''];
    }
    while (loadedPages.length < 2) loadedPages.push('');
    
    setEditTitle(title);
    setEditDate(date);
    setPages(loadedPages);
    setSpreadIndex(0);
    setOriginalBackup({
      title,
      date,
      pages: JSON.parse(JSON.stringify(loadedPages))
    });
    setViewState('spread');
  };

  useEffect(() => {
    if (!isOpen) {
      setViewState('index');
      setActiveEntryId(null);
      setSearchTitle('');
    } else if (isOpen && initialSelectedEntry) {
      handleOpenEntry(initialSelectedEntry);
    } else if (isOpen && !initialSelectedEntry) {
      setViewState('index');
    }
  }, [isOpen, initialSelectedEntry]);

  if (!isOpen) return null;

  // Filter and Sort Entries (Only search by Title as requested)
  const filteredEntries = [...diaryEntries]
    .filter(e => {
      if (!searchTitle.trim()) return true;
      const title = (e.title || '').toLowerCase();
      return title.includes(searchTitle.trim().toLowerCase());
    })
    .sort((a, b) => {
      return new Date(b.date || 0) - new Date(a.date || 0);
    });

  const handleStartNewStory = () => {
    setActiveEntryId(null);
    setEditTitle('');
    const todayStr = new Date().toISOString().split('T')[0];
    setEditDate(todayStr);
    const initialPages = ['', ''];
    setPages(initialPages);
    setSpreadIndex(0);
    setOriginalBackup({
      title: '',
      date: todayStr,
      pages: initialPages
    });
    setViewState('spread');
  };

  // Exact max height for page index
  const getPageMaxHeight = (pageIdx) => (pageIdx === 0 ? 360 : 480);

  // Precision DOM measurer: binary searches exact character where line wrap exceeded `maxHeight` (`12 lines or 16 lines`)
  const measureFitPrefix = (text, maxHeight) => {
    const measurer = measurerRef.current;
    if (!measurer || !text) return (text || '').length;

    measurer.style.height = `${maxHeight}px`;
    measurer.value = text;
    measurer.scrollTop = 0;
    
    // If exact text fits without generating a single extra line (`scrollHeight <= maxHeight`)
    if (measurer.scrollHeight <= maxHeight + 1 && measurer.scrollTop === 0) {
      return text.length;
    }

    // Binary search to find exact character boundary where line wrap exceeded maxHeight
    let low = 0;
    let high = text.length;
    let bestFit = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      measurer.value = text.substring(0, mid);
      if (measurer.scrollHeight <= maxHeight + 1) {
        bestFit = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    // Check if bestFit landed right inside a word or newline; if there's a space or newline just before bestFit, snap to it so words don't chop
    if (bestFit < text.length && bestFit > 0) {
      const lastSpace = text.lastIndexOf(' ', bestFit);
      const lastNewline = text.lastIndexOf('\n', bestFit);
      const breakIdx = Math.max(lastSpace, lastNewline);
      if (breakIdx > 0 && bestFit - breakIdx < 20) {
        return breakIdx;
      }
    }

    return bestFit;
  };

  // Check if a specific page is completely filled (`isFull`)
  const isPageFull = (pageIdx, text) => {
    if (!text || text.trim().length === 0) return false;
    const measurer = measurerRef.current;
    if (!measurer) return text.length > (pageIdx === 0 ? 300 : 450);
    const maxHeight = getPageMaxHeight(pageIdx);
    measurer.style.height = `${maxHeight}px`;
    measurer.value = text + '\nก';
    return measurer.scrollHeight > maxHeight + 1;
  };

  // Master Linked Paginator (`เชื่อมและลิงค์กันทุกหน้า 100% ไม่เพิ่มบรรทัดเกิน ไม่มีจมใต้ขีด`)
  const handlePageChange = (pageIdx, newText, isFromTyping = true) => {
    const maxHeight = getPageMaxHeight(pageIdx);
    const fitLen = measureFitPrefix(newText, maxHeight);
    const kept = newText.substring(0, fitLen).trimStart();
    const immediateOverflow = newText.substring(fitLen).trimStart();

    setPages(prev => {
      const next = [...prev];
      next[pageIdx] = kept;

      // If typing or pasting caused immediate overflow (`ล้นไปบรรทัดที่ 13 หรือ 17`), cascade to next page cleanly
      if (immediateOverflow.length > 0) {
        let currentOverflow = immediateOverflow;
        let currIdx = pageIdx + 1;

        while (currentOverflow.length > 0) {
          if (currIdx >= next.length) next.push('');
          const combinedNext = currentOverflow + (next[currIdx] ? ' ' + next[currIdx] : '');
          const nextMaxHeight = getPageMaxHeight(currIdx);
          const nextFitLen = measureFitPrefix(combinedNext, nextMaxHeight);

          next[currIdx] = combinedNext.substring(0, nextFitLen).trimStart();
          currentOverflow = combinedNext.substring(nextFitLen).trimStart();
          currIdx++;
        }
      } else {
        // Auto pull-back: If current page now has extra space and next page has words, pull back automatically! (`ดูดคำย้อนกลับอัตโนมัติ`)
        let currIdx = pageIdx;
        while (currIdx + 1 < next.length && next[currIdx + 1] && next[currIdx + 1].length > 0) {
          const currMaxHeight = getPageMaxHeight(currIdx);
          const nextText = next[currIdx + 1];
          const firstSpace = nextText.indexOf(' ');
          const firstNewline = nextText.indexOf('\n');
          let chunkIdx = -1;
          if (firstSpace !== -1 && firstNewline !== -1) chunkIdx = Math.min(firstSpace, firstNewline);
          else if (firstSpace !== -1) chunkIdx = firstSpace;
          else chunkIdx = firstNewline;

          const pullChunk = chunkIdx !== -1 ? nextText.substring(0, chunkIdx) : nextText;
          const testCombined = (next[currIdx] ? next[currIdx] + ' ' : '') + pullChunk;

          if (measureFitPrefix(testCombined, currMaxHeight) === testCombined.length) {
            next[currIdx] = testCombined;
            next[currIdx + 1] = chunkIdx !== -1 ? nextText.substring(chunkIdx + 1).trimStart() : '';
          } else {
            break;
          }
        }
      }

      // Trim empty trailing pages beyond page 1
      while (next.length > 2 && !next[next.length - 1] && !next[next.length - 2] && next.length - 2 > spreadIndex * 2) {
        next.pop();
      }

      return next;
    });

    // Zero-delay synchronous scroll lock & focus jump (`ป้องกันไม่ให้เพิ่มบรรทัดแวบขึ้นมาก่อนไปหน้าใหม่`)
    if (isFromTyping && immediateOverflow.length > 0) {
      const nextPageIdx = pageIdx + 1;
      const targetSpread = Math.floor(nextPageIdx / 2);
      
      // Lock scroll position of current textarea immediately so it never jumps
      const activeTextarea = pageIdx % 2 === 0 ? leftTextareaRef.current : rightTextareaRef.current;
      if (activeTextarea) {
        activeTextarea.scrollTop = 0;
      }

      if (targetSpread !== spreadIndex) {
        setSpreadIndex(targetSpread);
        setTimeout(() => {
          const targetRef = nextPageIdx % 2 === 0 ? leftTextareaRef.current : rightTextareaRef.current;
          if (targetRef) {
            targetRef.focus();
            targetRef.setSelectionRange(Math.min(immediateOverflow.length, targetRef.value.length), Math.min(immediateOverflow.length, targetRef.value.length));
            targetRef.scrollTop = 0;
          }
        }, 30);
      } else {
        const targetRef = nextPageIdx % 2 === 0 ? leftTextareaRef.current : rightTextareaRef.current;
        if (targetRef) {
          targetRef.focus();
          targetRef.setSelectionRange(Math.min(immediateOverflow.length, targetRef.value.length), Math.min(immediateOverflow.length, targetRef.value.length));
          targetRef.scrollTop = 0;
        }
      }
    }
  };

  // Handle Backspace across page & spread boundaries (`ลบย้อนกลับข้ามหน้าและสเปรดได้ทันที`)
  const handlePageKeyDown = (pageIdx, e) => {
    if (e.key === 'Backspace' && e.target.selectionStart === 0 && e.target.selectionEnd === 0 && pageIdx > 0) {
      e.preventDefault();
      const prevPageIdx = pageIdx - 1;
      const targetSpread = Math.floor(prevPageIdx / 2);

      if (targetSpread !== spreadIndex) {
        setSpreadIndex(targetSpread);
        setTimeout(() => {
          const targetRef = prevPageIdx % 2 === 0 ? leftTextareaRef.current : rightTextareaRef.current;
          if (targetRef) {
            targetRef.focus();
            const len = targetRef.value.length;
            targetRef.setSelectionRange(len, len);
            const prevText = targetRef.value;
            if (prevText.length > 0) {
              handlePageChange(prevPageIdx, prevText.slice(0, -1), false);
            }
          }
        }, 30);
      } else {
        const targetRef = prevPageIdx % 2 === 0 ? leftTextareaRef.current : rightTextareaRef.current;
        if (targetRef) {
          targetRef.focus();
          const len = targetRef.value.length;
          targetRef.setSelectionRange(len, len);
          const prevText = targetRef.value;
          if (prevText.length > 0) {
            handlePageChange(prevPageIdx, prevText.slice(0, -1), false);
          }
        }
      }
    }
  };

  const leftPageIdx = spreadIndex * 2;
  const rightPageIdx = spreadIndex * 2 + 1;
  const leftPageText = pages[leftPageIdx] || '';
  const rightPageText = pages[rightPageIdx] || '';
  
  // Can only write on right page if left page is full (or if right page already has text)
  const isLeftPageFilled = leftPageText.trim().length > 0 && isPageFull(leftPageIdx, leftPageText);
  const canEditRightPage = isLeftPageFilled || rightPageText.trim().length > 0;

  // Strict check before allowing manual flip to next spread
  const canFlipNext = () => {
    if (spreadIndex * 2 + 2 < pages.length && (pages[spreadIndex * 2 + 2] || pages[spreadIndex * 2 + 3])) {
      return true;
    }
    const isRightFilled = rightPageText.trim().length > 0 && isPageFull(rightPageIdx, rightPageText);
    return isLeftPageFilled && isRightFilled;
  };

  const handleFlipPage = (direction) => {
    if (direction === 'prev' && spreadIndex > 0) {
      setSpreadIndex(spreadIndex - 1);
    } else if (direction === 'next') {
      if (!canFlipNext() && spreadIndex * 2 + 2 >= pages.length) {
        alert('คุณต้องเขียนบันทึกในหน้าปัจจุบันทั้งซ้ายและขวาให้เต็มก่อน จึงจะสามารถพลิกไปเขียนหน้าถัดไปได้ครับ');
        return;
      }
      if (spreadIndex * 2 + 2 < pages.length) {
        setSpreadIndex(spreadIndex + 1);
      } else {
        setPages(prev => [...prev, '', '']);
        setSpreadIndex(spreadIndex + 1);
      }
    }
  };

  const handleSaveEntry = () => {
    const titleToSave = editTitle.trim() || 'บันทึกการเดินทางที่ไม่มีชื่อ';
    const dateToSave = editDate || new Date().toISOString().split('T')[0];
    const combinedContent = pages.filter(Boolean).join('\n\n--- หน้าถัดไป ---\n\n');

    let updatedEntries;
    if (activeEntryId) {
      updatedEntries = diaryEntries.map(e => {
        if (e.id === activeEntryId) {
          return {
            ...e,
            title: titleToSave,
            date: dateToSave,
            content: combinedContent,
            pages: pages,
            updatedAt: new Date().toISOString()
          };
        }
        return e;
      });
    } else {
      const newEntry = {
        id: `diary_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: titleToSave,
        date: dateToSave,
        content: combinedContent,
        pages: pages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      updatedEntries = [newEntry, ...diaryEntries];
    }

    onSaveDiaryEntries(updatedEntries);
    setViewState('index');
  };

  const handleResetScrape = () => {
    if (!originalBackup) return;
    setEditTitle(originalBackup.title);
    setEditDate(originalBackup.date);
    setPages(JSON.parse(JSON.stringify(originalBackup.pages)));
    setSpreadIndex(0);
  };

  const handleDeleteEntry = () => {
    if (!activeEntryId) {
      setViewState('index');
      return;
    }
    if (!window.confirm('คุณต้องการฉีกหน้ากระดาษบันทึกนี้ทิ้งอย่างถาวรใช่หรือไม่?')) {
      return;
    }
    const updatedEntries = diaryEntries.filter(e => e.id !== activeEntryId);
    onSaveDiaryEntries(updatedEntries);
    setViewState('index');
  };

  // Helper component: renders exact 12 or 16 horizontal background lines with crisp bottom border
  const renderRuledLinesBackground = (numLines) => {
    return (
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'none',
        zIndex: 1
      }}>
        {Array.from({ length: numLines }).map((_, i) => (
          <div
            key={i}
            style={{
              height: '30px',
              width: '100%',
              boxSizing: 'border-box',
              borderBottom: '1px solid #e2d8c3'
            }}
          />
        ))}
      </div>
    );
  };

  return ReactDOM.createPortal((
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.78)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px',
      backdropFilter: 'blur(5px)'
    }}>
      <style>{`
        /* Hide native Chrome/Edge/Windows calendar icon right near the numbers so ONLY our right-edge calendar icon shows */
        .diary-clean-date-input::-webkit-calendar-picker-indicator {
          opacity: 0;
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }
        /* Ensure text glyphs including Thai lower vowels sit strictly ABOVE the 30px line border without dipping under */
        .diary-ruled-textarea {
          position: relative;
          z-index: 10;
          background: transparent;
          line-height: 30px;
          font-size: 0.95rem;
          font-family: inherit;
          color: #1e293b;
          border: none;
          outline: none;
          resize: none;
          overflow: hidden;
          padding: 0;
          margin: 0;
          box-sizing: border-box;
          /* Slight upward baseline balance so lower vowels sit right above the horizontal ruled line */
          padding-bottom: 2px;
        }
      `}</style>

      {/* Hidden DOM Offscreen Measurer for 100% precise line & word wrapping calculation across browser engines */}
      <textarea
        ref={measurerRef}
        aria-hidden="true"
        className="diary-ruled-textarea"
        style={{
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          width: '404px',
          visibility: 'hidden',
          pointerEvents: 'none',
          height: '480px'
        }}
      />

      {/* STATE A: INDEX VIEW (VERTICAL LEATHER BOUND DIARY COVER - ULTRA CRISP PROTOTYPE MATCH) */}
      {viewState === 'index' && (
        <div style={{
          backgroundColor: '#3a251b',
          borderRadius: '16px',
          width: '480px',
          height: '700px',
          maxHeight: '90vh',
          display: 'flex',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 65px -12px rgba(0, 0, 0, 0.9), inset 0 0 0 2px #26160d',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}>
          {/* Vertical Leather Book Spine Strip with Sharp Stitched Dashed Seam */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '28px',
            backgroundColor: '#301f15',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'center',
            padding: '16px 0',
            pointerEvents: 'none'
          }}>
            <div style={{
              width: '1px',
              height: '100%',
              borderLeft: '1.5px dashed rgba(255, 255, 255, 0.22)'
            }} />
          </div>

          {/* Main Cover Content */}
          <div style={{
            marginLeft: '28px',
            padding: '26px 26px 24px 26px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            boxSizing: 'border-box'
          }}>
            {/* Header & Close */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '16px',
              borderBottom: '1px solid #6e503b',
              marginBottom: '18px'
            }}>
              <h3 style={{
                fontFamily: 'Cinzel, serif',
                fontSize: '1.65rem',
                color: '#eab308',
                margin: 0,
                fontWeight: 'bold',
                letterSpacing: '1px'
              }}>
                ADVENTURE DIARY
              </h3>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '1.6rem',
                  cursor: 'pointer',
                  padding: '0 4px',
                  lineHeight: 1,
                  transition: 'color 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.color = '#eab308'}
                onMouseOut={e => e.currentTarget.style.color = '#9ca3af'}
              >
                ✕
              </button>
            </div>

            {/* Crisp Title-Only Search Bar with Classic Monochrome Icon */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#301f15',
                border: '1px solid #6b4d36',
                borderRadius: '6px',
                padding: '10px 14px',
                gap: '10px',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)'
              }}>
                <i className="fa-solid fa-magnifying-glass" style={{ color: '#ca8a04', fontSize: '0.95rem' }}></i>
                <input
                  type="text"
                  placeholder="ค้นหาชื่อเรื่องราว..."
                  value={searchTitle}
                  onChange={e => setSearchTitle(e.target.value)}
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--bg-white)',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit'
                  }}
                />
                {searchTitle && (
                  <button
                    onClick={() => setSearchTitle('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9ca3af',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Entry Cards List (Ultra Crisp, No Colorful Emojis) */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              paddingRight: '4px'
            }}>
              {filteredEntries.map(entry => (
                <div
                  key={entry.id}
                  onClick={() => handleOpenEntry(entry)}
                  style={{
                    backgroundColor: '#473123',
                    border: '1px solid #6b4d36',
                    borderRadius: '6px',
                    padding: '16px 18px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.borderColor = '#eab308';
                    e.currentTarget.style.backgroundColor = '#523a2a';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.borderColor = '#6b4d36';
                    e.currentTarget.style.backgroundColor = '#473123';
                  }}
                >
                  <div style={{
                    fontSize: '1.1rem',
                    color: 'var(--bg-white)',
                    fontWeight: 'bold',
                    marginBottom: '6px',
                    letterSpacing: '0.3px'
                  }}>
                    {entry.title || 'บันทึกที่ไม่ระบุชื่อ'}
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#ca8a04',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <i className="fa-regular fa-calendar" style={{ fontSize: '0.9rem' }}></i>
                    <span>{entry.date || 'ไม่ระบุวันที่'}</span>
                  </div>
                </div>
              ))}

              {filteredEntries.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#9ca3af',
                  fontStyle: 'italic',
                  fontSize: '0.9rem'
                }}>
                  {searchTitle ? 'ไม่พบชื่อเรื่องราวที่ค้นหา' : 'ยังไม่มีเรื่องราวที่ถูกบันทึกไว้\nคลิกปุ่มด้านล่างเพื่อเริ่มเขียนหน้าแรกของคุณ!'}
                </div>
              )}
            </div>

            {/* Bottom Action Button (No Colorful Emojis) */}
            <div style={{ marginTop: '18px' }}>
              <button
                onClick={handleStartNewStory}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#362318',
                  border: '1.5px solid #ca8a04',
                  borderRadius: '6px',
                  color: '#eab308',
                  fontSize: '1.05rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.backgroundColor = '#473123';
                  e.currentTarget.style.borderColor = '#facc15';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.backgroundColor = '#362318';
                  e.currentTarget.style.borderColor = '#ca8a04';
                }}
              >
                <i className="fa-solid fa-feather-pointed" style={{ fontSize: '1.1rem' }}></i> เริ่มการจดบันทึกเรื่องราว
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATE B: SPREAD VIEW (2-PAGE OPEN NOTEBOOK SPREAD WITH EXACT RULED OVERLAY & ZERO-DIP BASELINE) */}
      {viewState === 'spread' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          {/* THE NOTEBOOK SPREAD */}
          <div style={{
            backgroundColor: 'var(--bg-paper)',
            borderRadius: '12px',
            width: '920px',
            maxWidth: '96vw',
            height: '640px',
            maxHeight: '82vh',
            display: 'flex',
            border: '6px solid #3a251b',
            boxShadow: '0 30px 65px -15px rgba(0, 0, 0, 0.95)',
            position: 'relative',
            overflow: 'hidden',
            color: 'var(--color-ink)'
          }}>
            {/* Close / Back to Index button */}
            <button
              onClick={() => setViewState('index')}
              title="กลับไปหน้าสารบัญ"
              style={{
                position: 'absolute',
                top: '16px',
                right: '20px',
                background: 'none',
                border: 'none',
                color: '#711a19',
                fontSize: '1.6rem',
                cursor: 'pointer',
                fontWeight: 'bold',
                zIndex: 50
              }}
            >
              ✕
            </button>

            {/* LEFT PAGE: EXACT 360PX HEIGHT ON PAGE 1 (12 LINES) OR 480PX ON PAGE 3+ (16 LINES) */}
            <div style={{
              flex: 1,
              padding: '36px 36px 48px 40px',
              borderRight: '1px solid #d6cbbd',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              boxSizing: 'border-box'
            }}>
              {/* Header Title & Date (ONLY rendered on Page 1 / spreadIndex === 0, exact 90px clean background without lines) */}
              {spreadIndex === 0 && (
                <div style={{
                  backgroundColor: 'var(--bg-paper)',
                  paddingBottom: '14px',
                  marginBottom: '6px',
                  borderBottom: '1px solid #cbd5e1',
                  height: '84px',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  {/* Title Input */}
                  <div style={{ borderBottom: '2px solid #711a19', paddingBottom: '2px' }}>
                    <input
                      type="text"
                      placeholder="ชื่อบันทึกการเดินทาง..."
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      style={{
                        width: '100%',
                        fontSize: '1.35rem',
                        fontWeight: 'bold',
                        color: '#711a19',
                        border: 'none',
                        outline: 'none',
                        backgroundColor: 'transparent',
                        fontFamily: 'Cinzel, serif'
                      }}
                    />
                  </div>

                  {/* Single Calendar Picker on far right edge */}
                  <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: 'var(--color-gray)'
                  }}>
                    <input
                      type="date"
                      value={editDate}
                      onChange={e => setEditDate(e.target.value)}
                      className="diary-clean-date-input"
                      style={{
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--color-gray)',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        outline: 'none',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        position: 'relative',
                        zIndex: 10,
                        width: '100%'
                      }}
                    />
                    <i className="fa-regular fa-calendar" style={{
                      fontSize: '1.1rem',
                      color: 'var(--color-ink)',
                      position: 'absolute',
                      right: '4px',
                      pointerEvents: 'none'
                    }}></i>
                  </div>
                </div>
              )}

              {spreadIndex > 0 && (
                <div style={{
                  fontSize: '0.8rem',
                  color: 'var(--color-gray)',
                  fontWeight: 'bold',
                  marginBottom: '6px',
                  paddingBottom: '6px',
                  borderBottom: '1px dashed #cbd5e1',
                  display: 'flex',
                  justifyContent: 'space-between',
                  height: '24px',
                  boxSizing: 'border-box'
                }}>
                  <span><i className="fa-solid fa-book"></i> {editTitle || 'บันทึกการเดินทาง'} (ต่อ)</span>
                  <span>หน้า {leftPageIdx + 1}</span>
                </div>
              )}

              {/* Left Page Exact Background Grid Overlay + Textarea (`อยู่เหนือขีดเท่านั้นไม่มีทางจมใต้ขีด`) */}
              <div style={{
                height: spreadIndex === 0 ? '360px' : '480px',
                width: '100%',
                position: 'relative'
              }}>
                {renderRuledLinesBackground(spreadIndex === 0 ? 12 : 16)}
                <textarea
                  ref={leftTextareaRef}
                  className="diary-ruled-textarea"
                  placeholder={spreadIndex === 0 ? "เรื่องราวหน้าแรกเริ่มต้นขึ้นเมื่อ..." : `บันทึกเรื่องราวหน้า ${leftPageIdx + 1}...`}
                  value={leftPageText}
                  onChange={e => handlePageChange(leftPageIdx, e.target.value)}
                  onKeyDown={e => handlePageKeyDown(leftPageIdx, e)}
                  style={{
                    height: spreadIndex === 0 ? '360px' : '480px',
                    width: '100%'
                  }}
                />
              </div>

              {/* Page Number Indicator */}
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: 0,
                right: 0,
                textAlign: 'center',
                fontSize: '0.75rem',
                color: 'var(--color-gray)',
                pointerEvents: 'none'
              }}>
                - {leftPageIdx + 1} -
              </div>
            </div>

            {/* CENTER BOOK FOLD SHADOW (SPINE DIVIDER) */}
            <div style={{
              width: '4px',
              backgroundColor: '#d6cbbd',
              boxShadow: 'inset 12px 0 16px -10px rgba(0,0,0,0.35), inset -12px 0 16px -10px rgba(0,0,0,0.35)',
              pointerEvents: 'none'
            }} />

            {/* RIGHT PAGE: EXACT 480PX HEIGHT (16 LINES) WITH STRICT INTERLOCK & ZERO-DIP BASELINE */}
            <div style={{
              flex: 1,
              padding: '36px 40px 48px 36px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              boxSizing: 'border-box'
            }}>
              <div style={{
                fontSize: '0.8rem',
                color: 'var(--color-gray)',
                fontWeight: 'bold',
                marginBottom: '6px',
                paddingBottom: '6px',
                borderBottom: '1px dashed #cbd5e1',
                display: 'flex',
                justifyContent: 'flex-end',
                height: spreadIndex === 0 ? '90px' : '24px',
                alignItems: 'flex-end',
                boxSizing: 'border-box'
              }}>
                <span>หน้า {rightPageIdx + 1}</span>
              </div>

              {/* Right Page Exact Background Grid Overlay + Textarea */}
              <div style={{
                height: '480px',
                width: '100%',
                position: 'relative'
              }}>
                {renderRuledLinesBackground(16)}
                <textarea
                  ref={rightTextareaRef}
                  readOnly={!canEditRightPage}
                  className="diary-ruled-textarea"
                  placeholder={
                    !canEditRightPage
                      ? `[กรุณาเขียนบันทึกหน้า ${leftPageIdx + 1} ด้านซ้ายให้เต็มก่อน ข้อความจึงจะไหลมาเขียนต่อที่หน้า ${rightPageIdx + 1} นี้ครับ]`
                      : `บันทึกเรื่องราวหน้า ${rightPageIdx + 1}...`
                  }
                  value={rightPageText}
                  onClick={() => {
                    if (!canEditRightPage && leftTextareaRef.current) {
                      leftTextareaRef.current.focus();
                    }
                  }}
                  onChange={e => {
                    if (!canEditRightPage) return;
                    handlePageChange(rightPageIdx, e.target.value);
                  }}
                  onKeyDown={e => {
                    if (!canEditRightPage) return;
                    handlePageKeyDown(rightPageIdx, e);
                  }}
                  style={{
                    height: '480px',
                    width: '100%',
                    opacity: canEditRightPage ? 1 : 0.45,
                    cursor: canEditRightPage ? 'text' : 'not-allowed'
                  }}
                />
              </div>

              {/* Page Number Indicator */}
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: 0,
                right: 0,
                textAlign: 'center',
                fontSize: '0.75rem',
                color: 'var(--color-gray)',
                pointerEvents: 'none'
              }}>
                - {rightPageIdx + 1} -
              </div>
            </div>

            {/* PAGE TURN BUTTONS INSIDE BOOK BOTTOM CORNERS (CLEAN MONOCHROME SYMBOLS) */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '20px',
              right: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              pointerEvents: 'none'
            }}>
              <button
                type="button"
                onClick={() => handleFlipPage('prev')}
                disabled={spreadIndex === 0}
                style={{
                  pointerEvents: spreadIndex === 0 ? 'none' : 'auto',
                  opacity: spreadIndex === 0 ? 0 : 1,
                  backgroundColor: '#711a19',
                  color: 'var(--bg-white)',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s'
                }}
              >
                <i className="fa-solid fa-chevron-left"></i> พลิกกลับหน้า {leftPageIdx - 1}-{leftPageIdx}
              </button>

              <button
                type="button"
                onClick={() => handleFlipPage('next')}
                style={{
                  pointerEvents: 'auto',
                  backgroundColor: '#711a19',
                  color: 'var(--bg-white)',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s'
                }}
              >
                {spreadIndex * 2 + 2 < pages.length ? (
                  <>พลิกไปหน้า {rightPageIdx + 2}-{rightPageIdx + 3} <i className="fa-solid fa-chevron-right"></i></>
                ) : (
                  <><i className="fa-solid fa-plus"></i> เพิ่มหน้ากระดาษใหม่</>
                )}
              </button>
            </div>
          </div>

          {/* FLOATING PILL ACTION BAR (DOCKED DIRECTLY UNDER THE NOTEBOOK, CLASSIC MONO ICONS & EXACT WORDING) */}
          <div style={{
            backgroundColor: 'var(--color-ink)',
            border: '1.5px solid #ca8a04',
            borderRadius: '30px',
            padding: '10px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
          }}>
            <button
              type="button"
              onClick={handleSaveEntry}
              style={{
                background: 'none',
                border: 'none',
                color: '#facc15',
                fontSize: '0.95rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s'
              }}
            >
              <i className="fa-solid fa-feather-pointed" style={{ fontSize: '1rem' }}></i> วางปากกาลง (บันทึก)
            </button>

            <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--color-gray)' }} />

            {/* If activeEntryId is present (editing/reading existing story), show "ใช้มีดขูดคำทิ้ง (รีเซต)" AND "ฉีกกระดาษทิ้ง (ลบ)" */}
            {activeEntryId ? (
              <>
                <button
                  type="button"
                  onClick={handleResetScrape}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#fbbf24',
                    fontSize: '0.95rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.15s'
                  }}
                  title="ขูดคำที่เพิ่งแก้ไขออก เพื่อย้อนกลับไปข้อความเดิมก่อนแก้ไข"
                >
                  <i className="fa-solid fa-eraser" style={{ fontSize: '1rem' }}></i> ใช้มีดขูดคำทิ้ง (รีเซต)
                </button>

                <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--color-gray)' }} />

                <button
                  type="button"
                  onClick={handleDeleteEntry}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#f87171',
                    fontSize: '0.95rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.15s'
                  }}
                  title="ลบบันทึกเรื่องราวน้านี้ทิ้งอย่างถาวร"
                >
                  <i className="fa-solid fa-trash-can" style={{ fontSize: '1rem' }}></i> ฉีกกระดาษทิ้ง (ลบ)
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleDeleteEntry}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f87171',
                  fontSize: '0.95rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s'
                }}
              >
                <i className="fa-solid fa-trash-can" style={{ fontSize: '1rem' }}></i> ฉีกกระดาษทิ้ง (ยกเลิก)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  ), document.body);
}
