
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { performDeepResearch } from './services/geminiService';
import { ResearchReport, AppState } from './types';

// Components
const Header: React.FC = () => (
  <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-600 text-white p-2 rounded-lg">
          <i className="fa-solid fa-microscope text-xl"></i>
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Deep Analyst</h1>
      </div>
      <div className="hidden sm:flex items-center gap-4 text-slate-500 text-sm">
        <span className="flex items-center gap-1">
          <i className="fa-solid fa-bolt text-indigo-500"></i>
          Gemini 3 Flash
        </span>
        <span className="flex items-center gap-1">
          <i className="fa-brands fa-google text-indigo-500"></i>
          Search Grounding
        </span>
      </div>
    </div>
  </header>
);

const SearchBar: React.FC<{ onSearch: (query: string) => void, loading: boolean }> = ({ onSearch, loading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !loading) {
      onSearch(query.trim());
      setQuery('');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 px-4">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <i className={`fa-solid ${loading ? 'fa-circle-notch fa-spin text-indigo-500' : 'fa-magnifying-glass text-slate-400'} group-focus-within:text-indigo-500 transition-colors`}></i>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="深い調査や分析が必要なトピックを入力してください..."
          className="block w-full pl-12 pr-24 py-5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 placeholder-slate-400 transition-all outline-none"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="absolute right-3 inset-y-2 px-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
        >
          {loading ? '分析中...' : '調査開始'}
        </button>
      </form>
    </div>
  );
};

const Sidebar: React.FC<{ 
  reports: ResearchReport[], 
  onSelect: (r: ResearchReport) => void,
  onDelete: (id: string) => void,
  currentId?: string
}> = ({ reports, onSelect, onDelete, currentId }) => (
  <div className="w-64 bg-slate-50 border-r border-slate-200 hidden lg:block overflow-y-auto">
    <div className="p-4">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">リサーチ履歴</h2>
      <div className="space-y-1">
        {reports.length === 0 ? (
          <p className="text-sm text-slate-400 italic">履歴はありません</p>
        ) : (
          reports.map(report => (
            <div key={report.id} className="group relative">
              <button
                onClick={() => onSelect(report)}
                className={`w-full text-left p-3 pr-10 rounded-lg text-sm transition-colors flex items-start gap-3 ${
                  currentId === report.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-slate-200 text-slate-600'
                }`}
              >
                <i className="fa-regular fa-file-lines mt-0.5 opacity-70"></i>
                <span className="truncate">{report.query}</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(report.id); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="削除"
              >
                <i className="fa-solid fa-trash-can text-xs"></i>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
);

const ReportView: React.FC<{ 
  report: ResearchReport, 
  onSave: (id: string, newContent: string) => void 
}> = ({ report, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState(report.content);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditBuffer(report.content);
    setIsEditing(false);
  }, [report.id, report.content]);

  const handleSaveEdit = () => {
    onSave(report.id, editBuffer);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditBuffer(report.content);
    setIsEditing(false);
  };

  const downloadFile = (format: 'md' | 'txt') => {
    const filename = `${report.query.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`;
    const blob = new Blob([editBuffer], { type: format === 'md' ? 'text/markdown' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editBuffer);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-8 mb-20">
      <div className="p-8 border-b border-slate-100 bg-slate-50">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <div className="flex gap-2">
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
              Research Result
            </span>
            {isEditing && (
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider animate-pulse">
                Editing
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <div className="flex bg-white border border-slate-200 rounded-lg p-1">
                  <button 
                    onClick={() => downloadFile('md')}
                    title="Markdown形式で保存"
                    className="p-2 hover:bg-slate-100 text-slate-600 rounded flex items-center gap-2 text-sm border-r border-slate-100"
                  >
                    <i className="fa-solid fa-file-code text-indigo-500"></i>
                    .MD
                  </button>
                  <button 
                    onClick={() => downloadFile('txt')}
                    title="テキスト形式で保存"
                    className="p-2 hover:bg-slate-100 text-slate-600 rounded flex items-center gap-2 text-sm"
                  >
                    <i className="fa-solid fa-file-lines text-slate-400"></i>
                    .TXT
                  </button>
                </div>

                <button 
                  onClick={copyToClipboard}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-all ${
                    copyFeedback ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-slate-200 hover:border-indigo-500 hover:text-indigo-600 text-slate-600'
                  }`}
                >
                  <i className={`fa-solid ${copyFeedback ? 'fa-check' : 'fa-copy'}`}></i>
                  {copyFeedback ? 'コピー完了' : 'コピー'}
                </button>

                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all"
                >
                  <i className="fa-solid fa-pen-to-square"></i>
                  編集
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={handleSaveEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm"
                >
                  <i className="fa-solid fa-floppy-disk"></i>
                  変更を保存
                </button>
                <button 
                  onClick={handleCancelEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg text-sm font-medium transition-all"
                >
                  <i className="fa-solid fa-xmark"></i>
                  キャンセル
                </button>
              </div>
            )}
          </div>
        </div>
        <h2 className="text-3xl font-bold text-slate-900 leading-tight">
          {report.query}
        </h2>
        <div className="mt-2 text-slate-400 text-xs flex items-center gap-2">
          <i className="fa-regular fa-clock"></i>
          作成日時: {new Date(report.timestamp).toLocaleString()}
        </div>
      </div>
      
      <div className="p-8">
        {isEditing ? (
          <div className="relative">
            <textarea
              ref={textAreaRef}
              value={editBuffer}
              onChange={(e) => setEditBuffer(e.target.value)}
              className="w-full min-h-[600px] p-6 font-mono text-sm border-2 border-indigo-100 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none bg-slate-50 text-slate-800 leading-relaxed transition-all shadow-inner"
              placeholder="ここにレポートの内容が表示されます。自由に編集してください。"
            />
            <div className="absolute top-2 right-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest pointer-events-none">
              Markdown Editor
            </div>
          </div>
        ) : (
          <div className="prose prose-slate max-w-none markdown-content">
            <div dangerouslySetInnerHTML={{ __html: formatMarkdown(report.content) }} />
          </div>
        )}
      </div>

      {!isEditing && report.sources.length > 0 && (
        <div className="p-8 bg-slate-50 border-t border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-link text-indigo-500"></i>
            Grounding Sources
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.sources.map((source, idx) => (
              <a 
                key={idx}
                href={source.uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all flex items-start gap-3 group"
              >
                <div className="bg-slate-100 text-slate-400 p-2 rounded group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                  <i className="fa-solid fa-earth-americas text-xs"></i>
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="text-sm font-semibold text-slate-800 truncate mb-1">{source.title}</div>
                  <div className="text-[10px] text-slate-400 truncate font-mono">{source.uri}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const LoadingState: React.FC = () => (
  <div className="max-w-4xl mx-auto mt-20 flex flex-col items-center justify-center text-center p-8">
    <div className="relative">
      <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <i className="fa-solid fa-brain text-3xl text-indigo-600 animate-pulse"></i>
      </div>
    </div>
    <h3 className="mt-8 text-xl font-bold text-slate-900">分析レポートを生成しています</h3>
    <p className="mt-2 text-slate-500 max-w-md">
      Google Searchを活用して最新情報を収集し、多角的な視点から詳細なレポートを構成しています。
    </p>
    <div className="mt-8 space-y-3 w-full max-w-xs">
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-500 animate-[loading_2s_ease-in-out_infinite]" style={{width: '40%'}}></div>
      </div>
      <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <span>Searching</span>
        <span>Analyzing</span>
        <span>Reporting</span>
      </div>
    </div>
  </div>
);

const EmptyState: React.FC<{ onSuggest: (q: string) => void }> = ({ onSuggest }) => (
  <div className="max-w-4xl mx-auto mt-20 text-center p-8">
    <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
      <i className="fa-solid fa-wand-magic-sparkles text-4xl text-indigo-500"></i>
    </div>
    <h3 className="text-2xl font-bold text-slate-900 mb-2">何について分析しましょうか？</h3>
    <p className="text-slate-500 max-w-lg mx-auto mb-10">
      最新情報が必要なトピックや、深い考察が必要な事象について入力してください。
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
      {[
        { label: 'Technology', query: 'Gemini 2.0 Flash の新機能と他モデルとの比較' },
        { label: 'Market', query: '日本の宇宙スタートアップ市場の現状と2030年への展望' },
        { label: 'Science', query: '核融合発電の商用化に向けた最新の技術的ブレイクスルー' },
        { label: 'Global', query: '世界的な水不足リスクと各国の先進的な対策技術' }
      ].map((item, idx) => (
        <div 
          key={idx}
          onClick={() => onSuggest(item.query)}
          className="p-5 bg-white border border-slate-200 rounded-2xl text-left hover:border-indigo-400 hover:shadow-lg cursor-pointer transition-all group"
        >
          <p className="text-xs font-bold text-indigo-600 mb-2 uppercase tracking-tight group-hover:text-indigo-700">{item.label}</p>
          <p className="text-slate-700 text-sm font-medium">「{item.query}」</p>
        </div>
      ))}
    </div>
  </div>
);

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem('deep_analyst_reports');
      return {
        reports: saved ? JSON.parse(saved) : [],
        currentReport: null,
        loading: false,
        error: null,
      };
    } catch (e) {
      return { reports: [], currentReport: null, loading: false, error: null };
    }
  });

  useEffect(() => {
    localStorage.setItem('deep_analyst_reports', JSON.stringify(state.reports));
  }, [state.reports]);

  const handleSearch = useCallback(async (query: string) => {
    setState(prev => ({ ...prev, loading: true, error: null, currentReport: null }));
    try {
      const report = await performDeepResearch(query);
      setState(prev => ({
        ...prev,
        reports: [report, ...prev.reports],
        currentReport: report,
        loading: false
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || "予期せぬエラーが発生しました。接続を確認してください。"
      }));
    }
  }, []);

  const selectReport = (report: ResearchReport) => {
    setState(prev => ({ ...prev, currentReport: report, error: null }));
  };

  const deleteReport = (id: string) => {
    if (confirm('このレポートを削除してもよろしいですか？')) {
      setState(prev => {
        const filtered = prev.reports.filter(r => r.id !== id);
        return {
          ...prev,
          reports: filtered,
          currentReport: prev.currentReport?.id === id ? null : prev.currentReport
        };
      });
    }
  };

  const saveReportContent = (id: string, newContent: string) => {
    setState(prev => {
      const updatedReports = prev.reports.map(r => r.id === id ? { ...r, content: newContent } : r);
      const updatedCurrent = prev.currentReport?.id === id ? { ...prev.currentReport, content: newContent } : prev.currentReport;
      return {
        ...prev,
        reports: updatedReports,
        currentReport: updatedCurrent
      };
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          reports={state.reports} 
          onSelect={selectReport} 
          onDelete={deleteReport}
          currentId={state.currentReport?.id} 
        />
        <main className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth bg-slate-50/50">
          <SearchBar onSearch={handleSearch} loading={state.loading} />
          
          {state.error && (
            <div className="max-w-4xl mx-auto mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{state.error}</span>
            </div>
          )}

          {state.loading && <LoadingState />}
          {!state.loading && state.currentReport && (
            <ReportView 
              report={state.currentReport} 
              onSave={saveReportContent}
            />
          )}
          {!state.loading && !state.currentReport && state.reports.length === 0 && (
            <EmptyState onSuggest={handleSearch} />
          )}
          {!state.loading && !state.currentReport && state.reports.length > 0 && (
            <div className="max-w-4xl mx-auto mt-20 text-center opacity-50 p-10 bg-white/50 border-2 border-dashed border-slate-200 rounded-3xl">
              <i className="fa-solid fa-arrow-left text-3xl mb-4 block text-slate-300"></i>
              <p className="text-slate-400 font-medium">左側の履歴からレポートを選択して詳細を表示してください。</p>
            </div>
          )}
        </main>
      </div>
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
};

// Simple Markdown to HTML Formatter
function formatMarkdown(text: string): string {
  if (!text) return '';
  
  let html = text
    .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
    .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-8 mb-4 border-b pb-2 text-indigo-900">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mt-6 mb-3 text-slate-800">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\* (.*$)/gm, '<li class="ml-4 list-disc mb-1">$1</li>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc mb-1">$1</li>')
    // Table handling
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(c => c.trim() !== '');
      if (cells.length === 0) return '';
      return `<tr class="border-b border-slate-100">${cells.map(c => `<td class="p-3 border-r border-slate-100">${c.trim()}</td>`).join('')}</tr>`;
    })
    .replace(/\n\n/g, '<p class="mb-4 leading-relaxed text-slate-700"></p>')
    .replace(/\n/g, '<br />');

  // Lists and Tables Wrap
  html = html.replace(/(<li.*<\/li>)/gs, '<ul class="mb-6 space-y-1">$1</ul>');
  if (html.includes('</td>')) {
    html = `<div class="overflow-x-auto mb-8"><table class="w-full border-collapse border border-slate-200 bg-white rounded-lg shadow-sm">${html}</table></div>`;
  }
  
  return html;
}

export default App;
