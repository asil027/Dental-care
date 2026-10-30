import React, { useState, useEffect } from 'react';
import {
  Mail,
  MailOpen,
  Trash2,
  CheckCircle2,
  Clock,
  Phone,
  Search,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  Loader2,
  User,
  Calendar,
  Send,
  X
} from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function MessagesManager() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'unread', 'read'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest('/messages');
      setMessages(res.messages || []);
    } catch (err) {
      console.error('Failed to fetch contact messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRead = async (id) => {
    try {
      await apiRequest(`/messages/${id}/toggle-read`, { method: 'PATCH' });
      fetchMessages();
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage((prev) => ({ ...prev, is_read: prev.is_read ? 0 : 1 }));
      }
    } catch (err) {
      alert(err.message || 'Failed to update message status');
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await apiRequest(`/messages/${id}/read`, { method: 'PATCH' });
      fetchMessages();
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage((prev) => ({ ...prev, is_read: 1 }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message permanently?')) return;
    try {
      await apiRequest(`/messages/${id}`, { method: 'DELETE' });
      fetchMessages();
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(null);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete message');
    }
  };

  const openMessageModal = (msg) => {
    setSelectedMessage(msg);
    if (!msg.is_read) {
      handleMarkAsRead(msg.id);
    }
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;
  const readCount = messages.filter((m) => m.is_read).length;

  const filteredMessages = messages
    .filter((m) => {
      if (activeTab === 'unread') return !m.is_read;
      if (activeTab === 'read') return m.is_read;
      return true;
    })
    .filter((m) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.phone && m.phone.toLowerCase().includes(q)) ||
        (m.subject && m.subject.toLowerCase().includes(q)) ||
        m.message.toLowerCase().includes(q)
      );
    });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#092C59] tracking-tight flex items-center gap-2.5">
            <span>Website Inquiries & Messages</span>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold animate-pulse">
                {unreadCount} Unread
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Direct messages and questions submitted through the public Contact section.
          </p>
        </div>

        <button
          onClick={fetchMessages}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#092C59] bg-white hover:bg-slate-50 border border-slate-200 transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Clock className="w-3.5 h-3.5 text-[#0756A6]" />
          <span>Refresh Messages</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Received</div>
            <div className="text-2xl font-black text-[#092C59] mt-0.5">{messages.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0756A6] flex items-center justify-center border border-blue-100">
            <Mail className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unread Inquiries</div>
            <div className="text-2xl font-black text-rose-600 mt-0.5">{unreadCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Responded / Read</div>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">{readCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#092C59] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All ({messages.length})
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'unread'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'unread' ? 'bg-white text-rose-700' : 'bg-rose-500 text-white'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('read')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'read'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Read ({readCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, email, query..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-[#0756A6] outline-none"
          />
        </div>
      </div>

      {/* Messages List Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0756A6] mb-2" />
            <span className="text-xs">Loading contact inquiries...</span>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Mail className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold">
              {activeTab === 'unread'
                ? 'No unread messages'
                : activeTab === 'read'
                ? 'No read messages'
                : 'No contact inquiries received yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredMessages.map((msg) => {
              const isUnread = !msg.is_read;
              return (
                <div
                  key={msg.id}
                  className={`p-5 transition flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs ${
                    isUnread ? 'bg-blue-50/50 hover:bg-blue-50/80 border-l-4 border-[#0756A6]' : 'hover:bg-slate-50/60'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-sm ${isUnread ? 'font-black text-[#092C59]' : 'font-bold text-slate-800'}`}>
                        {msg.name}
                      </span>

                      {/* Unread badge */}
                      {isUnread && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold uppercase tracking-wider">
                          New Unread
                        </span>
                      )}

                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100/70 text-[#0756A6] text-[10px] font-bold">
                        {msg.subject || 'General Inquiry'}
                      </span>

                      <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-auto md:ml-2">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{msg.created_at}</span>
                      </span>
                    </div>

                    {/* Sender Contact Details */}
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                      <a
                        href={`mailto:${msg.email}`}
                        className="hover:text-[#0756A6] flex items-center gap-1 font-medium"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{msg.email}</span>
                      </a>
                      {msg.phone && (
                        <a
                          href={`tel:${msg.phone}`}
                          className="hover:text-[#0756A6] flex items-center gap-1 font-medium"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{msg.phone}</span>
                        </a>
                      )}
                    </div>

                    {/* Message Preview */}
                    <p className="text-slate-600 text-xs line-clamp-2 pt-0.5 font-normal leading-relaxed">
                      {msg.message}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center pt-2 md:pt-0">
                    <button
                      onClick={() => openMessageModal(msg)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-[#0756A6] text-[#0756A6] hover:text-white font-bold text-xs transition cursor-pointer"
                    >
                      View Message
                    </button>

                    <button
                      onClick={() => handleToggleRead(msg.id)}
                      className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                      title={msg.is_read ? 'Mark as Unread' : 'Mark as Read'}
                    >
                      {msg.is_read ? (
                        <MailOpen className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Mail className="w-4 h-4 text-blue-600" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                      title="Delete Inquiry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Message Detail View Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-blue-100 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedMessage(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0756A6] flex items-center justify-center border border-blue-100">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#092C59]">
                  {selectedMessage.subject || 'Website Inquiry'}
                </h3>
                <span className="text-xs text-slate-400">Received on {selectedMessage.created_at}</span>
              </div>
            </div>

            {/* Sender card */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 mb-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Sender:</span>
                <span className="font-bold text-[#092C59]">{selectedMessage.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Email:</span>
                <a href={`mailto:${selectedMessage.email}`} className="font-bold text-[#0756A6] hover:underline">
                  {selectedMessage.email}
                </a>
              </div>
              {selectedMessage.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Phone Number:</span>
                  <a href={`tel:${selectedMessage.phone}`} className="font-bold text-[#0756A6] hover:underline">
                    {selectedMessage.phone}
                  </a>
                </div>
              )}
            </div>

            {/* Message Body */}
            <div>
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Message Content:
              </div>
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                {selectedMessage.message}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleRead(selectedMessage.id)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                >
                  {selectedMessage.is_read ? 'Mark as Unread' : 'Mark as Read'}
                </button>
                <button
                  onClick={() => handleDelete(selectedMessage.id)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                >
                  Delete
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedMessage.phone && (
                  <a
                    href={`https://wa.me/${selectedMessage.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-xs"
                  >
                    <span>WhatsApp</span>
                  </a>
                )}
                <a
                  href={`mailto:${selectedMessage.email}?subject=Reply to your inquiry regarding ${selectedMessage.subject || 'Dental Care'}`}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#092C59] hover:bg-[#0756A6] text-white transition flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Reply via Email</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

