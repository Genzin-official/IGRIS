import React, { useState } from 'react';
import { ChatThread, AIModel, AVAILABLE_MODELS, CustomPersona } from '../types';
import { Plus, MessageSquare, Trash2, Edit2, Check, X, ShieldAlert, Cpu, Sparkles, Search } from 'lucide-react';
import CreatePersonaModal from './CreatePersonaModal';

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

  // Persona management props
  personas: CustomPersona[];
  activePersonaId: string;
  onSelectPersona: (id: string) => void;
  onCreatePersona: (persona: Omit<CustomPersona, 'id'>) => void;
  onDeletePersona: (id: string) => void;
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

  personas,
  activePersonaId,
  onSelectPersona,
  onCreatePersona,
  onDeletePersona,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

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
      <div className="p-5 flex flex-col pb-2">
        <div className="flex items-center gap-3 mb-4">
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
          className="w-full py-2 px-4 bg-white border border-[#E5E5E5] hover:bg-gray-50 text-slate-800 font-medium rounded-xl shadow-sm transition-all duration-200 text-sm flex items-center justify-center gap-2 focus:outline-none focus:ring-1 focus:ring-black"
        >
          <Plus className="w-4 h-4 text-black" />
          <span>New Consultation</span>
        </button>
      </div>

      {/* Intelligence Personas Matrix Section */}
      <div className="px-3 py-2.5 border-b border-[#E5E5E5]/60 bg-gray-50/50 shrink-0">
        <div className="flex items-center justify-between px-2 mb-1.5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Intelligence Matrix
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1 text-[9px] text-[#A38A67] hover:text-black font-extrabold uppercase tracking-wider transition-colors"
            title="Design Custom AI"
          >
            <Sparkles className="w-3 h-3 text-[#A38A67]" />
            <span>+ Custom AI</span>
          </button>
        </div>

        <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
          {personas.map((persona) => {
            const isPersonaActive = persona.id === activePersonaId;
            return (
              <div
                key={persona.id}
                onClick={() => onSelectPersona(persona.id)}
                className={`group flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-all duration-150 border text-left ${
                  isPersonaActive
                    ? 'bg-white shadow-sm border-gray-200 text-[#111111]'
                    : 'text-slate-600 hover:text-black hover:bg-gray-100 border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm shrink-0">{persona.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-bold block truncate ${isPersonaActive ? 'text-black' : 'text-slate-700'}`}>
                      {persona.name}
                    </span>
                    <span className="text-[9px] text-slate-400 block truncate -mt-0.5">
                      {persona.model === 'gemini-3.1-pro-preview' ? 'Elite 3.1 Pro' : 'Core 3.5 Flash'}
                    </span>
                  </div>
                </div>

                {persona.isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePersona(persona.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-50 hover:text-red-600 text-gray-400 rounded transition-all"
                    title="Dissolve AI Matrix"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        <p className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">
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

      {/* Create Persona Modal Overlay */}
      {showCreateModal && (
        <CreatePersonaModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(newPersona) => {
            onCreatePersona(newPersona);
            setShowCreateModal(false);
          }}
        />
      )}
    </aside>
  );
}
