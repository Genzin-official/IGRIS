import React, { useState } from 'react';
import { ChatThread, AIModel, AVAILABLE_MODELS } from '../types';
import { Plus, MessageSquare, Trash2, Edit2, Check, X, ShieldAlert, Cpu, Sparkles, Search } from 'lucide-react';

interface SidebarProps {
  threads: ChatThread[];
  activeThreadId: string | null;
  selectedModelId: string;
  enableSearch: boolean;
  onSelectThread: (id: string) => void;
  onNewThread: () => void;
  onDeleteThread: (id: string) => void;
  onRenameThread: (id: string, newTitle: string) => void;
  onSelectModel: (modelId: string) => void;
  onToggleSearch: (enabled: boolean) => void;
}

export default function Sidebar({
  threads,
  activeThreadId,
  selectedModelId,
  enableSearch,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  onRenameThread,
  onSelectModel,
  onToggleSearch,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const startEditing = (thread: ChatThread, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(thread.id);
    setEditTitle(thread.title);
  };

  const saveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameThread(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <aside id="app-sidebar" className="w-[260px] bg-[#F7F7F8] border-r border-[#E5E5E5] flex flex-col h-full shrink-0 select-none">
      {/* Brand Logo & Header */}
      <div className="p-5 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shrink-0">
            <div className="w-4 h-4 border-2 border-white rotate-45"></div>
          </div>
          <div>
            <span className="font-semibold text-lg tracking-tight text-[#111111] block">IGRIS</span>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block -mt-1">Intelligence</span>
          </div>
        </div>

        {/* Action: New Chat */}
        <button
          id="new-chat-btn"
          onClick={onNewThread}
          className="w-full py-2.5 px-4 bg-white border border-[#E5E5E5] hover:bg-gray-50 text-slate-800 font-medium rounded-xl shadow-sm transition-all duration-200 text-sm flex items-center justify-center gap-2 focus:outline-none focus:ring-1 focus:ring-black"
        >
          <Plus className="w-4 h-4 text-black" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <p className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">
          Consultation Chronicles
        </p>

        {threads.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 italic">
            No recent sessions
          </div>
        ) : (
          threads.map((thread) => {
            const isActive = thread.id === activeThreadId;
            const isEditing = thread.id === editingId;

            return (
              <div
                key={thread.id}
                id={`thread-${thread.id}`}
                onClick={() => !isEditing && onSelectThread(thread.id)}
                className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all duration-150 relative border ${
                  isActive
                    ? 'bg-white shadow-sm border-gray-100 text-[#111111] font-semibold'
                    : 'text-slate-700 hover:text-black hover:bg-gray-100 border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-black' : 'text-gray-400'}`} />
                  
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white border border-gray-300 text-slate-800 text-xs px-2 py-0.5 rounded w-full focus:outline-none focus:ring-1 focus:ring-black"
                      autoFocus
                    />
                  ) : (
                    <span className="text-xs truncate pr-2">{thread.title}</span>
                  )}
                </div>

                {/* Hover actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  {isEditing ? (
                    <>
                      <button
                        onClick={(e) => saveRename(thread.id, e)}
                        className="p-0.5 hover:bg-gray-100 text-black rounded"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={cancelRename}
                        className="p-0.5 hover:bg-gray-100 text-gray-400 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => startEditing(thread, e)}
                        className="p-0.5 hover:bg-gray-200 hover:text-black text-gray-400 rounded"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteThread(thread.id);
                        }}
                        className="p-0.5 hover:bg-red-50 hover:text-red-600 text-gray-400 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Settings Panel & Model Selector */}
      <div className="p-4 border-t border-[#E5E5E5] bg-white space-y-4">
        {/* Model Selector */}
        <div>
          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">
            Intelligence Matrix
          </label>
          <div className="space-y-1.5">
            {AVAILABLE_MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => onSelectModel(model.id)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all duration-200 ${
                  selectedModelId === model.id
                    ? 'border-black bg-gray-50 shadow-sm'
                    : 'border-transparent bg-[#F7F7F8] hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-1.5 justify-between">
                  <span className={`text-xs font-semibold ${selectedModelId === model.id ? 'text-black' : 'text-slate-700'}`}>
                    {model.name}
                  </span>
                  {model.isPremium && (
                    <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase scale-90">
                      PRO
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 leading-relaxed">
                  {model.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Search Grounding Toggle */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F7F8] border border-[#E5E5E5]/40">
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-black" />
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Web Grounding</span>
              <span className="text-[9px] text-slate-500 block">Real-time search</span>
            </div>
          </div>
          <button
            onClick={() => onToggleSearch(!enableSearch)}
            className={`w-8 h-4.5 rounded-full p-0.5 transition-colors focus:outline-none ${
              enableSearch ? 'bg-black' : 'bg-gray-200'
            }`}
          >
            <div
              className={`bg-white w-3.5 h-3.5 rounded-full shadow-sm transform transition-transform ${
                enableSearch ? 'translate-x-3.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Bottom Metadata Info */}
        <div className="flex items-center gap-2 text-[9px] text-slate-500 bg-gray-50 p-2 rounded-lg border border-gray-100">
          <Cpu className="w-3 h-3 text-slate-500 shrink-0" />
          <span className="leading-tight">Operated securely via IGRIS Imperial Core system.</span>
        </div>
      </div>
    </aside>
  );
}
