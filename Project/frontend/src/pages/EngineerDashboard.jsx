import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { 
  LogOut, MessageSquare, Send, Globe, ChevronDown, ChevronUp,
  Clock, CheckCircle, RefreshCw, AlertCircle, Smile, Meh, Frown
} from 'lucide-react';

const SENTIMENT_ICONS = {
  positive: <Smile className="w-3.5 h-3.5 text-discord-green" />,
  neutral: <Meh className="w-3.5 h-3.5 text-discord-yellow" />,
  negative: <Frown className="w-3.5 h-3.5 text-discord-red" />
};

const LANGUAGE_LABELS = {
  ta: "Tamil",
  hi: "Hindi",
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German"
};

export default function EngineerDashboard() {
  const { user, logout } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  
  // Expandable native messages tracker (holds message IDs that are expanded)
  const [expandedMessages, setExpandedMessages] = useState({});

  // Loaders
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [resolvingTicket, setResolvingTicket] = useState(false);
  const [refreshingChat, setRefreshingChat] = useState(false);
  const [error, setError] = useState('');

  const chatEndRef = useRef(null);
  const pollingRef = useRef(null);

  // Load all tickets
  const loadTickets = async (silent = false) => {
    if (!silent) setLoadingTickets(true);
    try {
      const data = await api.getTickets();
      // Sort: open first, then high priority first, then date descending
      const sorted = [...data].sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === 'open' ? -1 : 1;
        }
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        if (a.priority !== b.priority) {
          return priorityWeight[b.priority] - priorityWeight[a.priority];
        }
        return new Date(b.updated_at) - new Date(a.updated_at);
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
        
        // Update active ticket details in state (for priority/sentiment changes)
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeTicket || sendingMessage) return;

    setSendingMessage(true);
    const textToSend = inputText;
    setInputText('');
    try {
      const sentMsg = await api.sendMessage(activeTicket.id, textToSend);
      setMessages(prev => [...prev, sentMsg]);
      loadTickets(true);
    } catch (err) {
      setError(err.message || 'Failed to send reply.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!activeTicket || resolvingTicket) return;
    setResolvingTicket(true);
    try {
      const updated = await api.resolveTicket(activeTicket.id);
      setActiveTicket(updated);
      loadTickets(true);
    } catch (err) {
      setError(err.message || 'Failed to resolve ticket.');
    } finally {
      setResolvingTicket(false);
    }
  };

  const toggleExpandMessage = (msgId) => {
    setExpandedMessages(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  return (
    <div className="flex h-screen bg-discord-darkest text-discord-text overflow-hidden">
      {/* 1. LEFT SIDEBAR: ACTIVE TICKETS */}
      <div className="w-80 bg-discord-darker flex flex-col border-r border-black/40">
        {/* User Info Header */}
        <div className="p-4 bg-discord-darkest flex items-center justify-between border-b border-black/40">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 bg-discord-green rounded-full flex items-center justify-center font-bold text-discord-darkest uppercase shadow">
              {user?.username.slice(0, 2)}
            </div>
            <div className="overflow-hidden">
              <div className="font-semibold text-white truncate text-sm">{user?.username}</div>
              <div className="text-[10px] text-discord-textMuted uppercase font-bold tracking-wider">
                Support Engineer
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

        {/* Tickets Scroll Panel */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1.5 pb-4 mt-3">
          <div className="px-2 pb-1 text-[11px] font-bold text-discord-textMuted uppercase tracking-wider flex justify-between items-center">
            <span>Incoming Tickets Queue</span>
            <button 
              onClick={() => loadTickets()}
              className="text-[10px] text-discord-blurple hover:underline flex items-center gap-0.5"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>

          {loadingTickets ? (
            <div className="flex flex-col items-center justify-center py-8 text-discord-textMuted space-y-2 text-xs">
              <svg className="animate-spin h-5 w-5 text-discord-blurple" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading queue...</span>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8 text-discord-textMuted text-xs px-4">
              All clear! No tickets found.
            </div>
          ) : (
            tickets.map((t) => {
              const isActive = activeTicket?.id === t.id;
              // Check if there are any unread client messages
              const hasUnread = t.status === 'open' && !isActive; // Simple demonstration
              
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTicket(t)}
                  className={`w-full p-3 rounded text-left transition flex items-start space-x-2.5 ${
                    isActive 
                      ? 'bg-discord-dark text-white font-medium border-l-2 border-discord-green' 
                      : 'hover:bg-[#32353b]/40 text-discord-text'
                  }`}
                >
                  <MessageSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isActive ? 'text-discord-green' : 'text-discord-textMuted'}`} />
                  <div className="overflow-hidden flex-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-discord-textMuted uppercase">
                      <span>{t.id}</span>
                      <span className="text-discord-blurple">@{t.client_username}</span>
                    </div>
                    <div className="text-sm font-semibold truncate text-white">
                      {t.title}
                    </div>
                    
                    {/* Meta Badges */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <span className={`text-[9px] px-1 py-0.5 rounded font-extrabold uppercase ${
                        t.status === 'open' 
                          ? 'bg-discord-green/10 text-discord-green' 
                          : 'bg-discord-textMuted/20 text-discord-textMuted'
                      }`}>
                        {t.status}
                      </span>
                      <span className={`text-[9px] px-1 py-0.5 rounded font-extrabold uppercase ${
                        t.priority === 'high' 
                          ? 'bg-discord-red/20 text-discord-red'
                          : t.priority === 'medium'
                          ? 'bg-discord-yellow/20 text-discord-yellow'
                          : 'bg-discord-green/20 text-discord-green'
                      }`}>
                        {t.priority}
                      </span>
                      <span className="text-[9px] px-1 py-0.5 bg-discord-darkest border border-black/35 rounded text-discord-textMuted flex items-center gap-0.5 font-bold uppercase">
                        {SENTIMENT_ICONS[t.sentiment]}
                        {t.sentiment}
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
                  <span className="text-discord-blurple text-xs font-semibold">Client: @{activeTicket.client_username}</span>
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
                  <div className="flex items-center space-x-1 text-[10px] px-1.5 py-0.5 bg-discord-darkest rounded border border-black/30 text-discord-textMuted font-bold uppercase">
                    {SENTIMENT_ICONS[activeTicket.sentiment]}
                    <span>Sentiment: {activeTicket.sentiment}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-discord-textMuted text-xs">
                {refreshingChat && (
                  <span className="flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-discord-green" />
                    Syncing...
                  </span>
                )}
                {activeTicket.status === 'open' && (
                  <button
                    onClick={handleResolveTicket}
                    disabled={resolvingTicket}
                    className="px-3 py-1.5 bg-discord-green text-discord-darkest font-bold rounded text-xs shadow hover:bg-discord-green/90 transition flex items-center space-x-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Resolve Ticket</span>
                  </button>
                )}
              </div>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => {
                const isMe = msg.sender_role === 'engineer';
                const isExpanded = !!expandedMessages[msg.id];
                
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[70%] flex space-x-3">
                      {!isMe && (
                        <div className="w-8 h-8 bg-discord-blurple rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white uppercase shadow-md text-xs">
                          {msg.language.toUpperCase()}
                        </div>
                      )}
                      <div>
                        {/* Bubble content */}
                        <div className={`p-3 rounded-lg shadow-md ${
                          isMe 
                            ? 'bg-discord-green text-discord-darkest rounded-tr-none font-medium' 
                            : 'bg-discord-darker text-discord-text rounded-tl-none border border-black/20'
                        }`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {isMe ? msg.original_text : msg.translated_text}
                          </p>

                          {/* Client raw/original translation expander */}
                          {!isMe && msg.language !== 'en' && (
                            <div className="mt-2.5 pt-2.5 border-t border-[#374151] flex flex-col">
                              <button
                                onClick={() => toggleExpandMessage(msg.id)}
                                className="text-[10px] text-discord-blurple font-bold hover:text-white flex items-center gap-0.5 transition"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3 h-3" />
                                    Hide original {LANGUAGE_LABELS[msg.language] || msg.language} message
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3" />
                                    Show original {LANGUAGE_LABELS[msg.language] || msg.language} message
                                  </>
                                )}
                              </button>
                              {isExpanded && (
                                <p className="text-xs italic text-discord-textMuted mt-1.5 leading-relaxed bg-[#202225] p-2 rounded border border-black/20 select-all">
                                  {msg.original_text}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Message meta */}
                        <div className={`text-[10px] text-discord-textMuted mt-1 flex items-center space-x-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <span>
                            {isMe ? 'You (Support)' : `@${activeTicket.client_username}`}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!isMe && msg.language !== 'en' && (
                            <>
                              <span>•</span>
                              <span className="text-[9px] px-1 bg-[#202225] border border-black/30 text-[#57F287] rounded uppercase font-semibold">
                                Translated to English
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
                <div className="p-3 bg-discord-textMuted/10 border border-discord-textMuted/30 rounded text-discord-textMuted text-center text-xs font-semibold flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  This ticket has been marked as resolved. Messages are disabled.
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      disabled={sendingMessage}
                      placeholder={`Reply to @${activeTicket.client_username} in English...`}
                      className="w-full p-3 bg-discord-darkest border border-black/40 rounded focus:border-discord-green focus:outline-none text-white text-sm pr-20"
                    />
                    {sendingMessage && (
                      <span className="absolute right-3 top-3 flex items-center gap-1 text-[10px] text-discord-green font-bold animate-pulse">
                        Translating...
                      </span>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sendingMessage}
                    className="px-5 py-3 bg-discord-green hover:bg-discord-green/95 disabled:bg-discord-green/50 text-discord-darkest font-bold text-sm shadow transition flex items-center space-x-1"
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
              <Globe className="w-8 h-8 text-discord-textMuted" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Queue Inspection</h3>
            <p className="text-sm text-center max-w-sm">
              Select an active customer ticket from the inbox queue on the left to review translated reports and send multilingual replies.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
