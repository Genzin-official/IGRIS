import React, { useState, useEffect } from 'react';
import { 
  Github, X, Key, Search, Folder, File, GitCommit, AlertCircle, 
  ArrowLeft, ArrowUpRight, Copy, Check, MessageSquare, ChevronRight, 
  ChevronDown, RefreshCw, Layers
} from 'lucide-react';

interface GitHubPanelProps {
  onClose: () => void;
  onInjectPrompt: (text: string, autoSend?: boolean) => void;
}

interface RepoInfo {
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
}

interface RepoContent {
  name: string;
  path: string;
  type: 'dir' | 'file';
  sha: string;
  size: number;
}

interface RepoIssue {
  number: number;
  title: string;
  body: string;
  html_url: string;
  state: string;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
}

interface RepoCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  author?: {
    avatar_url: string;
  };
  html_url: string;
}

export default function GitHubPanel({ onClose, onInjectPrompt }: GitHubPanelProps) {
  const [token, setToken] = useState<string>(() => localStorage.getItem('igris_github_token') || '');
  const [isTokenSaved, setIsTokenSaved] = useState(!!localStorage.getItem('igris_github_token'));
  
  const [repoSearch, setRepoSearch] = useState('');
  const [activeRepo, setActiveRepo] = useState<string>(() => localStorage.getItem('igris_github_active_repo') || 'facebook/react');
  
  const [activeTab, setActiveTab] = useState<'files' | 'issues' | 'commits' | 'config'>('files');
  
  // Lists
  const [userRepos, setUserRepos] = useState<RepoInfo[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [contents, setContents] = useState<RepoContent[]>([]);
  const [issues, setIssues] = useState<RepoIssue[]>([]);
  const [commits, setCommits] = useState<RepoCommit[]>([]);
  
  // Selected Details
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string; url: string } | null>(null);
  
  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  // Load repositories if token exists
  useEffect(() => {
    if (token) {
      fetchUserRepos();
    }
  }, [token]);

  // Load active repository contents
  useEffect(() => {
    if (activeRepo) {
      localStorage.setItem('igris_github_active_repo', activeRepo);
      fetchRepoContents(currentPath);
      fetchRepoIssues();
      fetchRepoCommits();
    }
  }, [activeRepo, currentPath]);

  const getHeaders = () => {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (token) {
      headers.Authorization = `token ${token}`;
    }
    return headers;
  };

  const fetchUserRepos = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=30', {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setUserRepos(data.map((r: any) => ({
          name: r.name,
          full_name: r.full_name,
          description: r.description || 'No description provided.',
          html_url: r.html_url,
          stargazers_count: r.stargazers_count
        })));
      } else {
        setError('Failed to fetch personal repositories. Verify your token permissions.');
      }
    } catch (e: any) {
      setError('Network error listing user repos: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRepoContents = async (path: string) => {
    if (!activeRepo) return;
    setLoading(true);
    setError('');
    try {
      const url = `https://api.github.com/repos/${activeRepo}/contents/${path}`;
      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const formatted = Array.isArray(data) 
          ? data.map((item: any) => ({
              name: item.name,
              path: item.path,
              type: item.type,
              sha: item.sha,
              size: item.size
            }))
          : [];
        // Sort directories first
        formatted.sort((a, b) => {
          if (a.type === b.type) return a.name.localeCompare(b.name);
          return a.type === 'dir' ? -1 : 1;
        });
        setContents(formatted);
      } else {
        setError(`Failed to retrieve repository contents. Repository "${activeRepo}" may be private or misspelled.`);
      }
    } catch (e: any) {
      setError('Network error fetching contents: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRepoIssues = async () => {
    if (!activeRepo) return;
    try {
      const url = `https://api.github.com/repos/${activeRepo}/issues?state=open&per_page=10`;
      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setIssues(data.map((item: any) => ({
          number: item.number,
          title: item.title,
          body: item.body || '',
          html_url: item.html_url,
          state: item.state,
          user: {
            login: item.user.login,
            avatar_url: item.user.avatar_url,
          },
          created_at: item.created_at,
        })));
      }
    } catch (e) {
      console.error('Error fetching issues:', e);
    }
  };

  const fetchRepoCommits = async () => {
    if (!activeRepo) return;
    try {
      const url = `https://api.github.com/repos/${activeRepo}/commits?per_page=10`;
      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCommits(data.map((item: any) => ({
          sha: item.sha,
          commit: {
            message: item.commit.message,
            author: {
              name: item.commit.author.name,
              date: item.commit.author.date,
            }
          },
          author: item.author ? { avatar_url: item.author.avatar_url } : undefined,
          html_url: item.html_url,
        })));
      }
    } catch (e) {
      console.error('Error fetching commits:', e);
    }
  };

  const loadFileContent = async (file: RepoContent) => {
    setLoading(true);
    setError('');
    try {
      const url = `https://api.github.com/repos/${activeRepo}/contents/${file.path}`;
      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.content) {
          // Decode base64
          const decoded = decodeURIComponent(escape(window.atob(data.content.replace(/\s/g, ''))));
          setSelectedFile({
            path: file.path,
            content: decoded,
            url: data.html_url
          });
        } else {
          setError('File has no textual content.');
        }
      } else {
        setError('Could not download file contents.');
      }
    } catch (e: any) {
      setError('Error reading file: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToken = () => {
    const trimmed = token.trim();
    if (trimmed) {
      localStorage.setItem('igris_github_token', trimmed);
      setIsTokenSaved(true);
      fetchUserRepos();
    }
  };

  const handleClearToken = () => {
    localStorage.removeItem('igris_github_token');
    setToken('');
    setIsTokenSaved(false);
    setUserRepos([]);
  };

  const handleLoadCustomRepo = () => {
    const trimmed = repoSearch.trim();
    if (trimmed) {
      // Basic check
      if (trimmed.includes('/')) {
        setActiveRepo(trimmed);
        setCurrentPath('');
        setSelectedFile(null);
      } else {
        setError('Repository name must be formatted as "owner/repo"');
      }
    }
  };

  const handleBackDir = () => {
    setSelectedFile(null);
    if (!currentPath) return;
    const parts = currentPath.split('/');
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  const handleCopyCode = (text: string, path: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  // Automated prompt injectors
  const handleAskFileAudit = () => {
    if (!selectedFile) return;
    const prompt = `I have synced the following file \`${selectedFile.path}\` from the GitHub repository \`${activeRepo}\` for your review. Please perform a detailed code audit, evaluate its performance, identify potential vulnerabilities, and verify compliance with elegant TypeScript/React patterns:\n\n\`\`\`${selectedFile.path.split('.').pop() || 'typescript'}\n${selectedFile.content}\n\`\`\``;
    onInjectPrompt(prompt, true);
  };

  const handleDiscussIssue = (issue: RepoIssue) => {
    const prompt = `Please review and help me design a resolution path for this open GitHub Issue #${issue.number} from repository \`${activeRepo}\`:\n\n**Title**: ${issue.title}\n**Reported by**: @${issue.user.login}\n\n**Description**:\n${issue.body || 'No description provided.'}\n\nPropose a robust, elegant technical solution to address this item.`;
    onInjectPrompt(prompt, true);
  };

  const handleReviewCommit = (commit: RepoCommit) => {
    const prompt = `I would like your assistance in auditing the recent commit \`${commit.sha.substring(0, 7)}\` by \`${commit.commit.author.name}\` in repo \`${activeRepo}\`:\n\n**Commit Message**:\n${commit.commit.message}\n\nBased on this commit context, explain what architectural or state enhancements this likely implements and list potential side-effects that are critical to guard against.`;
    onInjectPrompt(prompt, true);
  };

  return (
    <div 
      id="github-integration-panel" 
      className="w-[360px] md:w-[420px] bg-white border-l border-[#E5E5E5] flex flex-col h-full shrink-0 select-none overflow-hidden relative z-20 animate-slide-in-right"
    >
      {/* Panel Header */}
      <div className="h-14 border-b border-gray-100 flex items-center justify-between px-5 shrink-0 bg-[#FCFAF7] z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#111111] text-white rounded-md flex items-center justify-center shrink-0">
            <Github className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-widest block">GitHub Center</span>
            <span className="text-[10px] text-[#A38A67] font-semibold -mt-0.5 block truncate max-w-[200px]">{activeRepo}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCurrentPath('');
              setSelectedFile(null);
              fetchRepoContents('');
              fetchRepoIssues();
              fetchRepoCommits();
            }}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-slate-400 hover:text-black transition-all"
            title="Reload Repository Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-slate-400 hover:text-black transition-all"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="grid grid-cols-4 border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 text-center select-none">
        {(['files', 'issues', 'commits', 'config'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3.5 border-b-2 transition-all ${
              activeTab === tab 
                ? 'border-[#A38A67] text-black bg-white font-extrabold' 
                : 'border-transparent hover:text-black hover:bg-gray-100/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto flex flex-col p-4 space-y-4 min-h-0 bg-[#FAFAFB]">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* LOADING SHIM */}
        {loading && !selectedFile && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2 select-none">
            <RefreshCw className="w-6 h-6 animate-spin text-[#A38A67]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Syncing GitHub Stream...</span>
          </div>
        )}

        {/* 1. FILES TAB */}
        {activeTab === 'files' && !loading && (
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            {selectedFile ? (
              // FILE PREVIEW SCREEN
              <div className="flex-1 flex flex-col min-h-0 space-y-3 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 shrink-0">
                  <button 
                    onClick={() => setSelectedFile(null)}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-black transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to list</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyCode(selectedFile.content, selectedFile.path)}
                      className="p-1 hover:bg-gray-100 rounded text-slate-500 hover:text-black transition-all"
                      title="Copy Contents"
                    >
                      {copiedPath === selectedFile.path ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={selectedFile.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="p-1 hover:bg-gray-100 rounded text-slate-500 hover:text-black transition-all"
                      title="Open on GitHub"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                  <span className="text-xs font-mono font-bold text-slate-400 truncate mb-2 block">{selectedFile.path}</span>
                  <div className="flex-1 bg-slate-900 rounded-xl overflow-auto p-3.5 font-mono text-[11px] text-slate-100 leading-relaxed shadow-inner">
                    <pre><code>{selectedFile.content}</code></pre>
                  </div>
                </div>

                <button
                  onClick={handleAskFileAudit}
                  className="w-full py-2.5 bg-black hover:bg-gray-900 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all shrink-0"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ask AI to Audit File</span>
                </button>
              </div>
            ) : (
              // BROWSER FILE MATRIX
              <div className="flex-1 flex flex-col min-h-0 space-y-3">
                {/* Path indicator */}
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm shrink-0">
                  <span className="text-slate-400">Path:</span>
                  <span className="font-mono truncate">{currentPath || '/'}</span>
                  {currentPath && (
                    <button 
                      onClick={handleBackDir}
                      className="ml-auto text-[10px] font-bold text-[#A38A67] uppercase tracking-wider hover:text-black"
                    >
                      Up One Level
                    </button>
                  )}
                </div>

                <div className="flex-1 bg-white border border-gray-100 rounded-2xl overflow-y-auto shadow-sm divide-y divide-gray-50 min-h-0">
                  {contents.length === 0 ? (
                    <p className="text-center py-10 text-xs text-slate-400">Empty directory</p>
                  ) : (
                    contents.map((item) => (
                      <div
                        key={item.sha}
                        onClick={() => {
                          if (item.type === 'dir') {
                            setCurrentPath(item.path);
                          } else {
                            loadFileContent(item);
                          }
                        }}
                        className="flex items-center justify-between p-3 hover:bg-gray-50/80 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {item.type === 'dir' ? (
                            <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                          ) : (
                            <File className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span className="text-xs font-medium text-slate-800 truncate group-hover:text-black">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          {item.type === 'dir' ? (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          ) : (
                            <span className="text-[10px] font-bold text-[#A38A67] uppercase tracking-wider">Inspect File</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. ISSUES TAB */}
        {activeTab === 'issues' && !loading && (
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Repository Issues (Open)</p>
            <div className="flex-1 bg-white border border-gray-100 rounded-2xl overflow-y-auto shadow-sm divide-y divide-gray-50 min-h-0">
              {issues.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-1">
                  <p className="text-xs">No active issues found.</p>
                  <p className="text-[10px]">Everything is fully resolved or loaded without credentials.</p>
                </div>
              ) : (
                issues.map((issue) => (
                  <div key={issue.number} className="p-4 hover:bg-gray-50/80 transition-all flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 font-mono">#{issue.number}</span>
                        <h4 className="text-xs font-bold text-slate-800 truncate">{issue.title}</h4>
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider select-none shrink-0">
                        Open
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed bg-gray-50 p-2 rounded-lg font-mono">
                      {issue.body || 'No descriptive context provided.'}
                    </p>

                    <div className="flex items-center justify-between border-t border-gray-50 pt-2 shrink-0 select-none">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                        <img 
                          src={issue.user.avatar_url} 
                          alt={issue.user.login} 
                          className="w-4 h-4 rounded-full border border-gray-150 shrink-0" 
                        />
                        <span>@{issue.user.login}</span>
                      </div>

                      <button
                        onClick={() => handleDiscussIssue(issue)}
                        className="py-1 px-2.5 bg-black hover:bg-gray-900 text-white rounded-lg text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Discuss Resolution</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 3. COMMITS TAB */}
        {activeTab === 'commits' && !loading && (
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recent Repository Chronology (Commits)</p>
            <div className="flex-1 bg-white border border-gray-100 rounded-2xl overflow-y-auto shadow-sm divide-y divide-gray-50 min-h-0">
              {commits.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-1">
                  <p className="text-xs">No recent commits loaded.</p>
                </div>
              ) : (
                commits.map((commit) => (
                  <div key={commit.sha} className="p-4 hover:bg-gray-50/80 transition-all flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <span className="text-[10px] font-mono font-bold text-[#A38A67]">{commit.sha.substring(0, 7)}</span>
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1 leading-snug">{commit.commit.message}</h4>
                      </div>
                      <a 
                        href={commit.html_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="p-1 hover:bg-gray-100 rounded text-slate-400 hover:text-black transition-all shrink-0"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-50 pt-2 shrink-0 select-none">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                        {commit.author?.avatar_url && (
                          <img 
                            src={commit.author.avatar_url} 
                            alt="author avatar" 
                            className="w-4 h-4 rounded-full border border-gray-150 shrink-0" 
                          />
                        )}
                        <span>{commit.commit.author.name}</span>
                        <span className="text-gray-300">•</span>
                        <span>{new Date(commit.commit.author.date).toLocaleDateString()}</span>
                      </div>

                      <button
                        onClick={() => handleReviewCommit(commit)}
                        className="py-1 px-2.5 bg-[#FCFAF7] border border-[#EADFC9] hover:bg-[#F5EFE4] text-slate-700 rounded-lg text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1 transition-all"
                      >
                        <Layers className="w-3 h-3 text-[#A38A67]" />
                        <span>Audit Changes</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 4. CONFIG TAB */}
        {activeTab === 'config' && (
          <div className="space-y-5 flex-1 overflow-y-auto">
            {/* Direct Load Section */}
            <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#A38A67]" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Connect Public Repository</h4>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Analyze public code repositories directly on the fly. Requires no Personal Access Tokens or setup.
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  placeholder="e.g. facebook/react"
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[#111111] focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all font-mono"
                />
                <button
                  onClick={handleLoadCustomRepo}
                  className="w-full py-2 bg-black hover:bg-gray-900 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  Retrieve Code Matrix
                </button>
              </div>
            </div>

            {/* Secret Tokens Section */}
            <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">GitHub Personal Access Token</h4>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Connect your secure personal access token to browse your private repositories and elevate API query rate thresholds. Tokens are stored securely in browser local storage.
              </p>

              {isTokenSaved ? (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl flex items-center justify-between text-xs text-emerald-800 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Security Token Authorized</span>
                    </span>
                    <button 
                      onClick={handleClearToken}
                      className="text-[9px] uppercase tracking-wider text-red-600 hover:text-red-800 font-bold"
                    >
                      Disconnect
                    </button>
                  </div>
                  <button
                    onClick={fetchUserRepos}
                    className="w-full py-2 border border-gray-200 text-slate-700 hover:bg-gray-50 font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
                  >
                    Refresh Personal Repositories
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxx"
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[#111111] focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all font-mono"
                  />
                  <button
                    onClick={handleSaveToken}
                    disabled={!token}
                    className="w-full py-2 bg-[#FCFAF7] border border-[#EADFC9] text-slate-800 hover:bg-[#F5EFE4] font-bold rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                  >
                    Authorize and Store Token
                  </button>
                </div>
              )}
            </div>

            {/* Repository List */}
            {userRepos.length > 0 && (
              <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-sm space-y-2 max-h-[220px] flex flex-col min-h-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Your Repositories</p>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50 pr-1 space-y-1.5">
                  {userRepos.map((repo) => (
                    <button
                      key={repo.full_name}
                      onClick={() => {
                        setActiveRepo(repo.full_name);
                        setCurrentPath('');
                        setSelectedFile(null);
                        setActiveTab('files');
                      }}
                      className={`w-full text-left p-2 rounded-xl border transition-all text-xs flex justify-between items-center ${
                        activeRepo === repo.full_name
                          ? 'border-[#A38A67] bg-[#FCFAF7] font-bold'
                          : 'border-transparent hover:bg-gray-50 text-slate-700'
                      }`}
                    >
                      <div className="truncate pr-3">
                        <span className="block truncate font-semibold text-slate-800">{repo.name}</span>
                        <span className="text-[9px] text-slate-400 truncate block -mt-0.5">{repo.full_name}</span>
                      </div>
                      <span className="text-[10px] text-[#A38A67] font-bold select-none shrink-0">&bull; {repo.stargazers_count} ★</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer credits */}
      <div className="h-10 border-t border-gray-100 flex items-center justify-center bg-white text-[9px] text-slate-400 font-semibold uppercase shrink-0">
        🐙 Powered by the GitHub REST Engine
      </div>
    </div>
  );
}
