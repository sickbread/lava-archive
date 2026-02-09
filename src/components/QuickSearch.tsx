import React, { useState, useEffect, useRef } from 'react';
import type { LoreNote } from '../types';
import { Search, FileText, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface QuickSearchProps {
    isOpen: boolean;
    onClose: () => void;
    notes: LoreNote[];
    onSelectNote: (id: string) => void;
    lang: string;
}

const QuickSearch: React.FC<QuickSearchProps> = ({ isOpen, onClose, notes, onSelectNote, lang }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredNotes = notes.filter(n =>
        n.title[lang]?.toLowerCase().includes(query.toLowerCase()) ||
        n.content[lang]?.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 10);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredNotes.length));
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredNotes.length) % Math.max(1, filteredNotes.length));
            }
            if (e.key === 'Enter' && filteredNotes[selectedIndex]) {
                onSelectNote(filteredNotes[selectedIndex].id);
                onClose();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, filteredNotes, selectedIndex, onSelectNote, onClose]);

    return isOpen ? (
        <>
            {/* INVISIBLE DISMISS LAYER */}
            <div
                className="fixed inset-0 z-40 bg-transparent cursor-default"
                onClick={onClose}
            />

            {/* SEARCH CONTAINER (Relative to Parent) */}
            <div className="relative z-50 w-full animate-in fade-in zoom-in-95 duration-200 origin-right">
                <div className="flex items-center px-4 py-1.5 bg-black border border-pm-red shadow-[0_0_15px_rgba(204,0,0,0.3)] rounded-sm">
                    <Search size={14} className="text-pm-red mr-3 opacity-80 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={"SEARCH_QUERY_INITIATED..."}
                        className="flex-1 bg-transparent text-white focus:outline-none placeholder:text-[#555] font-mono uppercase tracking-[0.2em] text-[10px]"
                    />
                    <div className="hidden md:block text-[8px] font-mono text-[#555] border border-white/5 px-2 py-0.5 tracking-widest bg-white/5 rounded">NEURAL_SCAN</div>
                </div>

                {/* DROPDOWN RESULTS */}
                <div className="absolute top-full left-0 right-0 mt-2 bg-black/90 border border-white/10 shadow-2xl backdrop-blur-md max-h-[60vh] overflow-y-auto">
                    {filteredNotes.length > 0 ? (
                        filteredNotes.map((note, idx) => (
                            <button
                                key={note.id}
                                onClick={() => {
                                    onSelectNote(note.id);
                                    onClose();
                                }}
                                className={`w-full text-left px-4 py-3 flex items-center justify-between transition-all group/item border-b border-white/5 last:border-0 ${idx === selectedIndex ? 'bg-white/5 border-l-2 border-l-pm-red' : 'hover:bg-white/[0.02] border-l-2 border-l-transparent'
                                    }`}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={cn("p-1.5 border border-white/5 transition-colors shrink-0", idx === selectedIndex ? "bg-pm-red/20 border-pm-red/40" : "bg-black/20")}>
                                        <FileText size={12} className={idx === selectedIndex ? 'text-white' : 'text-[#555]'} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-white group-hover/item:text-pm-red transition-colors truncate">
                                            {note.title[lang] || note.id}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[7px] text-[#555] font-mono uppercase tracking-tighter shrink-0">{note.id.split('-')[0]}</span>
                                            <span className="text-[7px] text-pm-red/30 px-1 border border-pm-red/10 font-mono shrink-0">{note.type}</span>
                                        </div>
                                    </div>
                                </div>
                                {idx === selectedIndex && (
                                    <div className="flex items-center gap-1 text-[8px] font-mono text-pm-red uppercase tracking-widest shrink-0 ml-2">
                                        OPEN <ArrowRight size={8} />
                                    </div>
                                )}
                            </button>
                        ))
                    ) : (
                        <div className="px-4 py-8 text-center flex flex-col items-center gap-2 text-[#444]">
                            <Search size={16} strokeWidth={1} />
                            <span className="text-[9px] font-mono uppercase tracking-widest">
                                NO_DATA_FOUND
                            </span>
                        </div>
                    )}

                    {/* FOOTER */}
                    <div className="p-2 bg-black border-t border-white/10 flex justify-between items-center text-[7px] font-mono text-[#444] px-4">
                        <div className="flex gap-3">
                            <span><strong className="text-gray-500">↑↓</strong> NAV</span>
                            <span><strong className="text-gray-500">↵</strong> SEL</span>
                        </div>
                        <div className="flex gap-3">
                            <span>count: {filteredNotes.length}</span>
                            <span>ESC: EXIT</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    ) : null;
};

export default QuickSearch;
