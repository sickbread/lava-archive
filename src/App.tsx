import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import Editor from './components/Editor';
import Inspector from './components/Inspector';
import QuickSearch from './components/QuickSearch';
import SpotlightTutorial from './components/TutorialOverlay';
import DatabaseView from './components/DatabaseView';
import ReferenceWindow from './components/ReferenceWindow';
import StatusBar from './components/StatusBar';
import { useNotes } from './hooks/useNotes';
import { useTypewriterAudio } from './hooks/useTypewriterAudio';
import { translations, type Language } from './i18n';
import type { NoteType, LoreNote } from './types';
import { Layers, Database, Edit3, Sidebar as SidebarIcon, Search, ShieldAlert, Trash2 } from 'lucide-react';

function App() {
  // DATA LAYER
  const { notes, relations, addNote, updateNote, deleteNote, addRelation, deleteRelation, clearNotes } = useNotes();
  const { playKeystroke, playShutter } = useTypewriterAudio();

  // UI ENDPOINT STATE (Persisted)
  const [activeNoteId, setActiveNoteId] = useState<string | null>(() => localStorage.getItem('lc-active-note') || null);
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('lc-lang') as Language) || 'KO');
  const [viewMode, setViewMode] = useState<'EDITOR' | 'CANVAS' | 'DATABASE'>(() => (localStorage.getItem('lc-view-mode') as any) || 'CANVAS');
  const [isInspectorOpen, setIsInspectorOpen] = useState(() => localStorage.getItem('lc-inspector-open') !== 'false');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => localStorage.getItem('lc-sidebar-open') !== 'false');


  // RESIZABLE PANELS STATE
  const [sidebarWidth, setSidebarWidth] = useState(() => parseInt(localStorage.getItem('lc-sidebar-width') || '256'));
  const [inspectorWidth, setInspectorWidth] = useState(() => parseInt(localStorage.getItem('lc-inspector-width') || '320'));
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingInspector, setIsResizingInspector] = useState(false);

  // FEATURE STATE (Transient)
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(true); // Forced to true for re-run verification
  const [referenceNote, setReferenceNote] = useState<LoreNote | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<LoreNote | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // PERSISTENCE EFFECTS
  useEffect(() => { if (activeNoteId) localStorage.setItem('lc-active-note', activeNoteId); else localStorage.removeItem('lc-active-note'); }, [activeNoteId]);
  useEffect(() => { localStorage.setItem('lc-lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('lc-view-mode', viewMode); }, [viewMode]);
  useEffect(() => { localStorage.setItem('lc-inspector-open', String(isInspectorOpen)); }, [isInspectorOpen]);
  useEffect(() => { localStorage.setItem('lc-sidebar-open', String(isSidebarOpen)); }, [isSidebarOpen]);
  useEffect(() => { localStorage.setItem('lc-sidebar-width', String(sidebarWidth)); }, [sidebarWidth]);
  useEffect(() => { localStorage.setItem('lc-inspector-width', String(inspectorWidth)); }, [inspectorWidth]);

  // RESIZE HANDLERS
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingSidebar) {
        setSidebarWidth(Math.max(200, Math.min(600, e.clientX)));
        document.body.style.cursor = 'col-resize';
      }
      if (isResizingInspector) {
        setInspectorWidth(Math.max(250, Math.min(600, window.innerWidth - e.clientX)));
        document.body.style.cursor = 'col-resize';
      }
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      setIsResizingInspector(false);
      document.body.style.cursor = 'default';
    };

    if (isResizingSidebar || isResizingInspector) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar, isResizingInspector]);

  // DYNAMIC CATEGORIES STATE (Simple implementation)
  const [categories, setCategories] = useState<{ type: NoteType; label: string; icon: string }[]>([
    { type: 'WORLD', label: lang === 'KO' ? '세계관' : 'World', icon: 'Globe' },
    { type: 'CHARACTER', label: lang === 'KO' ? '캐릭터' : 'Character', icon: 'Users' },
    { type: 'ITEM', label: lang === 'KO' ? '아이템' : 'Item', icon: 'Sword' },
    { type: 'DIALOGUE', label: lang === 'KO' ? '대화록' : 'Dialogue', icon: 'MessageSquare' }
  ]);

  // DERIVED STATE
  const activeNote = notes.find(n => n.id === activeNoteId) || null;
  const t = translations[lang];

  // HANDLERS
  const handleAddNote = (type: string) => {
    const newId = addNote(type);
    setActiveNoteId(newId);
    if (viewMode === 'DATABASE') setViewMode('EDITOR');
  };

  const handleDeleteRequest = (note: LoreNote) => {
    const skip = localStorage.getItem('lc-skip-delete') === 'true';
    if (skip) {
      deleteNote(note);
      if (activeNoteId === note.id) setActiveNoteId(null);
    } else {
      setNoteToDelete(note);
    }
  };

  const handleAddCategory = (label: string) => {
    const type = label.toUpperCase().replace(/\s+/g, '_');
    setCategories(prev => [...prev, { type, label, icon: 'Layers' }]);
  };

  const handleUpdateCategoryIcon = (type: NoteType, newIcon: string) => {
    setCategories(prev => prev.map(cat => cat.type === type ? { ...cat, icon: newIcon } : cat));
  };

  const closeTutorial = () => {
    setIsTutorialOpen(false);
    localStorage.setItem('lc-tutorial-seen', 'true');
  };

  // Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        setLang(prev => prev === 'KO' ? 'EN' : 'KO');
      }
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 1000);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#111] text-gray-300 overflow-hidden font-sans select-none">

      {/* 1. HEADER */}
      <header className="h-10 border-b border-white/20 flex items-center justify-between px-4 bg-[#0a0a0a] z-50 shrink-0">

        <div id="sidebar-toggle-group" className="flex items-center gap-6">
          <button
            onClick={() => {
              setIsSidebarOpen(!isSidebarOpen);
              playKeystroke();
            }}
            className="text-gray-500 hover:text-white transition-colors p-1 rounded hover:bg-white/5"
            title="Toggle Sidebar"
          >
            <SidebarIcon size={16} />
          </button>

          {/* DECORATIVE: System Status Tickers */}
          <div className="hidden lg:flex items-center gap-4 text-[10px] font-mono text-[#333] select-none pointer-events-none">
            <div className="flex flex-col leading-none gap-0.5">
              <span className="tracking-widest">SYS.OP.2024</span>
              <span className="text-[#222]">NORMAL</span>
            </div>
            <div className="h-4 w-px bg-[#222]" />
            <div className="flex items-end gap-1">
              <div className="w-1 h-2 bg-[#222]" />
              <div className="w-1 h-3 bg-[#333]" />
              <div className="w-1 h-1.5 bg-[#222]" />
              <div className="w-1 h-4 bg-[#444]" />
            </div>
          </div>
        </div>

        {/* CENTER: Main Navigation (Wide) */}
        <div className="flex-1 flex justify-center items-center px-4">
          <div id="view-mode-tabs" className="flex items-center bg-black border border-white/20 rounded-sm overflow-hidden shadow-lg transition-all duration-300">
            {(['EDITOR', 'CANVAS', 'DATABASE'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => {
                  setViewMode(mode);
                  playShutter(); // Changed from playReturn to playShutter per user request
                }}
                className={`px-6 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-2 
                  ${viewMode === mode
                    ? 'bg-pm-red text-white shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]'
                    : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}
              >
                {mode === 'EDITOR' && <Edit3 size={12} />}
                {mode === 'CANVAS' && <Layers size={12} />}
                {mode === 'DATABASE' && <Database size={12} />}
                <span className="transition-all duration-300 transform translate-x-0 opacity-100">
                  {mode}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Tools & Toggles */}
        <div className="flex items-center gap-2 relative">

          {/* SEARCH EXPANDER */}
          <div className={`transition-all duration-300 ease-out flex items-center justify-end overflow-visible ${isSearchOpen ? 'w-[400px] md:w-[600px]' : 'w-24'}`}>
            {isSearchOpen ? (
              <div className="w-full relative">
                <QuickSearch
                  isOpen={true}
                  onClose={() => setIsSearchOpen(false)}
                  notes={notes}
                  onSelectNote={(id) => { setActiveNoteId(id); setIsSearchOpen(false); }}
                  lang={lang}
                />
              </div>
            ) : (
              <button
                id="quick-search-trigger"
                onClick={() => {
                  setIsSearchOpen(true);
                  playKeystroke();
                }}
                className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5 whitespace-nowrap"
                title="Global Search (Ctrl+K)"
              >
                <Search size={14} />
                <span className="hidden md:inline text-[10px] font-mono opacity-50">SEARCH</span>
              </button>
            )}
          </div>

          <div className="h-4 w-px bg-white/10 mx-2 shrink-0" />

          {/* LANG TOGGLE */}
          <button
            onClick={() => setLang(lang === 'KO' ? 'EN' : 'KO')}
            className="text-[10px] font-bold font-mono text-gray-500 hover:text-white w-6 h-6 flex items-center justify-center rounded hover:bg-white/5 transition-colors shrink-0"
            title="Switch Language"
          >
            {lang}
          </button>

          {/* INSPECTOR TOGGLE */}
          <button
            onClick={() => {
              setIsInspectorOpen(!isInspectorOpen);
              playKeystroke();
            }}
            className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${isInspectorOpen ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            title="Toggle Inspector"
          >
            <SidebarIcon size={14} className="rotate-180" />
            {isInspectorOpen && <span className="text-[10px] font-bold uppercase tracking-widest">Inspector</span>}
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* SIDEBAR */}
        {isSidebarOpen && (
          <div
            className="flex-shrink-0 flex flex-col border-r border-white/20 transition-none relative group/sidebar bg-black"
            style={{ width: sidebarWidth }}
          >
            <Sidebar
              notes={notes}
              activeNoteId={activeNoteId}
              onSelectNote={setActiveNoteId}
              onAddNote={handleAddNote}
              onDeleteNote={handleDeleteRequest}
              categories={categories}
              onAddCategory={handleAddCategory}
              onUpdateCategoryIcon={handleUpdateCategoryIcon}
              onPurgeData={clearNotes}
              onRestartTutorial={() => setIsTutorialOpen(true)}
              playKeystroke={playKeystroke}
              t={t}
              lang={lang}
            />
            {/* RESIZE HANDLE - V28 didn't have this, but user REQUESTED it. Keep it but invisible/functional only or very subtle. User said "just add functionality". */}
            <div
              className="absolute top-0 right-0 w-1 h-full cursor-col-resize z-50 hover:bg-blue-500/20 transition-colors"
              onMouseDown={() => setIsResizingSidebar(true)}
            />
          </div>
        )}

        {/* CENTRAL STAGE */}
        <main className="flex-1 relative flex flex-col min-w-0 bg-[#111]">
          {viewMode === 'CANVAS' && (
            <Canvas
              notes={notes}
              relations={relations}
              onSelectNote={setActiveNoteId}
              onUpdateNote={updateNote}
              onAddNote={handleAddNote}
              onDeleteNote={handleDeleteRequest}
              onAddRelation={addRelation}
              onDeleteRelation={deleteRelation}
              lang={lang}
              activeNoteId={activeNoteId}
            />
          )}
          {viewMode === 'EDITOR' && (
            <Editor
              note={activeNote}
              onUpdateNote={updateNote}
              notes={notes}
              relations={relations}
              onAddRelation={addRelation}
              onDeleteRelation={deleteRelation}
              onSelectNote={setActiveNoteId}
              t={t}
              lang={lang}
            />
          )}

          {viewMode === 'DATABASE' && (
            <DatabaseView
              notes={notes}
              onUpdateNote={updateNote}
              onSelectNote={(id) => {
                setActiveNoteId(id);
                setViewMode('EDITOR');
              }}
              onDeleteNote={handleDeleteRequest}
              categories={categories}
              t={t}
              lang={lang}
            />
          )}
        </main>

        {/* INSPECTOR */}
        {isInspectorOpen && (
          <div
            id="inspector-panel"
            className="flex-shrink-0 border-l border-white/10 bg-[#080808] transition-none relative group/inspector"
            style={{ width: inspectorWidth }}
          >
            {/* RESIZE HANDLE - V28 CLEAN */}
            <div
              className="absolute top-0 left-0 w-1 h-full cursor-col-resize z-50 hover:bg-blue-500/20 transition-colors"
              onMouseDown={() => setIsResizingInspector(true)}
            />
            <Inspector
              note={activeNote}
              notes={notes}
              onSelectNote={setActiveNoteId}
              t={t}
              lang={lang}
            />
          </div>
        )}
      </div>

      {/* 3. OVERLAYS */}
      <QuickSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        notes={notes}
        onSelectNote={setActiveNoteId}
        lang={lang}
      />

      {isTutorialOpen && (
        <SpotlightTutorial
          onClose={closeTutorial}
          t={t}
        />
      )}

      {referenceNote && (
        <ReferenceWindow
          note={referenceNote}
          onSelectNote={setActiveNoteId}
          onClose={() => setReferenceNote(null)}
          t={t}
          lang={lang}
        />
      )}

      {/* 5. DELETE CONFIRMATION MODAL */}
      {noteToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-pm-dark border border-pm-red p-6 max-w-md w-full shadow-[0_0_30px_rgba(148,27,27,0.5)] transform scale-100 transition-all">
            <h3 className="text-lg font-black text-pm-red uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldAlert size={20} />
              {t.delete_confirm_title}
            </h3>
            <p className="text-sm text-gray-300 mb-6 font-mono leading-relaxed">
              {t.delete_confirm_msg}
            </p>
            <div className="flex items-center gap-2 mb-6 opacity-70 hover:opacity-100 transition-opacity">
              <input
                type="checkbox"
                id="skip-confirm"
                className="accent-pm-red"
                onChange={(e) => {
                  if (e.target.checked) {
                    localStorage.setItem('lc-skip-delete', 'true');
                  } else {
                    localStorage.removeItem('lc-skip-delete');
                  }
                }}
              />
              <label htmlFor="skip-confirm" className="text-[10px] font-mono uppercase tracking-widest text-pm-sepia cursor-pointer select-none">
                {t.delete_skip_confirm}
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setNoteToDelete(null)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white border border-transparent hover:border-gray-600 transition-all font-mono"
              >
                {t.cancel_btn}
              </button>
              <button
                onClick={() => {
                  if (noteToDelete) {
                    deleteNote(noteToDelete);
                    setNoteToDelete(null);
                    if (activeNoteId === noteToDelete.id) setActiveNoteId(null);
                  }
                }}
                className="px-6 py-2 bg-pm-red text-white text-xs font-bold uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg font-mono flex items-center gap-2"
              >
                <Trash2 size={12} />
                {t.delete_confirm_btn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. STATUS BAR */}
      <StatusBar notes={notes} t={t} lang={lang} />

      {/* 6. SAVE FEEDBACK TOAST */}
      <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 bg-pm-gold text-black px-4 py-1 font-black uppercase tracking-widest text-xs z-[10000] pointer-events-none transition-all duration-500 ${isSaving ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        SYSTEM_SAVE_COMPLETE
      </div>
    </div>
  );
}

export default App;
