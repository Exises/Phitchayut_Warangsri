import React from 'react';
import { Link } from 'react-router-dom';

function HowToPlay() {
    return (
        <div className="flex-1 min-h-[90vh] bg-[#f9f8f6] py-12 px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200">
                {/* Header Section */}
                <div className="bg-[#711a19] text-white p-8 text-center relative overflow-hidden">
                    <div className="relative z-10">
                        <h1 className="text-4xl font-bold tracking-wider mb-2">วิธีการเล่น (How to Play)</h1>
                        <p className="text-red-200 text-lg">คู่มือพื้นฐานสำหรับการผจญภัยใน Dungeons & Dragons 5e</p>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-8 space-y-12 text-gray-800">
                    
                    {/* 1. Rhythm of Play */}
                    <section>
                        <h2 className="text-2xl font-bold text-[#711a19] border-b-2 border-red-100 pb-2 mb-4 flex items-center">
                            <i className="fa-solid fa-users mr-3"></i> 1. จังหวะของการเล่น (Rhythm of Play)
                        </h2>
                        <p className="mb-4 leading-relaxed">
                            เกม D&D ขับเคลื่อนด้วยจินตนาการและการเล่าเรื่อง โดยมีรูปแบบการเล่นพื้นฐาน 3 ขั้นตอนที่วนลูปไปเรื่อยๆ:
                        </p>
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 space-y-4">
                            <div className="flex">
                                <div className="flex-shrink-0 w-8 h-8 bg-[#711a19] text-white rounded-full flex items-center justify-center font-bold mr-4">1</div>
                                <div>
                                    <h3 className="font-bold text-lg">DM บรรยายฉาก (The DM Describes the Scene)</h3>
                                    <p className="text-gray-600">Dungeon Master (DM) จะบอกว่าตัวละครของคุณอยู่ที่ไหน สภาพแวดล้อมเป็นอย่างไร และมีอะไรอยู่ตรงหน้าบ้าง</p>
                                </div>
                            </div>
                            <div className="flex">
                                <div className="flex-shrink-0 w-8 h-8 bg-[#711a19] text-white rounded-full flex items-center justify-center font-bold mr-4">2</div>
                                <div>
                                    <h3 className="font-bold text-lg">ผู้เล่นตัดสินใจ (The Players Describe What They Do)</h3>
                                    <p className="text-gray-600">ผู้เล่นบอก DM ว่าตัวละครของตนจะทำอะไร เช่น "ฉันจะเดินไปเปิดหีบสมบัติ" หรือ "ฉันจะชักดาบออกมาขู่กอบลิน"</p>
                                </div>
                            </div>
                            <div className="flex">
                                <div className="flex-shrink-0 w-8 h-8 bg-[#711a19] text-white rounded-full flex items-center justify-center font-bold mr-4">3</div>
                                <div>
                                    <h3 className="font-bold text-lg">DM สรุปผลลัพธ์ (The DM Narrates the Results)</h3>
                                    <p className="text-gray-600">หากสิ่งที่ทำมีความเสี่ยงหรือโอกาสล้มเหลว DM จะให้ทอยลูกเต๋าเพื่อตัดสินผลลัพธ์ และเล่าเรื่องราวที่เกิดขึ้นต่อไป</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 2. The D20 Test */}
                    <section>
                        <h2 className="text-2xl font-bold text-[#711a19] border-b-2 border-red-100 pb-2 mb-4 flex items-center">
                            <i className="fa-solid fa-dice-d20 mr-3"></i> 2. การทอยลูกเต๋า 20 หน้า (The D20 Tests)
                        </h2>
                        <p className="mb-4 leading-relaxed">
                            เมื่อผลลัพธ์ของการกระทำไม่แน่นอน เราจะใช้ลูกเต๋า 20 หน้า (d20) ในการตัดสินใจเสมอ เรียกว่า D20 Tests ซึ่งแบ่งออกเป็น 3 ประเภทหลัก:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm hover:shadow-md transition">
                                <h3 className="font-bold text-[#711a19] text-lg mb-2 text-center">Ability Checks</h3>
                                <p className="text-sm text-gray-600">ใช้เมื่อคุณพยายามทำอะไรบางอย่างที่ต้องใช้ทักษะ เช่น ปีนหน้าผา (Athletics), โกหกยาม (Deception) หรือพังประตู</p>
                            </div>
                            <div className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm hover:shadow-md transition">
                                <h3 className="font-bold text-[#711a19] text-lg mb-2 text-center">Saving Throws</h3>
                                <p className="text-sm text-gray-600">ใช้เมื่อคุณพยายามเอาตัวรอดจากอันตราย เช่น หลบหินถล่ม (Dexterity Save) หรือต้านทานพิษ (Constitution Save)</p>
                            </div>
                            <div className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm hover:shadow-md transition">
                                <h3 className="font-bold text-[#711a19] text-lg mb-2 text-center">Attack Rolls</h3>
                                <p className="text-sm text-gray-600">ใช้เมื่อคุณโจมตีศัตรู หากทอยได้เท่ากับหรือมากกว่าเกราะ (Armor Class - AC) ของเป้าหมาย การโจมตีนั้นจะโดน</p>
                            </div>
                        </div>
                        <div className="mt-6 bg-red-50 p-4 rounded-md border-l-4 border-[#711a19]">
                            <p className="font-bold text-[#711a19]">สมการพื้นฐาน: <span className="font-normal text-gray-800">แต้มหน้าเต๋า d20 + ค่า Modifier ของ Ability + Proficiency Bonus (หากชำนาญ) ≥ ค่าความยาก (DC หรือ AC) = สำเร็จ!</span></p>
                        </div>
                    </section>

                    {/* 3. The Six Abilities */}
                    <section>
                        <h2 className="text-2xl font-bold text-[#711a19] border-b-2 border-red-100 pb-2 mb-4 flex items-center">
                            <i className="fa-solid fa-dumbbell mr-3"></i> 3. ค่าสถานะทั้ง 6 (The Six Abilities)
                        </h2>
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="min-w-full bg-white">
                                <thead>
                                    <tr className="bg-gray-100 text-gray-700 text-left">
                                        <th className="py-3 px-4 border-b">ค่าสถานะ (Ability)</th>
                                        <th className="py-3 px-4 border-b">ความหมายและการใช้งาน</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="py-3 px-4 border-b font-bold text-[#711a19]">Strength (STR)</td>
                                        <td className="py-3 px-4 border-b text-gray-600">พละกำลังทางกายภาพ - ใช้พังประตู, ยกของหนัก, โจมตีด้วยอาวุธระยะประชิด</td>
                                    </tr>
                                    <tr className="bg-gray-50">
                                        <td className="py-3 px-4 border-b font-bold text-[#711a19]">Dexterity (DEX)</td>
                                        <td className="py-3 px-4 border-b text-gray-600">ความคล่องแคล่วและการทรงตัว - ใช้หลบหลีก (AC), ย่องเบา (Stealth), โจมตีด้วยธนู</td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-4 border-b font-bold text-[#711a19]">Constitution (CON)</td>
                                        <td className="py-3 px-4 border-b text-gray-600">ความทนทานของร่างกาย - ใช้กำหนดค่าพลังชีวิต (HP) สูงสุด และทนทานต่อพิษ</td>
                                    </tr>
                                    <tr className="bg-gray-50">
                                        <td className="py-3 px-4 border-b font-bold text-[#711a19]">Intelligence (INT)</td>
                                        <td className="py-3 px-4 border-b text-gray-600">ความรู้ความจำและตรรกะ - ใช้สืบสวน (Investigation), นึกเรื่องราวทางประวัติศาสตร์หรือเวทมนตร์</td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-4 border-b font-bold text-[#711a19]">Wisdom (WIS)</td>
                                        <td className="py-3 px-4 border-b text-gray-600">สัญชาตญาณและการสังเกต - ใช้จับโกหก (Insight), มองหาของที่ซ่อนอยู่ (Perception)</td>
                                    </tr>
                                    <tr className="bg-gray-50">
                                        <td className="py-3 px-4 border-b font-bold text-[#711a19]">Charisma (CHA)</td>
                                        <td className="py-3 px-4 border-b text-gray-600">เสน่ห์และความมั่นใจ - ใช้เจรจาต่อรอง (Persuasion), ข่มขู่ (Intimidation), หลอกลวง (Deception)</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* 4. Advantage and Disadvantage */}
                    <section>
                        <h2 className="text-2xl font-bold text-[#711a19] border-b-2 border-red-100 pb-2 mb-4 flex items-center">
                            <i className="fa-solid fa-scale-balanced mr-3"></i> 4. ความได้เปรียบ (Advantage) & เสียเปรียบ (Disadvantage)
                        </h2>
                        <p className="mb-4 leading-relaxed">
                            บางครั้งสถานการณ์อาจเข้าข้างหรือเป็นใจให้คุณ (เช่น ลอบโจมตีศัตรูที่ไม่รู้ตัว) หรือบางครั้งอาจเสียเปรียบ (เช่น ยิงธนูท่ามกลางพายุ) DM สามารถให้สถานะนี้กับคุณได้:
                        </p>
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1 bg-green-50 border border-green-200 p-5 rounded-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><i className="fa-solid fa-arrow-trend-up text-5xl text-green-800"></i></div>
                                <h3 className="font-bold text-green-800 text-lg mb-2 relative z-10"><i className="fa-solid fa-arrow-up mr-2"></i>Advantage (ได้เปรียบ)</h3>
                                <p className="text-sm text-gray-700 relative z-10">ทอยลูกเต๋า d20 <strong>สองลูก</strong> และเลือกผลลัพธ์ที่ <strong>สูงกว่า</strong></p>
                            </div>
                            <div className="flex-1 bg-red-50 border border-red-200 p-5 rounded-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><i className="fa-solid fa-arrow-trend-down text-5xl text-red-800"></i></div>
                                <h3 className="font-bold text-red-800 text-lg mb-2 relative z-10"><i className="fa-solid fa-arrow-down mr-2"></i>Disadvantage (เสียเปรียบ)</h3>
                                <p className="text-sm text-gray-700 relative z-10">ทอยลูกเต๋า d20 <strong>สองลูก</strong> และบังคับเลือกผลลัพธ์ที่ <strong>ต่ำกว่า</strong></p>
                            </div>
                        </div>
                    </section>

                    {/* 5. Combat Basics */}
                    <section>
                        <h2 className="text-2xl font-bold text-[#711a19] border-b-2 border-red-100 pb-2 mb-4 flex items-center">
                            <i className="fa-solid fa-swords mr-3"></i> 5. ระบบการต่อสู้ (Combat Basics)
                        </h2>
                        <p className="mb-4 leading-relaxed">
                            ใน 1 เทิร์นของคุณ (ใช้เวลาในเกมประมาณ 6 วินาที) คุณสามารถทำสิ่งต่างๆ ได้ดังนี้:
                        </p>
                        <ul className="space-y-4 text-gray-700">
                            <li className="flex items-start bg-white p-4 rounded border border-gray-100 shadow-sm">
                                <div className="bg-[#711a19] text-white p-2 rounded mr-4 mt-1"><i className="fa-solid fa-person-running w-5 text-center"></i></div>
                                <div>
                                    <strong className="text-lg text-gray-900 block mb-1">Move (เดิน)</strong>
                                    <p className="text-sm">เดินตามระยะความเร็ว (Speed) ของคุณ เช่น 30 ฟุต สามารถแบ่งเดินก่อนและหลัง Action ได้</p>
                                </div>
                            </li>
                            <li className="flex items-start bg-white p-4 rounded border border-gray-100 shadow-sm">
                                <div className="bg-[#711a19] text-white p-2 rounded mr-4 mt-1"><i className="fa-solid fa-hand-fist w-5 text-center"></i></div>
                                <div>
                                    <strong className="text-lg text-gray-900 block mb-1">Action (กระทำหลัก)</strong>
                                    <p className="text-sm">โจมตี (Attack), ร่ายเวท (Cast a Spell), พุ่งตัว (Dash), ป้องกันตัว (Dodge) หรือซ่อนตัว (Hide)</p>
                                </div>
                            </li>
                            <li className="flex items-start bg-white p-4 rounded border border-gray-100 shadow-sm">
                                <div className="bg-gray-600 text-white p-2 rounded mr-4 mt-1"><i className="fa-solid fa-bolt w-5 text-center"></i></div>
                                <div>
                                    <strong className="text-lg text-gray-900 block mb-1">Bonus Action (กระทำเสริม)</strong>
                                    <p className="text-sm">ท่าพิเศษที่ทำได้รวดเร็ว (คุณจะใช้ได้ก็ต่อเมื่ออาชีพหรือเวทมนตร์ระบุว่าใช้เวลาเป็น Bonus Action เท่านั้น)</p>
                                </div>
                            </li>
                            <li className="flex items-start bg-white p-4 rounded border border-gray-100 shadow-sm">
                                <div className="bg-gray-600 text-white p-2 rounded mr-4 mt-1"><i className="fa-solid fa-reply w-5 text-center"></i></div>
                                <div>
                                    <strong className="text-lg text-gray-900 block mb-1">Reaction (โต้ตอบ)</strong>
                                    <p className="text-sm">การสวนกลับนอกเทิร์นของตัวเอง เช่น โจมตีศัตรูที่วิ่งหนีออกจากระยะประชิด (Opportunity Attack) หรือร่ายเวท Shield ใช้ได้ 1 ครั้งต่อรอบ</p>
                                </div>
                            </li>
                        </ul>
                    </section>

                    {/* 6. Combat Order & Initiative */}
                    <section>
                        <h2 className="text-2xl font-bold text-[#711a19] border-b-2 border-red-100 pb-2 mb-4 flex items-center">
                            <i className="fa-solid fa-list-ol mr-3"></i> 6. ลำดับการต่อสู้ (Initiative & Surprise)
                        </h2>
                        <p className="mb-4 leading-relaxed">
                            เมื่อการต่อสู้เริ่มต้นขึ้น ทุกคนต้องหาลำดับก่อนหลังด้วยการทอย <strong>Initiative (1d20 + DEX Modifier)</strong>:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-4">
                            <li>ผู้ที่ได้คะแนนสูงสุดจะได้เริ่มเทิร์นก่อน และไล่ลำดับลงมา หากคะแนนเท่ากัน ผู้เล่นสามารถตกลงกันเองได้</li>
                            <li><strong>Surprise (การถูกลอบโจมตี):</strong> หากคุณถูกลอบโจมตีโดยไม่ทันตั้งตัว คุณจะต้องทอย Initiative แบบ <em>Disadvantage (เสียเปรียบ)</em></li>
                        </ul>
                    </section>

                    {/* 7. Movement, Position & Cover */}
                    <section>
                        <h2 className="text-2xl font-bold text-[#711a19] border-b-2 border-red-100 pb-2 mb-4 flex items-center">
                            <i className="fa-solid fa-chess-board mr-3"></i> 7. พื้นที่, การเคลื่อนที่ และ ที่กำบัง (Cover)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <div className="bg-white p-5 rounded-lg border border-gray-200">
                                <h3 className="font-bold text-[#711a19] mb-2"><i className="fa-solid fa-mountain mr-2"></i>Difficult Terrain (พื้นที่เดินลำบาก)</h3>
                                <p className="text-sm text-gray-600">พื้นที่ขรุขระ, โคลน, หรือบันไดชัน การเดินในพื้นที่นี้ทุกๆ 5 ฟุต จะต้องจ่ายระยะการเดินเพิ่มอีก 5 ฟุต (เดินช้าลงครึ่งหนึ่ง)</p>
                            </div>
                            <div className="bg-white p-5 rounded-lg border border-gray-200">
                                <h3 className="font-bold text-[#711a19] mb-2"><i className="fa-solid fa-person-falling mr-2"></i>Prone (ล้มลุกคลุกคลาน)</h3>
                                <p className="text-sm text-gray-600">หากคุณล้มลง การโจมตีระยะประชิดที่พุ่งเป้ามาที่คุณจะได้ Advantage แต่คุณสามารถลุกขึ้นได้โดยใช้ระยะเดินครึ่งหนึ่งของคุณ</p>
                            </div>
                        </div>
                        <h3 className="font-bold text-gray-800 mt-6 mb-2">ที่กำบัง (Cover)</h3>
                        <p className="text-sm text-gray-700 mb-2">การหลบหลังกำแพงหรือสิ่งกีดขวางจะช่วยเพิ่มเกราะ (AC) ให้คุณ:</p>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li><strong className="text-gray-900">Half Cover (กำบังครึ่งตัว):</strong> เช่น หลบหลังโต๊ะ หรือเพื่อน +2 AC</li>
                            <li><strong className="text-gray-900">Three-Quarters Cover (กำบัง 3 ใน 4):</strong> เช่น หลบหลังต้นไม้ใหญ่ +5 AC</li>
                            <li><strong className="text-gray-900">Total Cover (กำบังมิดชิด):</strong> เช่น อยู่หลังกำแพงทึบ ศัตรูจะไม่สามารถเลือกคุณเป็นเป้าหมายได้โดยตรง</li>
                        </ul>
                    </section>

                    {/* 8. Advanced Attacks */}
                    <section>
                        <h2 className="text-2xl font-bold text-[#711a19] border-b-2 border-red-100 pb-2 mb-4 flex items-center">
                            <i className="fa-solid fa-bow-arrow mr-3"></i> 8. กฎการโจมตีเชิงลึก (Advanced Attacks)
                        </h2>
                        <ul className="space-y-4 text-gray-700">
                            <li className="bg-gray-50 p-4 rounded border-l-4 border-gray-300">
                                <strong>Ranged Attacks in Close Combat (การยิงระยะประชิด):</strong>
                                <p className="text-sm mt-1">หากคุณใช้ธนูหรือร่ายเวทระยะไกล ขณะที่มีศัตรูยืนประชิดตัวคุณในระยะ 5 ฟุต การโจมตีนั้นจะติด <em>Disadvantage</em> เสมอ เพราะศัตรูปัดป้องและรบกวนคุณ</p>
                            </li>
                            <li className="bg-gray-50 p-4 rounded border-l-4 border-gray-300">
                                <strong>Opportunity Attacks (โอกาสโจมตีสวนกลับ):</strong>
                                <p className="text-sm mt-1">หากศัตรูที่อยู่ในระยะประชิดของคุณ หันหลัง "วิ่งหนี" หรือเดินออกจากระยะโจมตีของคุณโดยไม่ป้องกันตัว คุณสามารถใช้ 1 <em>Reaction</em> ฟาดสวนไปได้ 1 ครั้ง (หลีกเลี่ยงได้โดยการใช้ Action: Disengage)</p>
                            </li>
                            <li className="bg-gray-50 p-4 rounded border-l-4 border-gray-300">
                                <strong>Critical Hits (คริติคอล):</strong>
                                <p className="text-sm mt-1">หากทอย d20 สำหรับโจมตีได้ "20" พอดี (Natural 20) การโจมตีจะโดนเสมอและรุนแรงมาก! ให้คุณทอยลูกเต๋าดาเมจ <strong>2 เท่า</strong></p>
                            </li>
                        </ul>
                    </section>

                    {/* 9. Damage & Death */}
                    <section>
                        <h2 className="text-2xl font-bold text-[#711a19] border-b-2 border-red-100 pb-2 mb-4 flex items-center">
                            <i className="fa-solid fa-skull mr-3"></i> 9. พลังชีวิต และ ความตาย (Damage & Death)
                        </h2>
                        <div className="space-y-4 text-gray-700">
                            <p><strong>Resistance & Vulnerability (ต้านทานและแพ้ทาง):</strong></p>
                            <ul className="list-disc list-inside ml-4 mb-4 text-sm">
                                <li><strong>Resistance:</strong> ดาเมจที่ได้รับจะลดลง <em>ครึ่งหนึ่ง</em></li>
                                <li><strong>Vulnerability:</strong> ดาเมจที่ได้รับจะเพิ่มเป็น <em>สองเท่า</em></li>
                            </ul>
                            
                            <div className="bg-[#711a19] text-white p-5 rounded-lg shadow-sm">
                                <h3 className="font-bold text-lg mb-2"><i className="fa-solid fa-heart-crack mr-2"></i>เมื่อ HP ลดเหลือ 0 (Death Saving Throws)</h3>
                                <p className="text-sm mb-3 text-red-100">ตัวละครของคุณจะล้มลงและหมดสติ (Unconscious) แต่ยังไม่ตายทันที! ในแต่ละเทิร์นของคุณ คุณต้องทอย <strong>Death Saving Throw (d20 เปล่าๆ ไม่บวกอะไรเลย)</strong></p>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="bg-white/10 p-3 rounded border border-white/20">
                                        <div className="font-bold text-green-300 mb-1">ทอยได้ 10 ถึง 20</div>
                                        <p>รอด (Success) หากสะสมครบ 3 ครั้ง คุณจะอาการทรงตัว (Stable) ไม่ต้องทอยอีก</p>
                                    </div>
                                    <div className="bg-white/10 p-3 rounded border border-white/20">
                                        <div className="font-bold text-red-300 mb-1">ทอยได้ 1 ถึง 9</div>
                                        <p>แย่ลง (Failure) หากสะสมครบ 3 ครั้ง ตัวละครของคุณจะตายทันที!</p>
                                    </div>
                                </div>
                                <p className="text-xs text-red-200 mt-3 italic">*หากทอยได้ 20 เป๊ะ (Nat 20) คุณจะฟื้นขึ้นมาพร้อม HP 1 แต้มทันที / หากทอยได้ 1 เป๊ะ จะนับเป็นการ Failure ถึง 2 ครั้งรวด!</p>
                            </div>
                        </div>
                    </section>

                    {/* 10. Resting */}
                    <section>
                        <h2 className="text-2xl font-bold text-[#711a19] border-b-2 border-red-100 pb-2 mb-4 flex items-center">
                            <i className="fa-solid fa-campground mr-3"></i> 10. การพักผ่อนฟื้นฟู (Resting)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-5 rounded-lg border border-gray-200">
                                <h3 className="font-bold text-[#711a19] mb-2"><i className="fa-regular fa-hourglass-half mr-2"></i>Short Rest (พักสั้น)</h3>
                                <p className="text-sm text-gray-600 mb-2">ใช้เวลาอย่างน้อย 1 ชั่วโมง นั่งพักผ่อน กินอาหาร หรือทำแผล</p>
                                <ul className="list-disc list-inside text-sm text-gray-700">
                                    <li>สามารถใช้ <strong>Hit Dice</strong> ตามเลเวลเพื่อฟื้นฟู HP ได้</li>
                                    <li>ฟื้นฟูความสามารถของบางอาชีพ (เช่น Action Surge ของ Fighter)</li>
                                </ul>
                            </div>
                            <div className="bg-white p-5 rounded-lg border border-gray-200">
                                <h3 className="font-bold text-[#711a19] mb-2"><i className="fa-solid fa-bed mr-2"></i>Long Rest (พักยาว)</h3>
                                <p className="text-sm text-gray-600 mb-2">ใช้เวลาอย่างน้อย 8 ชั่วโมง (ต้องนอนหลับอย่างน้อย 6 ชม.)</p>
                                <ul className="list-disc list-inside text-sm text-gray-700">
                                    <li>ฟื้นฟู <strong>HP และ Spell Slots</strong> กลับมาเต็มทั้งหมด</li>
                                    <li>ฟื้นฟู Hit Dice กลับมาครึ่งหนึ่งของจำนวนสูงสุด</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* 11. Spellcasting Rules */}
                    <section>
                        <h2 className="text-2xl font-bold text-[#711a19] border-b-2 border-red-100 pb-2 mb-4 flex items-center">
                            <i className="fa-solid fa-wand-magic-sparkles mr-3"></i> 11. ระบบเวทมนตร์ (Spellcasting Rules)
                        </h2>
                        <ul className="space-y-4 text-gray-700">
                            <li className="bg-gray-50 p-4 rounded border-l-4 border-gray-300">
                                <strong>Spell Slots (ช่องจำเวท):</strong>
                                <p className="text-sm mt-1">คาถาระดับ 1 ขี้นไปจะต้องใช้ Spell Slot ในการร่าย หากสล็อตหมดจะร่ายเวทระดับนั้นไม่ได้ (ยกเว้น Cantrips ที่ร่ายฟรีได้ตลอดเวลา)</p>
                            </li>
                            <li className="bg-gray-50 p-4 rounded border-l-4 border-gray-300">
                                <strong>Components (องค์ประกอบการร่ายเวท):</strong>
                                <div className="text-sm mt-1 flex gap-4">
                                    <span><strong>V (Verbal):</strong> ต้องเปล่งเสียง</span>
                                    <span><strong>S (Somatic):</strong> ต้องขยับมือ</span>
                                    <span><strong>M (Material):</strong> ต้องใช้วัตถุดิบสื่อกลาง</span>
                                </div>
                            </li>
                            <li className="bg-gray-50 p-4 rounded border-l-4 border-purple-400 relative overflow-hidden">
                                <strong>Concentration (สมาธิ):</strong>
                                <p className="text-sm mt-1">คาถาบางบทที่ส่งผลต่อเนื่อง (เช่น ทำให้ล่องหน) ต้องรักษาสมาธิไว้ หากคุณร่ายคาถาที่ต้องใช้สมาธิซ้อนกัน คาถาเก่าจะหายไปทันที <strong className="text-purple-800">และหากคุณได้รับบาดเจ็บขณะทำสมาธิ ต้องทอย Constitution Saving Throw (DC 10 หรือครึ่งนึงของดาเมจที่โดน) เพื่อรักษาเวทไว้</strong></p>
                            </li>
                        </ul>
                    </section>

                    {/* 12. Conditions */}
                    <section>
                        <h2 className="text-2xl font-bold text-[#711a19] border-b-2 border-red-100 pb-2 mb-4 flex items-center">
                            <i className="fa-solid fa-biohazard mr-3"></i> 12. สถานะผิดปกติ (Conditions)
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded border border-gray-200">
                                <h4 className="font-bold text-gray-900"><i className="fa-solid fa-eye-slash text-gray-500 mr-2"></i>Blinded (ตาบอด)</h4>
                                <p className="text-xs text-gray-600">โจมตีติด Disadvantage และโดนโจมตีติด Advantage เสมอ</p>
                            </div>
                            <div className="bg-white p-4 rounded border border-gray-200">
                                <h4 className="font-bold text-pink-600"><i className="fa-solid fa-heart text-pink-400 mr-2"></i>Charmed (หลงเสน่ห์)</h4>
                                <p className="text-xs text-gray-600">ไม่สามารถโจมตีคนที่สะกดจิตตัวเองได้</p>
                            </div>
                            <div className="bg-white p-4 rounded border border-gray-200">
                                <h4 className="font-bold text-purple-700"><i className="fa-solid fa-ghost text-purple-400 mr-2"></i>Frightened (หวาดกลัว)</h4>
                                <p className="text-xs text-gray-600">เดินเข้าหาต้นตอความกลัวไม่ได้ ทำอะไรก็ติด Disadvantage</p>
                            </div>
                            <div className="bg-white p-4 rounded border border-gray-200">
                                <h4 className="font-bold text-orange-600"><i className="fa-solid fa-hand-holding text-orange-400 mr-2"></i>Grappled (ถูกล็อกตัว)</h4>
                                <p className="text-xs text-gray-600">ความเร็วในการเดิน (Speed) กลายเป็น 0 ทันที</p>
                            </div>
                            <div className="bg-white p-4 rounded border border-gray-200">
                                <h4 className="font-bold text-green-700"><i className="fa-solid fa-skull-crossbones text-green-500 mr-2"></i>Poisoned (ติดพิษ)</h4>
                                <p className="text-xs text-gray-600">ทอยโจมตีและ Ability Checks ติด Disadvantage</p>
                            </div>
                            <div className="bg-white p-4 rounded border border-gray-200">
                                <h4 className="font-bold text-blue-700"><i className="fa-solid fa-bolt text-blue-500 mr-2"></i>Paralyzed (อัมพาต)</h4>
                                <p className="text-xs text-gray-600">ขยับไม่ได้ โดนตีติด Advantage และหากโดนตีระยะประชิดจะนับเป็น Critical Hit ทันที!</p>
                            </div>
                        </div>
                    </section>

                    {/* 13. Additional Actions */}
                    <section>
                        <h2 className="text-2xl font-bold text-[#711a19] border-b-2 border-red-100 pb-2 mb-4 flex items-center">
                            <i className="fa-solid fa-running mr-3"></i> 13. ตัวเลือก Action พิเศษนอกจากการโจมตี
                        </h2>
                        <ul className="space-y-3 text-gray-700">
                            <li><strong>Dodge (หลบหลีก):</strong> โฟกัสไปที่การหลบ ใครที่โจมตีคุณในเทิร์นนี้จะติด Disadvantage ทั้งหมด</li>
                            <li><strong>Help (ช่วยเหลือ):</strong> เข้าไปช่วยเพื่อน ทำให้เพื่อนทอยเต๋าได้ Advantage ในตาหน้า</li>
                            <li><strong>Ready (เตรียมพร้อม):</strong> ไม่ออกแอคชั่นตอนนี้ แต่ตั้งเงื่อนไขไว้ เช่น "ถ้ายามเดินมาถึงมุมตึก ฉันจะยิงธนู" (ใช้ Reaction เพื่อปล่อยของ)</li>
                            <li><strong>Dash (พุ่งตัว):</strong> เพิ่มระยะการเดินอีก 1 เท่าในเทิร์นนั้น (เช่น ปกติเดิน 30 กลายเป็นเดินได้ 60 ฟุต)</li>
                            <li><strong>Disengage (ผละออก):</strong> การเดินออกจากระยะประชิดอย่างระมัดระวัง ทำให้ศัตรูไม่สามารถตอกหน้าคุณด้วย Opportunity Attack ได้</li>
                        </ul>
                    </section>

                    {/* 14. Vision & Light */}
                    <section>
                        <h2 className="text-2xl font-bold text-[#711a19] border-b-2 border-red-100 pb-2 mb-4 flex items-center">
                            <i className="fa-solid fa-eye mr-3"></i> 14. การมองเห็นและแสงสว่าง (Vision & Light)
                        </h2>
                        <div className="bg-gray-800 text-gray-200 p-5 rounded-lg">
                            <ul className="space-y-3 text-sm">
                                <li><strong className="text-yellow-400">Bright Light (สว่างจ้า):</strong> มองเห็นได้ปกติ (เช่น กลางวัน, คบเพลิง)</li>
                                <li><strong className="text-gray-400">Dim Light (สลัว):</strong> แสงน้อย การหาของหรือสังเกต (Perception) ที่ใช้สายตา จะติด Disadvantage</li>
                                <li><strong className="text-gray-600">Darkness (มืดสนิท):</strong> คนปกติจะมองไม่เห็นอะไรเลย (เสมือนตาบอด) ยกเว้นเผ่าที่มี <strong>Darkvision</strong> จะมองเห็นได้เหมือนเป็นที่สลัว ในระยะ 60 ฟุต</li>
                            </ul>
                        </div>
                    </section>

                    {/* 15. Travel & Hazards */}
                    <section>
                        <h2 className="text-2xl font-bold text-[#711a19] border-b-2 border-red-100 pb-2 mb-4 flex items-center">
                            <i className="fa-solid fa-map mr-3"></i> 15. การเดินทางและอันตราย (Travel & Hazards)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-5 rounded-lg border border-gray-200">
                                <h3 className="font-bold text-[#711a19] mb-2">ความเร็วในการเดินทาง (Travel Pace)</h3>
                                <ul className="list-disc list-inside text-sm text-gray-600">
                                    <li><strong>เดินเร็ว (Fast):</strong> เดินทางได้ไกล แต่หาของรอบตัวไม่เจอ และลอบเร้นไม่ได้ (ติด Disadvantage)</li>
                                    <li><strong>เดินปกติ (Normal):</strong> ลอบเร้นไม่ได้ แต่สังเกตสิ่งรอบตัวได้ปกติ</li>
                                    <li><strong>เดินช้า (Slow):</strong> สามารถลอบเร้น (Stealth) ได้ตลอดการเดินทาง</li>
                                </ul>
                            </div>
                            <div className="bg-white p-5 rounded-lg border border-gray-200">
                                <h3 className="font-bold text-[#711a19] mb-2">อันตรายจากสิ่งแวดล้อม</h3>
                                <ul className="list-disc list-inside text-sm text-gray-600">
                                    <li><strong>ตกจากที่สูง (Falling):</strong> รับดาเมจ 1d6 ต่อระยะทางที่ตก 10 ฟุต (สูงสุด 20d6) และล้มลง (Prone)</li>
                                    <li><strong>จมน้ำ (Suffocation):</strong> กลั้นหายใจได้เท่ากับ 1 + CON Modifier นาที หากเกินนั้นจะเริ่มขาดอากาศ และ HP จะลดเหลือ 0</li>
                                </ul>
                            </div>
                        </div>
                    </section>
                </div>

            </div>
        </div>
    );
}

export default HowToPlay;
