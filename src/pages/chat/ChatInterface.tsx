import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Search, MoreVertical, ArrowLeft } from 'lucide-react';
import { chatApi } from '../../services/api';
import { useApiData } from '../../hooks/useApiData';
import { useApp } from '../../context/AppContext';
import { Link, useLocation } from 'react-router-dom';
import type { Message } from '../../types';

export default function ChatInterface() {
  const { currentUser } = useApp();
  const location = useLocation();
  const { data: mockConversations, loading: convLoading } = useApiData(() => chatApi.conversations(), [] as any[]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mockConversations.length === 0) return;
    const requestedId = (location.state as { conversationId?: string } | null)?.conversationId;
    const requested = requestedId && mockConversations.find((conversation: any) => conversation.id === requestedId);
    setSelectedConv((current: any) => requested || current || mockConversations[0]);
  }, [mockConversations, location.state]);

  // Messages are fetched on open and then re-polled every 5 s. This is plain HTTP polling,
  // not a WebSocket — a new message can take up to ~5 s to appear.
  useEffect(() => {
    if (!selectedConv) return;
    let active = true;
    const load = (initial: boolean) =>
      chatApi.messages(selectedConv.id)
        .then((m: any) => { if (active) setMessages(prev => (prev.length === m.length && prev[prev.length - 1]?.id === m[m.length - 1]?.id ? prev : m)); })
        .catch(() => { if (active && initial) setMessages([]); });
    load(true);
    const timer = window.setInterval(() => { if (!document.hidden) load(false); }, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [selectedConv?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectConversation = (conv: any) => {
    setSelectedConv(conv);
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentUser || !selectedConv) return;
    const content = input;
    setInput('');
    try {
      const sent = await chatApi.sendMessage(selectedConv.id, content);
      setMessages(prev => [...prev, sent]);
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <p className="text-[var(--color-text-muted)] mb-4">Sign in to access your messages.</p>
        <Link to="/login" className="bg-[#006A4E] text-white px-6 py-3 rounded-xl font-semibold">Sign In</Link>
      </div>
    );
  }

  if (convLoading || !selectedConv) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <p className="text-[var(--color-text-muted)]">{convLoading ? 'Loading conversations…' : 'No conversations yet.'}</p>
      </div>
    );
  }

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      {/* Conversation list */}
      <div className="w-80 shrink-0 bg-white border-r border-[var(--color-border)] flex flex-col">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h2 className="font-bold text-lg mb-3" style={{ fontFamily: 'Fraunces, serif' }}>Messages</h2>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-9 pr-4 py-2 bg-[var(--color-surface-2)] rounded-xl text-sm outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {mockConversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => selectConversation(conv)}
              className={`w-full flex items-center gap-3 p-4 border-b border-[var(--color-border-light)] text-left hover:bg-gray-50 transition-colors ${selectedConv.id === conv.id ? 'bg-[#006A4E]/5 border-l-4 border-l-[#006A4E]' : ''}`}
            >
              <div className="relative">
                <img src={conv.participantAvatars[1]} alt={conv.participantNames[1]} className="w-12 h-12 rounded-full object-cover" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="font-semibold text-sm truncate">{conv.participantNames[1]}</p>
                  <span className="text-xs text-[var(--color-text-muted)] shrink-0">
                    {formatTime(conv.lastMessageAt)}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] truncate">{conv.lastMessage}</p>
              </div>
              {conv.unreadCount > 0 && (
                <span className="w-5 h-5 bg-[#006A4E] text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                  {conv.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="bg-white border-b border-[var(--color-border)] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={selectedConv.participantAvatars[1]} alt="" className="w-10 h-10 rounded-full object-cover" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <p className="font-semibold text-sm">{selectedConv.participantNames[1]}</p>
              <p className="text-xs text-green-600">Online</p>
            </div>
          </div>
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map(msg => {
            const isMe = msg.senderId === currentUser.id || msg.senderId === 'tourist1';
            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isMe && (
                  <img src={msg.senderAvatar} alt={msg.senderName} className="w-8 h-8 rounded-full object-cover shrink-0" />
                )}
                <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-[#006A4E] text-white rounded-tr-sm'
                      : 'bg-white border border-[var(--color-border)] text-[var(--color-text)] rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)] mt-1">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
          {typing && (
            <div className="flex gap-3">
              <img src={selectedConv.participantAvatars[1]} alt="" className="w-8 h-8 rounded-full object-cover" />
              <div className="bg-white border border-[var(--color-border)] rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-[var(--color-border)] px-4 py-3 flex items-center gap-3">
          <button className="p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-gray-100 transition-colors">
            <Paperclip size={18} />
          </button>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 bg-[var(--color-surface-2)] rounded-xl text-sm outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="p-2.5 bg-[#006A4E] text-white rounded-xl hover:bg-[#004D38] transition-colors disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
