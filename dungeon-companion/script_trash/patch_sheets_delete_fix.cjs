const fs = require('fs');
let content = fs.readFileSync('src/pages/Sheets.jsx', 'utf8');

const startIndex = content.indexOf('const handleDelete = async (charId, charName) => {');
const endIndexStr = `    } finally {
      setDeletingId(null);
    }
  };`;
const endIndex = content.indexOf(endIndexStr, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    const oldBlock = content.substring(startIndex, endIndex + endIndexStr.length);
    const newHandleDelete = `const handleDelete = async (charId, charName) => {
    const { value: typedText } = await Swal.fire({
      title: '⚠️ ยืนยันการลบตัวละคร',
      html: \`
        <div style="text-align: left; margin-top: 10px;">
          <p style="margin-bottom: 10px;">คุณกำลังจะลบตัวละคร <strong>"\${charName}"</strong> อย่างถาวร</p>
          <p style="color: #991b1b; font-size: 0.9em; margin-bottom: 15px; padding: 10px; background-color: #fee2e2; border-left: 4px solid #dc2626; border-radius: 4px;">
            ⚠️ <strong>คำเตือน:</strong> ข้อมูลแผ่นตัวละคร (Character Sheet), สถิติ, พลังชีวิต, และสิ่งของในช่องเก็บของทั้งหมดของตัวละครนี้ จะถูกลบทิ้งจากฐานข้อมูลและ<strong>ไม่สามารถกู้คืนได้อีก</strong>
          </p>
          <p style="font-size: 0.9em; font-weight: bold; margin-bottom: 5px;">
            โปรดยืนยันโดยการพิมพ์คำว่า <span style="color: #dc2626; letter-spacing: 1px; user-select: none;">DELETE</span> ลงในช่องด้านล่าง:
          </p>
        </div>
      \`,
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
          text: \`ตัวละคร "\${charName}" ถูกลบออกจากสารบบแล้ว\`,
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
  };`;
    
    content = content.replace(oldBlock, newHandleDelete);
    fs.writeFileSync('src/pages/Sheets.jsx', content, 'utf8');
    console.log("Patched handleDelete successfully with indexOf");
} else {
    console.log("Could not find the block to replace.");
}
