import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import './App.css';
import LandingPage from './components/LandingPage';

// Chat app migrado como componente separado
function ChatApp({ userTier = 'free', onBack }) {
  // Estados migrados do original
  const [area, setArea] = useState(getSelectedArea());
  const [chats, setChats] = useState(() => getChats(getSelectedArea()));
  const [currentChatId, setCurrentChatIdState] = useState(() => getCurrentChatId() || (chats[0]?.id));
  const [history, setHistory] = useState(() => getChatHistory(area, getCurrentChatId() || (chats[0]?.id)));
  const [input, setInput] = useState('');
  const chatBodyRef = useRef(null);

  // Webhooks baseados no tier do usuário
  const WEBHOOKS = {
    free: window.ENV?.WEBHOOK_CORRIDA_FREE || "https://webhook-free.example.com",
    premium: window.ENV?.WEBHOOK_CORRIDA_PREMIUM || ""
  };

  // Sobrescreve as AREAS com os webhooks corretos baseado no tier
  const AREAS = {
    corrida: { name: 'Corrida', webhook: { url: WEBHOOKS[userTier], route: 'corrida' } },
    caminhada: { name: 'Caminhada', webhook: { url: WEBHOOKS[userTier], route: 'caminhada' } },
    triathlon: { name: 'Triathlon', webhook: { url: WEBHOOKS[userTier], route: 'triathlon' } },
    trail: { name: 'Trail Running', webhook: { url: WEBHOOKS[userTier], route: 'trail' } },
  };

  // Utilidades de persistência
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

  // Resto da implementação do chat

  // Função de divisão de conteúdo planilha
  function splitPlanilhaContent(text) {
    const result = {
      before: '',
      planilha: '',
      after: ''
    };
    // Verificar se contém tabela markdown
    if (text.includes('| ---')) {
      const lines = text.split('\n');
      let inTable = false;
      let tableStartIndex = -1;
      let tableEndIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('|') && lines[i].includes('---') && !inTable) {
          inTable = true;
          tableStartIndex = i - 1;
          continue;
        }
        if (inTable && (!lines[i].startsWith('|') || lines[i].trim() === '')) {
          tableEndIndex = i - 1;
          break;
        }
      }
      if (inTable && tableEndIndex === -1) {
        tableEndIndex = lines.length - 1;
      }
      if (tableStartIndex > 0) {
        result.before = lines.slice(0, tableStartIndex).join('\n') + '\n';
      }
      if (tableStartIndex >= 0 && tableEndIndex >= 0) {
        result.planilha = lines.slice(tableStartIndex, tableEndIndex + 1).join('\n');
      }
      if (tableEndIndex < lines.length - 1) {
        result.after = '\n' + lines.slice(tableEndIndex + 1).join('\n');
      }
    } else if (text.includes('```excel') || text.includes('```csv')) {
      const codeBlockStart = Math.max(text.indexOf('```excel'), text.indexOf('```csv'));
      if (codeBlockStart >= 0) {
        const codeBlockEnd = text.indexOf('```', codeBlockStart + 4);
        if (codeBlockEnd >= 0) {
          result.before = text.substring(0, codeBlockStart);
          result.planilha = text.substring(codeBlockStart, codeBlockEnd + 3);
          result.after = text.substring(codeBlockEnd + 3);
        }
      }
    } else if (text.includes('<table')) {
      const tableStart = text.indexOf('<table');
      if (tableStart >= 0) {
        const tableEnd = text.indexOf('</table>', tableStart) + 8;
        if (tableEnd >= 8) {
          result.before = text.substring(0, tableStart);
          result.planilha = text.substring(tableStart, tableEnd);
          result.after = text.substring(tableEnd);
        }
      }
    }
    if (!result.planilha) {
      result.planilha = text;
    }
    return result;
  }

  // Efeitos
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

  useEffect(() => {
    if (currentChatId) {
      setCurrentChatId(currentChatId);
      setHistory(getChatHistory(area, currentChatId));
    }
  }, [currentChatId, area]);

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

    // Chamada ao webhook
    try {
      const webhook = AREAS[area].webhook;
      const res = await fetch(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: currentChatId,
          message: input,
          route: webhook.route
        })
      });
      const data = await res.json();
      let parsedOutput = data.output || 'Desculpe, não entendi.';

      // Lógica premium/planilha
      const isPremium = userTier === 'premium';
      const isSpreadsheet = parsedOutput && (
        parsedOutput.includes('```excel') ||
        parsedOutput.includes('```csv') ||
        parsedOutput.includes('| ---') ||
        parsedOutput.includes('<table')
      );

      if (isSpreadsheet && !isPremium) {
        const parts = splitPlanilhaContent(parsedOutput);
        parsedOutput =
          parts.before +
          '<div class="blurred">' + parts.planilha + '</div>' +
          parts.after +
          '<div style="margin-top: 15px; padding: 10px; background: #fff8e1; border-radius: 8px; color: #856404; border: 1px solid #ffeeba;">' +
          '<strong>💡 Conteúdo limitado:</strong> Faça upgrade para a versão premium para visualizar e baixar planilhas completas sem marca d\'água.' +
          '<br><button onclick="(function(){document.querySelector(\'.account-status .btn.btn-primary\').click();return false;})()" class="btn btn-primary" style="margin-top: 10px; display: inline-block; padding: 8px 16px; background: #FF9F1C; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Fazer Upgrade</button>' +
          '</div>';
      }

      // Suporte para markdown
      try {
        const { marked } = await import('marked');
        const botMsg = { from: 'bot', text: marked.parse(parsedOutput) };
        const updatedHistory = [...newHistory, botMsg];
        setHistory(updatedHistory);
        saveChatHistory(area, currentChatId, updatedHistory);
      } catch (e) {
        const botMsg = { from: 'bot', text: parsedOutput };
        const updatedHistory = [...newHistory, botMsg];
        setHistory(updatedHistory);
        saveChatHistory(area, currentChatId, updatedHistory);
      }
    } catch (err) {
      const botMsg = { from: 'bot', text: 'Erro ao conectar ao servidor.' };
      const updatedHistory = [...newHistory, botMsg];
      setHistory(updatedHistory);
      saveChatHistory(area, currentChatId, updatedHistory);
    }
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
        <button onClick={onBack} className="btn btn-outline" style={{ marginBottom: 10, textAlign: 'center' }}>Voltar</button>
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
          <p className={userTier === 'premium' ? 'premium-account' : 'free-account'}>
            {userTier === 'premium' ? 'Conta Premium' : 'Conta Gratuita'}
          </p>
          {userTier !== 'premium' && (
            <a href="#" onClick={() => {
              onBack();
              setTimeout(() => {
                document.querySelector('#pricing').scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }} className="btn btn-primary">Fazer Upgrade</a>
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="chat-container">
        <div className={`chat-header ${userTier === 'premium' ? 'premium-header' : ''}`}>
          Assistente de Planilhas de Corrida 
          {userTier === 'premium' && <span className="premium-badge">Premium</span>}
          {userTier === 'free' && <span className="free-badge">Versão Gratuita</span>}
        </div>
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

function App() {
  // Check if user has a saved session
  const savedTier = localStorage.getItem('userPremium') === 'true' ? 'premium' : 'free';
  const savedSessionActive = localStorage.getItem('sessionActive') === 'true';
  
  const [currentPage, setCurrentPage] = useState(savedSessionActive ? 'chat' : 'landing');
  const [userTier, setUserTier] = useState(savedTier);

  // Remover restrições de overflow
  useEffect(() => {
    document.body.style.overflow = 'visible';
    document.documentElement.style.overflow = 'visible';
  }, []);

  // Função para iniciar chat gratuito
  const startFreeChat = () => {
    setUserTier('free');
    setCurrentPage('chat');
    localStorage.setItem('userPremium', 'false');
    localStorage.setItem('sessionActive', 'true');
  };

  // Função para iniciar chat premium
  const startPremiumChat = () => {
    setUserTier('premium');
    setCurrentPage('chat');
    localStorage.setItem('userPremium', 'true');
    localStorage.setItem('sessionActive', 'true');
  };

  // Função para voltar à landing page
  const backToLanding = () => {
    setCurrentPage('landing');
    localStorage.setItem('sessionActive', 'false');
  };

  // Se estiver na landing page
  if (currentPage === 'landing') {
    return <LandingPage onStartFree={startFreeChat} onStartPremium={startPremiumChat} />;
  }

  // Se estiver no chat
  return <ChatApp userTier={userTier} onBack={backToLanding} />;
}

export default App;
