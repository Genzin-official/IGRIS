import React, { useState, useEffect } from 'react';
import { ChatThread, ChatMessage, AVAILABLE_MODELS } from './types';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';

const LOCAL_STORAGE_THREADS_KEY = 'igris_ai_threads';
const LOCAL_STORAGE_MODEL_KEY = 'igris_ai_selected_model';
const LOCAL_STORAGE_SEARCH_KEY = 'igris_ai_enable_search';

export default function App() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string>('gemini-3.5-flash');
  const [enableSearch, setEnableSearch] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize state from local storage on mount
  useEffect(() => {
    try {
      const savedThreads = localStorage.getItem(LOCAL_STORAGE_THREADS_KEY);
      if (savedThreads) {
        const parsed = JSON.parse(savedThreads);
        setThreads(parsed);
        if (parsed.length > 0) {
          setActiveThreadId(parsed[0].id);
        }
      }

      const savedModel = localStorage.getItem(LOCAL_STORAGE_MODEL_KEY);
      if (savedModel && AVAILABLE_MODELS.some((m) => m.id === savedModel)) {
        setSelectedModelId(savedModel);
      } else {
        setSelectedModelId('gemini-3.5-flash');
        localStorage.setItem(LOCAL_STORAGE_MODEL_KEY, 'gemini-3.5-flash');
      }

      const savedSearch = localStorage.getItem(LOCAL_STORAGE_SEARCH_KEY);
      if (savedSearch) {
        setEnableSearch(savedSearch === 'true');
      }
    } catch (e) {
      console.error('Failed to restore offline consulting chronicles:', e);
    }
  }, []);

  // Save to local storage when state change
  const saveThreadsToLocalStorage = (updatedThreads: ChatThread[]) => {
    localStorage.setItem(LOCAL_STORAGE_THREADS_KEY, JSON.stringify(updatedThreads));
  };

  const handleSelectThread = (id: string) => {
    setActiveThreadId(id);
  };

  const handleNewThread = () => {
    setActiveThreadId(null);
  };

  const handleDeleteThread = (id: string) => {
    const updated = threads.filter((t) => t.id !== id);
    setThreads(updated);
    saveThreadsToLocalStorage(updated);

    if (activeThreadId === id) {
      setActiveThreadId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleRenameThread = (id: string, newTitle: string) => {
    const updated = threads.map((t) => {
      if (t.id === id) {
        return { ...t, title: newTitle, updatedAt: new Date().toISOString() };
      }
      return t;
    });
    setThreads(updated);
    saveThreadsToLocalStorage(updated);
  };

  const handleSelectModel = (modelId: string) => {
    setSelectedModelId(modelId);
    localStorage.setItem(LOCAL_STORAGE_MODEL_KEY, modelId);
  };

  const handleToggleSearch = (enabled: boolean) => {
    setEnableSearch(enabled);
    localStorage.setItem(LOCAL_STORAGE_SEARCH_KEY, String(enabled));
  };

  const handleSendMessage = async (content: string) => {
    if (isGenerating) return;

    let currentThreadId = activeThreadId;
    let currentThreads = [...threads];
    let activeThread = currentThreads.find((t) => t.id === currentThreadId);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    // 1. Setup Active Thread (Create if none exists)
    if (!activeThread) {
      const shortTitle = content.substring(0, 30) + (content.length > 30 ? '...' : '');
      const newThread: ChatThread = {
        id: `thread-${Date.now()}`,
        title: shortTitle,
        messages: [userMessage],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        model: selectedModelId,
      };

      currentThreads = [newThread, ...currentThreads];
      setThreads(currentThreads);
      saveThreadsToLocalStorage(currentThreads);
      setActiveThreadId(newThread.id);
      currentThreadId = newThread.id;
      activeThread = newThread;
    } else {
      // Append user message to active thread
      activeThread.messages = [...activeThread.messages, userMessage];
      activeThread.updatedAt = new Date().toISOString();
      setThreads(currentThreads);
      saveThreadsToLocalStorage(currentThreads);
    }

    // 2. Setup Assistant Stream Placeholder
    const assistantMessageId = `assist-${Date.now()}`;
    const assistantPlaceholder: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      modelUsed: AVAILABLE_MODELS.find((m) => m.id === selectedModelId)?.name || 'IGRIS',
    };

    activeThread.messages = [...activeThread.messages, assistantPlaceholder];
    setThreads([...currentThreads]);
    setIsGenerating(true);

    // 3. Query SSE Stream from full-stack endpoint
    try {
      // Gather relevant history. Only pass user and assistant roles (filter out system)
      const chatHistory = activeThread.messages
        .filter((msg) => msg.id !== assistantMessageId)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: chatHistory,
          model: selectedModelId,
          enableSearch,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Command center responded with error status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Unable to initialize response stream reader.');
      }

      const decoder = new TextDecoder();
      let partialLine = '';
      let accumulatedText = '';
      let detectedGrounding: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkStr = decoder.decode(value, { stream: true });
        const lines = (partialLine + chunkStr).split('\n');
        partialLine = lines.pop() || '';

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine || !cleanLine.startsWith('data: ')) continue;

          const dataStr = cleanLine.substring(6).trim();
          if (dataStr === '[DONE]') continue;

          try {
            const payload = JSON.parse(dataStr);
            if (payload.error) {
              throw new Error(payload.error);
            }

            if (payload.text) {
              accumulatedText += payload.text;
            }
            if (payload.grounding) {
              detectedGrounding = payload.grounding;
            }

            // Real-time incremental state update
            setThreads((prevThreads) => {
              return prevThreads.map((t) => {
                if (t.id === currentThreadId) {
                  return {
                    ...t,
                    messages: t.messages.map((m) => {
                      if (m.id === assistantMessageId) {
                        return {
                          ...m,
                          content: accumulatedText,
                          grounding: detectedGrounding || m.grounding,
                        };
                      }
                      return m;
                    }),
                  };
                }
                return t;
              });
            });
          } catch (e) {
            console.error('Failed to parse SSE payload line:', e);
          }
        }
      }

      // Final persistence
      setThreads((prevThreads) => {
        saveThreadsToLocalStorage(prevThreads);
        return prevThreads;
      });
    } catch (error: any) {
      console.error('Sovereign communication failed:', error);
      
      const elegantErrorMessage = `An elegant system error has occurred during communication with the Imperial command matrix.\n\n**Reason:** ${error.message || 'The backend is currently preparing settings or experiencing transient latency.'}\n\n*Please verify that your GEMINI_API_KEY is configured in **Settings > Secrets** or try again shortly.*`;

      setThreads((prevThreads) => {
        const updated = prevThreads.map((t) => {
          if (t.id === currentThreadId) {
            return {
              ...t,
              messages: t.messages.map((m) => {
                if (m.id === assistantMessageId) {
                  return {
                    ...m,
                    content: elegantErrorMessage,
                  };
                }
                return m;
              }),
            };
          }
          return t;
        });
        saveThreadsToLocalStorage(updated);
        return updated;
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const activeThread = threads.find((t) => t.id === activeThreadId) || null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-slate-800 font-sans" id="igris-app-root">
      {/* Dynamic sidebar */}
      <Sidebar
        threads={threads}
        activeThreadId={activeThreadId}
        selectedModelId={selectedModelId}
        enableSearch={enableSearch}
        onSelectThread={handleSelectThread}
        onNewThread={handleNewThread}
        onDeleteThread={handleDeleteThread}
        onRenameThread={handleRenameThread}
        onSelectModel={handleSelectModel}
        onToggleSearch={handleToggleSearch}
      />

      {/* Primary chat workspace */}
      <ChatWindow
        messages={activeThread ? activeThread.messages : []}
        isGenerating={isGenerating}
        activeModelId={selectedModelId}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
