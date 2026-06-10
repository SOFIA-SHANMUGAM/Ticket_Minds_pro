import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { 
  LogOut, Plus, MessageSquare, Send, Globe, 
  Clock, CheckCircle, RefreshCw, X, AlertCircle
} from 'lucide-react';

const LANGUAGE_LABELS = {
  ta: "Tamil (தமிழ்)",
  hi: "Hindi (हिन्दी)",
  en: "English",
  es: "Spanish (Español)",
  fr: "French (Français)",
  de: "German (Deutsch)"
};

export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  
  // Chat input
  const [inputText, setInputText] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  
  // Loaders
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [refreshingChat, setRefreshingChat] = useState(false);
  const [error, setError] = useState('');

  const chatEndRef = useRef(null);
  const pollingRef = useRef(null);

  // Load tickets on mount
  const loadTickets = async (silent = false) => {
    if (!silent) setLoadingTickets(true);
    try {
      const data = await api.getMyTickets();
      // Sort: open first, then sorted by updated date descending
      const sorted = [...data].sort((a, b) => {
        if (a.status === b.status) {
          return new Date(b.updated_at) - new Date(a.updated_at);
        }
        return a.status === 'open' ? -1 : 1;
      });
      setTickets(sorted);
    } catch (err) {
      console.error(err);
      setError('Failed to load tickets.');
    } finally {
      if (!silent) setLoadingTickets(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  // Poll active ticket messages every 3 seconds
  useEffect(() => {
    if (!activeTicket) {
      setMessages([]);
      return;
    }

    const fetchMessages = async (silent = false) => {
      if (!silent) setRefreshingChat(true);
      try {
        const ticketDetail = await api.getTicket(activeTicket.id);
        setMessages(ticketDetail.messages);
        
        // Update active ticket data in state if status or metadata changed
        if (ticketDetail.status !== activeTicket.status || ticketDetail.priority !== activeTicket.priority) {
          setActiveTicket(ticketDetail);
          loadTickets(true);
        }
      } catch (err) {
        console.error('Polling error:', err);
      } finally {
        if (!silent) setRefreshingChat(false);
      }
    };

    fetchMessages();

    // Start polling
    pollingRef.current = setInterval(() => {
      fetchMessages(true);
    }, 3000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [activeTicket?.id]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicketTitle.trim() || !newTicketMessage.trim()) return;
    
    setCreatingTicket(true);
    setError('');
    try {
      const created = await api.createTicket(newTicketTitle, newTicketMessage);
      setTickets([created, ...tickets]);
      setActiveTicket(created);
      setNewTicketTitle('');
      setNewTicketMessage('');
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to create ticket.');
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeTicket || sendingMessage) return;

    setSendingMessage(true);
    const textToSend = inputText;
    setInputText('');
    try {
      const sentMsg = await api.sendMessage(activeTicket.id, textToSend);
      setMessages(prev => [...prev, sentMsg]);
      
      // Update updated_at locally in ticket list
      loadTickets(true);
    } catch (err) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="flex h-screen bg-discord-darkest text-discord-text overflow-hidden">
      {/* 1. LEFT SIDEBAR: TICKET LIST */}
      <div className="w-80 bg-discord-darker flex flex-col border-r border-black/40">
        {/* User Info Header */}
        <div className="p-4 bg-discord-darkest flex items-center justify-between border-b border-black/40">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 bg-discord-blurple rounded-full flex items-center justify-center font-bold text-white uppercase shadow">
              {user?.username.slice(0, 2)}
            </div>
            <div className="overflow-hidden">
              <div className="font-semibold text-white truncate text-sm">{user?.username}</div>
              <div className="text-[10px] text-discord-textMuted flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {LANGUAGE_LABELS[user?.preferred_language] || user?.preferred_language}
              </div>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-1.5 hover:bg-[#32353b] rounded text-discord-textMuted hover:text-discord-red transition"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Create Ticket Button */}
        <div className="p-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full py-2 bg-discord-blurple hover:bg-discord-blurple/95 text-white font-semibold rounded text-sm shadow flex items-center justify-center space-x-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Ticket</span>
          </button>
        </div>

        {/* Tickets Scroll Panel */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1.5 pb-4">
          <div className="px-2 pb-1 text-[11px] font-bold text-discord-textMuted uppercase tracking-wider">
            Your Support Tickets
          </div>

          {loadingTickets ? (
            <div className="flex flex-col items-center justify-center py-8 text-discord-textMuted space-y-2 text-xs">
              <svg className="animate-spin h-5 w-5 text-discord-blurple" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading tickets...</span>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8 text-discord-textMuted text-xs px-4">
              No tickets raised yet. Click above to create one.
            </div>
          ) : (
            tickets.map((t) => {
              const isActive = activeTicket?.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTicket(t)}
                  className={`w-full p-3 rounded text-left transition flex items-start space-x-2.5 ${
                    isActive 
                      ? 'bg-discord-dark text-white font-medium border-l-2 border-discord-blurple' 
                      : 'hover:bg-[#32353b]/40 text-discord-text'
                  }`}
                >
                  <MessageSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isActive ? 'text-discord-blurple' : 'text-discord-textMuted'}`} />
                  <div className="overflow-hidden flex-1">
                    <div className="text-xs font-bold text-discord-textMuted truncate uppercase">
                      {t.id}
                    </div>
                    <div className="text-sm font-semibold truncate text-white">
                      {t.title}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        t.status === 'open' 
                          ? 'bg-discord-green/10 text-discord-green' 
                          : 'bg-discord-textMuted/20 text-discord-textMuted'
                      }`}>
                        {t.status}
                      </span>
                      <span className="text-[10px] text-discord-textMuted flex items-center">
                        <Clock className="w-2.5 h-2.5 mr-1" />
                        {new Date(t.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. MAIN CONVERSATION AREA */}
      <div className="flex-1 bg-discord-dark flex flex-col overflow-hidden relative">
        {activeTicket ? (
          <>
            {/* Header: Ticket details */}
            <div className="h-16 px-6 bg-discord-dark border-b border-black/40 flex items-center justify-between z-10">
              <div className="overflow-hidden">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-white text-md uppercase">{activeTicket.id}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                    activeTicket.status === 'open' 
                      ? 'bg-discord-green/20 text-discord-green' 
                      : 'bg-discord-red/20 text-discord-red'
                  }`}>
                    {activeTicket.status}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                    activeTicket.priority === 'high' 
                      ? 'bg-discord-red/25 text-discord-red'
                      : activeTicket.priority === 'medium'
                      ? 'bg-discord-yellow/20 text-discord-yellow'
                      : 'bg-discord-green/20 text-discord-green'
                  }`}>
                    Priority: {activeTicket.priority}
                  </span>
                </div>
                <div className="text-discord-textMuted text-xs truncate mt-0.5">
                  {activeTicket.title}
                </div>
              </div>

              <div className="flex items-center space-x-2 text-discord-textMuted text-xs">
                {refreshingChat && (
                  <span className="flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-discord-blurple" />
                    Syncing...
                  </span>
                )}
                <span className="px-2 py-1 bg-discord-darkest border border-[#2f3136] rounded font-semibold">
                  Auto-translation Active
                </span>
              </div>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => {
                const isMe = msg.sender_role === 'client';
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[70%] flex space-x-3">
                      {!isMe && (
                        <div className="w-8 h-8 bg-discord-darkest rounded-full flex-shrink-0 flex items-center justify-center font-bold text-discord-yellow border border-discord-yellow/30 text-xs shadow-md">
                          EN
                        </div>
                      )}
                      <div>
                        {/* Bubble content */}
                        <div className={`p-3 rounded-lg shadow-md ${
                          isMe 
                            ? 'bg-discord-blurple text-white rounded-tr-none' 
                            : 'bg-discord-darker text-discord-text rounded-tl-none border border-black/20'
                        }`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {isMe ? msg.original_text : msg.translated_text}
                          </p>
                        </div>
                        {/* Message meta */}
                        <div className={`text-[10px] text-discord-textMuted mt-1 flex items-center space-x-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <span>
                            {isMe ? 'You' : 'Support Engineer'}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!isMe && (
                            <>
                              <span>•</span>
                              <span className="text-[9px] px-1 bg-[#202225] border border-black/30 text-discord-textMuted rounded uppercase font-semibold">
                                Translated to your language
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Footer Input Bar */}
            <div className="p-4 bg-discord-dark border-t border-black/40">
              {activeTicket.status === 'resolved' ? (
                <div className="p-3 bg-discord-green/10 border border-discord-green/30 rounded text-discord-green text-center text-xs font-semibold flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  This ticket has been marked as resolved. If you have any other questions, please open a new ticket.
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      disabled={sendingMessage}
                      placeholder="Type a message in your native language..."
                      className="w-full p-3 bg-discord-darkest border border-black/40 rounded focus:border-discord-blurple focus:outline-none text-white text-sm pr-20"
                    />
                    {sendingMessage && (
                      <span className="absolute right-3 top-3 flex items-center gap-1 text-[10px] text-discord-blurple font-bold animate-pulse">
                        Translating...
                      </span>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sendingMessage}
                    className="px-5 py-3 bg-discord-blurple hover:bg-discord-blurple/95 disabled:bg-discord-blurple/50 text-white rounded font-bold text-sm shadow transition flex items-center space-x-1"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-discord-textMuted p-8">
            <div className="w-16 h-16 bg-[#2f3136] rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-discord-textMuted" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No Active Conversation</h3>
            <p className="text-sm text-center max-w-sm">
              Select an existing ticket from the sidebar, or raise a new ticket to speak with our support team in your native language.
            </p>
          </div>
        )}
      </div>

      {/* 3. NEW TICKET MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-discord-dark rounded-lg shadow-2xl border border-[#2f3136] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-discord-darker border-b border-black/40 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-discord-blurple" />
                Raise Support Ticket
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-discord-textMuted hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-discord-red/10 border border-discord-red/30 rounded text-discord-red text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-discord-textMuted text-xs font-bold uppercase tracking-wider mb-2">
                  Ticket Subject / Topic
                </label>
                <input
                  type="text"
                  value={newTicketTitle}
                  onChange={(e) => setNewTicketTitle(e.target.value)}
                  placeholder="e.g., Internet Connection Failure"
                  required
                  className="w-full p-2.5 bg-discord-darkest border border-black/40 rounded focus:border-discord-blurple focus:outline-none text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-discord-textMuted text-xs font-bold uppercase tracking-wider mb-2">
                  Describe Your Issue (In your native language)
                </label>
                <textarea
                  value={newTicketMessage}
                  onChange={(e) => setNewTicketMessage(e.target.value)}
                  placeholder="e.g., என் இணையம் வேலை செய்யவில்லை மற்றும் ரூட்டரில் சிவப்பு விளக்கு எரிகிறது..."
                  required
                  rows={4}
                  className="w-full p-2.5 bg-discord-darkest border border-black/40 rounded focus:border-discord-blurple focus:outline-none text-white text-sm resize-none"
                />
                <p className="text-[10px] text-discord-textMuted mt-1">
                  You can write in your preferred language. The system will auto-translate it to English for support engineers.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#2f3136]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 hover:bg-[#32353b] text-discord-text rounded font-semibold text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTicket}
                  className="px-5 py-2 bg-discord-blurple hover:bg-discord-blurple/95 disabled:bg-discord-blurple/50 text-white font-semibold rounded text-sm shadow transition flex items-center gap-1.5"
                >
                  {creatingTicket ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Translating & Raising...</span>
                    </>
                  ) : (
                    <span>Raise Ticket</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
