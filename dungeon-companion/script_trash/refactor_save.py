import sys

with open('src/components/WorkshopCharacterBuilder.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

start_marker = 'const handleSaveToDatabase = async () => {'
end_marker = '  const renderStepContent = () => {'

start_idx = text.find(start_marker)
if start_idx != -1:
    end_idx = text.find(end_marker, start_idx)
    if end_idx != -1:
        replacement = """const handleSaveToDatabase = async (redirectToPlayMode = false) => {
    // TF-WIZ-003 Frontend Validation
    if (!characterState.race?.id) {
      Swal.fire({ title: 'ข้อมูลไม่ครบถ้วน', text: "กรุณาเลือกเผ่าพันธุ์ (Race) ของตัวละครก่อนบันทึก!", icon: 'warning', confirmButtonColor: '#991b1b', background: '#0f172a', color: '#f8fafc' });
      setCurrentStep(1);
      return;
    }
    if (!characterState.classData?.classes || characterState.classData.classes.length === 0 || !characterState.classData.classes[0].classId) {
      Swal.fire({ title: 'ข้อมูลไม่ครบถ้วน', text: "กรุณาเลือกสายอาชีพ (Class) ของตัวละครก่อนบันทึก!", icon: 'warning', confirmButtonColor: '#991b1b', background: '#0f172a', color: '#f8fafc' });
      setCurrentStep(2);
      return;
    }
    if (!characterState.description?.name || characterState.description.name.trim() === '') {
      Swal.fire({ title: 'ข้อมูลไม่ครบถ้วน', text: "กรุณาตั้งชื่อตัวละครในหน้า Details ก่อนบันทึก!", icon: 'warning', confirmButtonColor: '#991b1b', background: '#0f172a', color: '#f8fafc' });
      setCurrentStep(6);
      return;
    }

    const result = await Swal.fire({
      title: 'ยืนยันการบันทึกตัวละคร?',
      text: redirectToPlayMode ? "ต้องการบันทึกและเริ่มเล่นด้วยตัวละครนี้เลยหรือไม่?" : "ต้องการบันทึกตัวละครนี้ลงในฐานข้อมูลหรือไม่?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#15803d',
      cancelButtonColor: '#991b1b',
      confirmButtonText: 'ตกลง (Save)',
      cancelButtonText: 'ยกเลิก',
      background: '#0f172a',
      color: '#f8fafc'
    });

    if (!result.isConfirmed) return;

    setSavingDbStatus('กำลังบันทึกลงฐานข้อมูล...');
    Swal.fire({
      title: 'กำลังบันทึก...',
      text: 'โปรดรอสักครู่',
      allowOutsideClick: false,
      background: '#0f172a',
      color: '#f8fafc',
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const totalLvl = (characterState.classData?.classes || []).reduce((sum, c) => sum + (parseInt(c.level) || 1), 0) || 1;
    try {
      const payload = {
        action: 'save_character',
        char_id: characterState.char_id || null,
        user_id: (() => {
          try {
            const u = JSON.parse(localStorage.getItem('dnd_user'));
            if (u && u.user_id) return parseInt(u.user_id) || 1;
          } catch (e) {}
          return characterState.user_id ? parseInt(characterState.user_id) : 1;
        })(),
        char_name: characterState.description?.name || 'Unnamed Hero',
        species_id: characterState.race?.id,
        lineage_id: characterState.race?.subraceId || characterState.race?.lineageId,
        background_id: characterState.background?.id || characterState.background?.backgroundId || null,
        primary_class_id: characterState.classData?.classes?.[0]?.classId,
        classes_data: characterState.classData?.classes || [],
        char_alignment: characterState.description?.alignment || 'True Neutral',
        char_level: totalLvl,
        hp_max: resolvedMechanics?.hitPoints?.max || 10,
        hp_current: reviewHpCur !== null ? reviewHpCur : (resolvedMechanics?.hitPoints?.max || 10),
        str_score: totalStats.str,
        dex_score: totalStats.dex,
        con_score: totalStats.con,
        int_score: totalStats.int,
        wis_score: totalStats.wis,
        cha_score: totalStats.cha,
        proficiencies_choices: {
          skills: characterState.proficiencies?.skills || [],
          tools: characterState.proficiencies?.tools || []
        },
        spellcasting_data: characterState.spells || {},
        inventory: characterState.equipment || characterState.inventory || {},
        currency: characterState.equipment?.currency || { cp: 0, sp: 0, ep: 0, gp: 50, pp: 0 },
        feats_data: characterState.feats || [],
        hit_dice_current: characterState.hit_dice_current || {},
        death_save_success: characterState.death_save_success || 0,
        death_save_failure: characterState.death_save_failure || 0,
        inspiration: characterState.inspiration || 0,
        exhaustion_level: characterState.exhaustion_level || 0,
        base_ac: resolvedMechanics?.armorClass?.value || 10,
        build_data: characterState,
        play_data: { reviewHpCur: reviewHpCur !== null ? reviewHpCur : (resolvedMechanics?.hitPoints?.max || 10) }
      };
      const res = await fetch('http://localhost:5000/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status === 'success') {
        const targetId = data.char_id || characterState.char_id;
        
        // Log Character Save event to database
        if (targetId) {
          try {
            await fetch('http://localhost:5000/api', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'add_character_log',
                char_id: targetId,
                user_id: 1,
                category: 'build',
                action_type: 'SAVE_CHARACTER',
                log_text_th: `บันทึกอัปเดตตัวละคร ${characterState.description?.name || 'ตัวละคร'} (Level ${totalLvl}) ในเวิร์คช็อปสำเร็จ`,
                metadata_json: { char_name: characterState.description?.name, level: totalLvl }
              })
            });
          } catch(e) {}
        }
        
        // Clear local draft so new session starts fresh
        localStorage.removeItem('workshop_characterState');
        localStorage.removeItem('workshop_currentStep');

        Swal.fire({
          title: 'บันทึกสำเร็จ!',
          text: redirectToPlayMode ? 'กำลังพาคุณเข้าสู่หน้าเล่น...' : 'กำลังพาคุณกลับไปยังหน้ารายการตัวละคร...',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: '#0f172a',
          color: '#f8fafc'
        }).then(() => {
          setSavingDbStatus('');
          if (redirectToPlayMode && targetId) {
            window.location.href = `/character/${targetId}`;
          } else {
            window.location.href = '/sheets';
          }
        });
      } else {
        Swal.fire({ title: 'บันทึกไม่สำเร็จ', text: data.message || 'Unknown error', icon: 'error', background: '#0f172a', color: '#f8fafc' });
        setSavingDbStatus('');
      }
    } catch (err) {
      console.error("Save to DB Error:", err);
      Swal.fire({ title: 'ข้อผิดพลาด', text: `ไม่สามารถเชื่อมต่อฐานข้อมูลได้: ${err}`, icon: 'error', background: '#0f172a', color: '#f8fafc' });
      setSavingDbStatus('');
    }
  };
"""
        text = text[:start_idx] + replacement + text[end_idx:]
        with open('src/components/WorkshopCharacterBuilder.jsx', 'w', encoding='utf-8') as f:
            f.write(text)
        print('Replacement successful.')
    else:
        print('End marker not found.')
else:
    print('Start marker not found.')
