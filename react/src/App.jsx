import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Utilidades de persistência
const AREAS = {
  corrida: { name: 'Corrida', webhook: { url: '', route: 'corrida' } },
  caminhada: { name: 'Caminhada', webhook: { url: '', route: 'caminhada' } },
  triathlon: { name: 'Triathlon', webhook: { url: '', route: 'triathlon' } },
  trail: { name: 'Trail Running', webhook: { url: '', route: 'trail' } },
};

function getSelectedArea() {
  return sessionStorage.getItem('selectedArea') || 'corrida';
}
function setSelectedArea(area) {
  sessionStorage.setItem('selectedArea', area);
}
function getChats(area) {
  const allChats = JSON.parse(localStorage.getItem('chats') || '[]');
  return allChats.filter((c) => c.area === area);
}
function saveChats(area, chats) {
  const allChats = JSON.parse(localStorage.getItem('chats') || '[]');
  const filtered = allChats.filter((c) => c.area !== area);
  localStorage.setItem('chats', JSON.stringify([...filtered, ...chats]));
}
function getCurrentChatId() {
  return sessionStorage.getItem('chatId');
}
function setCurrentChatId(chatId) {
  sessionStorage.setItem('chatId', chatId);
}

function getChatHistory(area, chatId) {
  const chats = getChats(area);
  const chat = chats.find((c) => c.id === chatId);
  return chat ? chat.history || [] : [];
}
function saveChatHistory(area, chatId, history) {
  const chats = getChats(area);
  const idx = chats.findIndex((c) => c.id === chatId);
  if (idx !== -1) {
    chats[idx].history = history;
    saveChats(area, chats);
  }
}

function App() {
  // Estado global
  const [area, setArea] = useState(getSelectedArea());
  const [chats, setChats] = useState(() => getChats(getSelectedArea()));
  const [currentChatId, setCurrentChatIdState] = useState(() => getCurrentChatId() || (chats[0]?.id));
  const [history, setHistory] = useState(() => getChatHistory(area, getCurrentChatId() || (chats[0]?.id)));
  const [input, setInput] = useState('');
  const chatBodyRef = useRef(null);

  // Efeito: sincronizar área
  useEffect(() => {
    setSelectedArea(area);
    const areaChats = getChats(area);
    setChats(areaChats);
    if (!areaChats.length) {
      handleNewChat();
    } else {
      const id = getCurrentChatId() || areaChats[0].id;
      setCurrentChatIdState(id);
      setHistory(getChatHistory(area, id));
    }
    // eslint-disable-next-line
  }, [area]);

  // Efeito: sincronizar chatId
  useEffect(() => {
    if (currentChatId) {
      setCurrentChatId(currentChatId);
      setHistory(getChatHistory(area, currentChatId));
    }
  }, [currentChatId, area]);

  // Scroll automático
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [history]);

  // Nova conversa
  function handleNewChat() {
    const areaChats = getChats(area);
    const chatId = 'chat_' + Math.random().toString(36).substr(2, 9);
    const name = 'Chat ' + (areaChats.length + 1);
    const newChat = { id: chatId, name, history: [
      { from: 'bot', text: '<strong>Olá 👋, novo chat iniciado. Como posso ajudar?</strong>' }
    ], area };
    const updatedChats = [...areaChats, newChat];
    saveChats(area, updatedChats);
    setChats(updatedChats);
    setCurrentChatIdState(chatId);
    setHistory(newChat.history);
    saveChatHistory(area, chatId, newChat.history);
  }

  // Trocar de chat
  function handleSwitchChat(chatId) {
    setCurrentChatIdState(chatId);
  }

  // Enviar mensagem
  async function handleSendMessage(e) {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { from: 'user', text: input };
    const newHistory = [...history, userMsg];
    setHistory(newHistory);
    saveChatHistory(area, currentChatId, newHistory);
    setInput('');

    // Renomear chat se for a primeira mensagem do usuário
    const idx = chats.findIndex((c) => c.id === currentChatId);
    if (idx !== -1 && chats[idx].history.filter((m) => m.from === 'user').length === 0) {
      const newName = input.length > 30 ? input.slice(0, 30) + '...' : input;
      const updatedChats = chats.map((c, i) => i === idx ? { ...c, name: newName } : c);
      setChats(updatedChats);
      saveChats(area, updatedChats);
    }

    // Simulação de resposta do bot (substitua por fetch real)
    setTimeout(() => {
      const botMsg = { from: 'bot', text: '<strong>Resposta simulada do bot para:</strong> ' + input };
      const updatedHistory = [...newHistory, botMsg];
      setHistory(updatedHistory);
      saveChatHistory(area, currentChatId, updatedHistory);
    }, 800);
  }

  // Copiar mensagem
  function handleCopy(text, from) {
    let textToCopy = text;
    if (from !== 'bot') {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = text;
      textToCopy = tempDiv.textContent || tempDiv.innerText || '';
    }
    navigator.clipboard.writeText(textToCopy);
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Geist Sans, sans-serif' }}>
      {/* Sidebar */}
      <div className="sidebar">
        <h2>RunSheet</h2>
        <select
          value={area}
          onChange={e => setArea(e.target.value)}
          style={{ marginBottom: 10, borderRadius: 6, padding: 6 }}
        >
          {Object.entries(AREAS).map(([key, val]) => (
            <option key={key} value={key}>{val.name}</option>
          ))}
        </select>
        <a href="../index.html" className="btn btn-outline" style={{ marginBottom: 10, textAlign: 'center' }}>Voltar</a>
        <button onClick={handleNewChat}>+ Novo Chat</button>
        <div id="chat-list">
          {chats.map(chat => (
            <p
              key={chat.id}
              style={{
                cursor: 'pointer',
                fontWeight: chat.id === currentChatId ? 'bold' : 'normal',
                background: chat.id === currentChatId ? '#e0dbfa' : undefined,
                borderRadius: chat.id === currentChatId ? 6 : undefined,
                padding: chat.id === currentChatId ? '4px 8px' : undefined
              }}
              onClick={() => handleSwitchChat(chat.id)}
            >
              {chat.name}
            </p>
          ))}
        </div>
        <div className="account-status" id="account-status">
          <p className="free-account">Conta Gratuita</p>
          <a href="../checkout.html" className="btn btn-primary">Fazer Upgrade</a>
        </div>
      </div>

      {/* Chat */}
      <div className="chat-container">
        <div className="chat-header">Assistente de Planilhas de Corrida</div>
        <div className="chat-body" ref={chatBodyRef}>
          {history.map((msg, idx) => (
            <div
              key={idx}
              className={
                'chat-msg-wrapper ' + (msg.from === 'user' ? 'user' : 'bot')
              }
            >
              <p className={msg.from === 'user' ? 'user-message' : 'bot-message'}
                dangerouslySetInnerHTML={{ __html: msg.text }}
              />
              <button
                className="copy-btn"
                title="Copiar"
                aria-label="Copiar mensagem"
                onClick={() => handleCopy(msg.text, msg.from)}
              >
                📋
              </button>
            </div>
          ))}
        </div>
        <form className="chat-footer" onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder="Digite sua mensagem..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSendMessage(e); }}
          />
          <button type="submit">Enviar</button>
        </form>
      </div>
    </div>
  );
}

export default App;
