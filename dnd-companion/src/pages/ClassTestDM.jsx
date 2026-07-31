import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './ClassTestDM.css';

function ClassTestDM() {
    var navigate = useNavigate();
    var [chatHistory, setChatHistory] = useState([]);
    var [apiHistory, setApiHistory] = useState([]);
    var [currentTurn, setCurrentTurn] = useState(1);
    var [options, setOptions] = useState([]);
    var [isLoading, setIsLoading] = useState(false);
    var [customAction, setCustomAction] = useState("");
    var [isFinal, setIsFinal] = useState(false);
    var [finalData, setFinalData] = useState(null);
    var chatEndRef = useRef(null);
    var hasFetched = useRef(false);

    useEffect(function() {
        if (!hasFetched.current) {
            hasFetched.current = true;
            fetchNextScene(null);
        }
    }, []);

    useEffect(function() {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatHistory, isLoading]);

    function fetchNextScene(actionText, overrideTurn) {
        setIsLoading(true);
        setOptions([]);

        var targetTurn = (overrideTurn !== undefined && overrideTurn !== null) ? overrideTurn : currentTurn;

        fetch('http://localhost:5000/api/dm/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chatHistory: apiHistory,
                currentTurn: targetTurn,
                actionText: actionText
            })
        })
        .then(function(response) {
            if (!response.ok) {
                return response.json().then(function(errData) {
                    throw new Error(errData.details || "API Error");
                });
            }
            return response.json();
        })
        .then(function(data) {
            var userMsg;
            if (targetTurn === 1 && !actionText) {
                userMsg = "BEGIN THE ADVENTURE";
            } else {
                userMsg = actionText || "";
            }

            var newApiHistory = apiHistory.slice();
            newApiHistory.push({ role: 'user', parts: [{ text: userMsg }] });
            newApiHistory.push({ role: 'model', parts: [{ text: JSON.stringify(data) }] });
            setApiHistory(newApiHistory);

            var cleanNarrative = String(data.narrative || '').normalize('NFC');
            var cleanChoices = (data.choices || []).map(function(c) {
                return String(c || '').normalize('NFC');
            });

            setChatHistory(function(prev) {
                return prev.concat([{
                    sender: 'dm',
                    text: cleanNarrative,
                    sceneNumber: data.questionNumber
                }]);
            });

            if (data.isFinished) {
                setIsFinal(true);
                setFinalData(data);
                setOptions([]);
            } else {
                setOptions(cleanChoices);
                setCurrentTurn(data.questionNumber + 1);
            }
        })
        .catch(function(error) {
            console.error("Error fetching scene:", error);
            setChatHistory(function(prev) {
                return prev.concat([{
                    sender: 'error',
                    text: "เกิดข้อผิดพลาด: " + error.message
                }]);
            });
        })
        .finally(function() {
            setIsLoading(false);
        });
    }

    function handleOptionSelect(optionText) {
        setChatHistory(function(prev) {
            return prev.concat([{ sender: 'user', text: optionText }]);
        });
        fetchNextScene(optionText);
    }

    function handleCustomSubmit(e) {
        e.preventDefault();
        if (!customAction.trim()) return;
        handleOptionSelect(customAction);
        setCustomAction("");
    }

    function handleRegenerateScene() {
        var prevTurn = currentTurn > 1 ? currentTurn - 1 : 1;
        setCurrentTurn(prevTurn);

        setChatHistory(function(prev) {
            var newArr = prev.slice();
            while (newArr.length > 0 && (newArr[newArr.length - 1].sender === 'dm' || newArr[newArr.length - 1].sender === 'error')) {
                newArr.pop();
                break;
            }
            return newArr;
        });

        setApiHistory(function(prev) {
            if (prev.length >= 2) {
                return prev.slice(0, -2);
            }
            return [];
        });

        setTimeout(function() {
            if (prevTurn === 1) {
                fetchNextScene(null, 1);
            } else {
                var lastUserAction = "";
                for (var i = chatHistory.length - 1; i >= 0; i--) {
                    if (chatHistory[i].sender === 'user') {
                        lastUserAction = chatHistory[i].text;
                        break;
                    }
                }
                fetchNextScene(lastUserAction || "ดำเนินเรื่องต่อ", prevTurn);
            }
        }, 50);
    }

    function handleRestart() {
        setChatHistory([]);
        setApiHistory([]);
        setCurrentTurn(1);
        setOptions([]);
        setIsLoading(false);
        setIsFinal(false);
        setFinalData(null);
        hasFetched.current = false;
        setTimeout(function() {
            hasFetched.current = true;
            fetchNextScene(null);
        }, 100);
    }

    function goToResultPage() {
        if (!finalData) return;
        navigate('/class-test-result', {
            state: {
                topClasses: finalData.topClasses || [],
                allClassScores: finalData.allClassScores || null,
                alignment: finalData.alignment || null,
                analysis: finalData.detailedAnalysis || "",
                narrative: finalData.narrative || "",
                questionBreakdown: finalData.questionBreakdown || null,
                chatHistory: chatHistory
            }
        });
    }

    var storedUserRaw = localStorage.getItem('dnd_user');
    var currentUser = null;
    if (storedUserRaw) {
        try { currentUser = JSON.parse(storedUserRaw); } catch(e) {}
    }
    var userName = (currentUser && (currentUser.user_name || currentUser.username)) ? (currentUser.user_name || currentUser.username).toUpperCase() : 'PLAYER ACTION';
    var userAvatarUrl = (currentUser && (currentUser.avatar_url || currentUser.user_avatar || currentUser.avatar)) || null;

    var displayTurn = currentTurn > 1 ? currentTurn - 1 : 1;
    if (displayTurn > 10) displayTurn = 10;

    return React.createElement('div', { className: 'dm-test-page animate-fade-in' },
        // Header Bar
        React.createElement('div', { className: 'dm-header-bar' },
            React.createElement('div', { className: 'dm-header-left' },
                React.createElement('i', { className: 'fa-solid fa-dragon dm-header-icon' }),
                React.createElement('div', null,
                    React.createElement('h2', { className: 'dm-title' }, 'THE GRAND WEAVER'),
                    React.createElement('span', { className: 'dm-subtitle' }, currentUser ? ('การผจญภัยของ ' + (currentUser.user_name || currentUser.username)) : 'AI Dungeon Master Interactive Class Quiz')
                )
            ),
            React.createElement('div', { className: 'dm-header-right' },
                React.createElement('span', { className: 'dm-scene-badge' }, 
                    React.createElement('i', { className: 'fa-solid fa-layer-group' }),
                    ' ฉากที่ ' + displayTurn + ' / 10'
                ),
                React.createElement('button', { className: 'dm-exit-btn', onClick: function() { navigate('/class-test'); }, title: 'กลับหน้าเลือกโหมด' },
                    React.createElement('i', { className: 'fa-solid fa-xmark' })
                )
            )
        ),

        // Progress Bar
        React.createElement('div', { className: 'dm-progress-track' },
            React.createElement('div', {
                className: 'dm-progress-fill',
                style: { width: (displayTurn * 10) + '%' }
            })
        ),

        // Main Chat Stream & Controls Container
        React.createElement('div', { className: 'dm-chat-container' },
            // Message List
            React.createElement('div', { className: 'dm-chat-stream' },
                chatHistory.map(function(msg, idx) {
                    return React.createElement('div', { key: idx, className: 'chat-row ' + msg.sender },
                        React.createElement('div', { className: 'chat-avatar' },
                            msg.sender === 'dm' && React.createElement('i', { className: 'fa-solid fa-dragon' }),
                            msg.sender === 'user' && (
                                userAvatarUrl 
                                    ? React.createElement('img', { src: userAvatarUrl, alt: 'User Avatar', className: 'user-avatar-img' })
                                    : React.createElement('i', { className: 'fa-solid fa-user' })
                            ),
                            msg.sender === 'error' && React.createElement('i', { className: 'fa-solid fa-triangle-exclamation' })
                        ),
                        React.createElement('div', { className: 'chat-bubble-wrapper' },
                            React.createElement('div', { className: 'chat-meta' },
                                msg.sender === 'dm' && React.createElement('span', { className: 'author-name' }, 'DUNGEON MASTER'),
                                msg.sender === 'user' && React.createElement('span', { className: 'author-name' }, userName),
                                msg.sender === 'error' && React.createElement('span', { className: 'author-name' }, 'SYSTEM ERROR'),
                                msg.sceneNumber && React.createElement('span', { className: 'scene-tag' }, 'ฉากที่ ' + msg.sceneNumber)
                            ),
                            React.createElement('div', { className: 'chat-body' },
                                React.createElement('p', null, msg.text)
                            )
                        )
                    );
                }),

                // Loading State Indicator
                isLoading && React.createElement('div', { className: 'chat-row dm loading-row' },
                    React.createElement('div', { className: 'chat-avatar' },
                        React.createElement('i', { className: 'fa-solid fa-dragon' })
                    ),
                    React.createElement('div', { className: 'chat-bubble-wrapper' },
                        React.createElement('div', { className: 'chat-meta' },
                            React.createElement('span', { className: 'author-name' }, 'DUNGEON MASTER')
                        ),
                        React.createElement('div', { className: 'chat-body loading-body' },
                            React.createElement('div', { className: 'typing-dots' },
                                React.createElement('span', null),
                                React.createElement('span', null),
                                React.createElement('span', null)
                            ),
                            React.createElement('p', { className: 'loading-text' }, 'The Grand Weaver กำลังถักทอเรื่องราว...')
                        )
                    )
                ),
                React.createElement('div', { ref: chatEndRef })
            ),

            // Controls: Option Grid + Custom Input
            !isFinal && !isLoading && options.length > 0 && React.createElement('div', { className: 'dm-interaction-panel animate-slide-up' },
                // Options Top Action Header
                React.createElement('div', { className: 'panel-header' },
                    React.createElement('span', { className: 'panel-title' },
                        React.createElement('i', { className: 'fa-solid fa-wand-magic-sparkles' }),
                        ' เลือกการกระทำของคุณ (4 ทางเลือก)'
                    ),
                    React.createElement('button', { className: 'dm-regen-btn', onClick: handleRegenerateScene, title: 'สุ่มโจทย์ใหม่สำหรับฉากนี้' },
                        React.createElement('i', { className: 'fa-solid fa-rotate-right' }),
                        ' สุ่มโจทย์ใหม่'
                    )
                ),

                // 2x2 Choice Cards
                React.createElement('div', { className: 'choices-grid' },
                    options.map(function(opt, idx) {
                        return React.createElement('button', {
                            key: idx,
                            className: 'choice-card',
                            onClick: function() { handleOptionSelect(opt); }
                        },
                            React.createElement('span', { className: 'choice-number' }, (idx + 1)),
                            React.createElement('span', { className: 'choice-text' }, opt)
                        );
                    })
                ),

                // Custom Input Box
                React.createElement('div', { className: 'custom-input-box' },
                    React.createElement('form', { onSubmit: handleCustomSubmit },
                        React.createElement('div', { className: 'input-wrapper' },
                            React.createElement('i', { className: 'fa-solid fa-pen-nib input-icon' }),
                            React.createElement('input', {
                                type: 'text',
                                placeholder: 'หรือพิมพ์การกระทำอิสระของคุณเอง...',
                                value: customAction,
                                onChange: function(e) { setCustomAction(e.target.value); }
                            })
                        ),
                        React.createElement('button', { type: 'submit', className: 'send-action-btn' },
                            React.createElement('i', { className: 'fa-solid fa-paper-plane' }),
                            ' ส่ง'
                        )
                    )
                )
            ),

            // Error Retry View
            !isFinal && !isLoading && options.length === 0 && chatHistory.length > 0 && chatHistory[chatHistory.length - 1].sender === 'error' && React.createElement('div', { className: 'dm-interaction-panel' },
                React.createElement('button', { className: 'dm-retry-btn', onClick: handleRegenerateScene },
                    React.createElement('i', { className: 'fa-solid fa-rotate-right' }),
                    ' เกิดข้อผิดพลาด - กดเพื่อลองใหม่อีกครั้ง'
                )
            ),

            // Final State (Scene 10 Completed -> Lead to Result Page)
            isFinal && finalData && React.createElement('div', { className: 'dm-final-banner animate-fade-in' },
                React.createElement('div', { className: 'final-banner-content' },
                    React.createElement('i', { className: 'fa-solid fa-scroll final-icon' }),
                    React.createElement('h3', { className: 'final-title' }, 'การผจญภัย 10 ฉาก สิ้นสุดลงแล้ว'),
                    React.createElement('p', { className: 'final-desc' }, 'The Grand Weaver ได้วิเคราะห์จิตวิทยาและถักทอโชคชะตาของคุณเสร็จสมบูรณ์ พร้อมเปิดเผยอาชีพ D&D ที่เหมาะสมที่สุดของคุณ'),
                    React.createElement('div', { className: 'final-btn-group' },
                        React.createElement('button', { className: 'cta-result-btn', onClick: goToResultPage },
                            React.createElement('i', { className: 'fa-solid fa-trophy' }),
                            ' ดูผลลัพธ์อาชีพของคุณ (YOUR DESTINY)'
                        ),
                        React.createElement('button', { className: 'cta-restart-btn', onClick: handleRestart },
                            React.createElement('i', { className: 'fa-solid fa-rotate-right' }),
                            ' เริ่มเล่นใหม่'
                        )
                    )
                )
            )
        )
    );
}

export default ClassTestDM;
