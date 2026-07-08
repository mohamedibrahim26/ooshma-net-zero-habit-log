import React, { useState, useRef, useEffect } from 'react';
import api from '../api/axios';
import './ChatAssistant.css';

const QUICK_QUESTIONS = [
  'How do I reduce my carbon footprint?',
  'How much CO₂ does a flight produce?',
  'What is carbon offsetting?',
  'Is beef bad for the environment?',
  'How much CO₂ does driving 100km emit?',
  'What are the best eco habits?',
  'How many trees offset 1 tonne of CO₂?',
  'Compare electric car vs petrol car',
];

function Message({ msg }) {
  const isBot = msg.role === 'bot';
  const text = msg.text;

  // Simple markdown-like rendering
  const rendered = text
    .split('\n')
    .map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i}><strong>{line.slice(2, -2)}</strong></p>;
      }
      const boldParts = line.split(/\*\*(.*?)\*\*/g);
      const jsx = boldParts.map((part, j) =>
        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
      );
      return <p key={i}>{jsx}</p>;
    });

  return (
    <div className={`msg ${isBot ? 'bot' : 'user'}`}>
      {isBot && <div className="bot-avatar">🌿</div>}
      <div className="msg-bubble">
        {rendered}
        <span className="msg-time">{msg.time}</span>
      </div>
    </div>
  );
}

const FIRST_VISIT_KEY = 'ooshma_chat_visited';

export default function ChatAssistant() {
  const isFirstVisit = !localStorage.getItem(FIRST_VISIT_KEY);

  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: "Hey! 👋 I'm Ooshma AI, your personal net-zero habit assistant.\n\nAsk me anything about carbon emissions, how to reduce your footprint, or what to do after a high-impact activity. You can also ask me to calculate CO₂ for a specific activity!\n\nTry one of the quick questions below or type your own.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuick, setShowQuick] = useState(isFirstVisit);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isFirstVisit) {
      localStorage.setItem(FIRST_VISIT_KEY, '1');
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { role: 'user', text: msg, time }]);
    setLoading(true);

    try {
      const { data } = await api.post('/chat/', { message: msg });
      setMessages(prev => [...prev, {
        role: 'bot',
        text: data.message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: "Sorry, I couldn't process that. Please try again!",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <div className="chat-title-row">
          <div className="chat-avatar-big">🌿</div>
          <div>
            <h1 className="page-title">Ooshma AI Assistant</h1>
            <p className="page-sub">Ask me anything about your carbon footprint</p>
          </div>
        </div>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((msg, i) => <Message key={i} msg={msg} />)}
          {loading && (
            <div className="msg bot">
              <div className="bot-avatar">🌿</div>
              <div className="msg-bubble typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick questions */}
        <div className="quick-questions-wrapper">
          <button
            className="quick-toggle"
            onClick={() => setShowQuick(v => !v)}
            title={showQuick ? 'Hide suggestions' : 'Show suggestions'}
          >
            💡 Suggestions {showQuick ? '▲' : '▼'}
          </button>
          {showQuick && (
            <div className="quick-questions">
              {QUICK_QUESTIONS.map((q, i) => (
                <button key={i} className="quick-q" onClick={() => { sendMessage(q); setShowQuick(false); }} disabled={loading}>
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="chat-input-row">
          <input
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask Ooshma AI anything… (e.g. 'How much CO₂ does 200km car trip emit?')"
            disabled={loading}
          />
          <button
            className="send-btn"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
