import React, { useState } from 'react';
import type { LoreNote, NoteType } from '../types';
import { Search, Edit2, Trash2, ShieldAlert, Cpu, Network } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface DatabaseViewProps {
    notes: LoreNote[];
    onUpdateNote: (note: LoreNote) => void;
    onSelectNote: (id: string) => void;
    onDeleteNote: (note: LoreNote) => void;
    categories: { type: NoteType; label: string }[];
    t: any;
    lang: string;
}

const DatabaseView: React.FC<DatabaseViewProps> = ({ notes, onUpdateNote, onDeleteNote, onSelectNote, categories, t, lang }) => {
    const [selectedType, setSelectedType] = useState<NoteType>(categories[0]?.type || 'CHARACTER');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredNotes = notes.filter(n =>
        n.type === selectedType &&
        ((n.title[lang] || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.id.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Get all unique property keys for the current category to use as columns
    const allPropertyKeys = Array.from(new Set(
        filteredNotes.flatMap(n => n.properties.map(p => p.key))
    ));

    const updateProperty = (note: LoreNote, key: string, value: any) => {
        const newProps = [...note.properties];
        const propIdx = newProps.findIndex(p => p.key === key);

        if (propIdx >= 0) {
            newProps[propIdx] = { ...newProps[propIdx], value };
        } else {
            newProps.push({ key, value, type: typeof value === 'number' ? 'number' : 'string' });
        }

        onUpdateNote({ ...note, properties: newProps });
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-pm-black overflow-hidden relative font-sans">
            <div className="paper-texture" />
            <div className="scanline-overlay" />

            {/* HUD DECORATIONS */}
            <div className="absolute top-0 left-0 w-20 h-20 border-t border-l border-pm-red/20 pointer-events-none z-0" />
            <div className="absolute bottom-0 right-0 w-40 h-40 border-b border-r border-pm-red/10 pointer-events-none z-0" />

            {/* HEADER AREA - Tactical */}
            <div className="p-6 border-b border-pm-border bg-pm-dark/80 backdrop-blur-md relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-8 bg-pm-red" />
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-white font-heading leading-tight">
                                {t.database_tab}
                            </h2>
                            <div className="flex items-center gap-3 text-[9px] font-mono text-pm-sepia uppercase tracking-[0.2em] opacity-60">
                                <span className="flex items-center gap-1"><Network size={10} className="text-pm-red" /> SYSTEM_LINK: ACTIVE</span>
                                <span className="flex items-center gap-1"><Cpu size={10} /> AUTH_LEVEL: L3_ACCESS</span>
                                <span className="text-pm-red animate-pulse">● SIGNAL_STABLE</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <div className="text-[9px] font-mono text-gray-600 uppercase">Archive_Search_Matrix</div>
                        <div className="relative group">
                            <div className="absolute inset-0 bg-pm-red/5 border border-pm-red/30 -skew-x-12 group-focus-within:border-pm-red transition-colors" />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pm-red" size={14} />
                            <input
                                type="text"
                                placeholder={t.search_placeholder}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="relative bg-transparent pl-10 pr-4 py-2 text-[10px] font-mono tracking-widest text-pm-sepia focus:outline-none w-72 uppercase placeholder-gray-800"
                            />
                        </div>
                    </div>
                </div>

                {/* CATEGORY SWITCHERS - Terminal Tabs */}
                <div className="flex items-center gap-px bg-pm-border/20 p-px">
                    {categories.map(cat => (
                        <button
                            key={cat.type}
                            onClick={() => setSelectedType(cat.type)}
                            className={cn(
                                "relative px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all overflow-hidden flex-1",
                                selectedType === cat.type
                                    ? "text-white bg-pm-red"
                                    : "text-pm-sepia bg-pm-black hover:bg-pm-dark hover:text-gray-200"
                            )}
                        >
                            {selectedType === cat.type && (
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-white opacity-50" />
                            )}
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* DATA GRID AREA */}
            <div className="flex-1 overflow-auto p-0 relative group/grid">
                <div className="absolute inset-0 pointer-events-none border-[1px] border-pm-red/5 m-4 z-0" />

                <table className="w-full border-collapse relative z-10 min-w-[1000px]">
                    <thead>
                        <tr className="bg-[#0c0c0c] border-b border-pm-border">
                            <th className="p-4 text-[9px] font-bold uppercase text-pm-sepia tracking-[0.2em] border-r border-pm-border/30 w-16 text-center">SEQ</th>
                            <th className="p-4 text-[9px] font-bold uppercase text-pm-sepia tracking-[0.2em] border-r border-pm-border/30 w-48">IDENTIFIER</th>
                            <th className="p-4 text-[9px] font-bold uppercase text-pm-sepia tracking-[0.2em] border-r border-pm-border/30">MASTER_TITLE</th>
                            {allPropertyKeys.map(key => (
                                <th key={key} className="p-4 text-[9px] font-bold uppercase text-pm-red/70 tracking-[0.2em] border-r border-pm-border/30 min-w-[150px]">
                                    {key}
                                </th>
                            ))}
                            <th className="p-4 text-[9px] font-bold uppercase text-pm-sepia tracking-[0.2em] w-24">COMMANDS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-pm-border/20">
                        {filteredNotes.map((note, idx) => (
                            <tr key={note.id} className="hover:bg-pm-red/5 transition-all group/row bg-black/40">
                                <td className="p-4 font-mono text-[10px] text-gray-700 border-r border-pm-border/10 text-center">
                                    [{String(idx + 1).padStart(2, '0')}]
                                </td>
                                <td className="p-4 font-mono text-[10px] text-pm-sepia tracking-widest border-r border-pm-border/10">
                                    {note.id}
                                </td>
                                <td className="p-4 border-r border-pm-border/10">
                                    <input
                                        type="text"
                                        value={note.title[lang] || ''}
                                        onChange={(e) => onUpdateNote({ ...note, title: { ...note.title, [lang]: e.target.value } })}
                                        className="bg-transparent text-xs font-bold text-white uppercase focus:outline-none focus:bg-pm-red/10 w-full px-2 py-1 transition-colors"
                                    />
                                </td>
                                {allPropertyKeys.map(key => {
                                    const prop = note.properties.find(p => p.key === key);
                                    return (
                                        <td key={key} className="p-4 border-r border-pm-border/10">
                                            <input
                                                type={prop?.type === 'number' ? 'number' : 'text'}
                                                value={prop?.value?.toString() ?? ''}
                                                onChange={(e) => updateProperty(note, key, prop?.type === 'number' ? Number(e.target.value) : e.target.value)}
                                                placeholder="[NULL]"
                                                className="bg-transparent text-[11px] font-mono text-pm-gold focus:outline-none focus:bg-pm-black/80 w-full px-2 py-1 placeholder-gray-800"
                                            />
                                        </td>
                                    );
                                })}
                                <td className="p-4">
                                    <div className="flex items-center justify-center gap-3">
                                        <button
                                            onClick={() => onSelectNote(note.id)}
                                            className="p-1.5 text-pm-sepia hover:text-white hover:bg-pm-red/20 border border-transparent hover:border-pm-red/40 transition-all rounded-sm"
                                            title="ACCESS_NODE"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                        <button
                                            onClick={() => onDeleteNote(note)}
                                            className="p-1.5 text-pm-sepia hover:text-pm-red hover:bg-pm-red/10 border border-transparent hover:border-pm-red/40 transition-all rounded-sm"
                                            title="PURGE_RECORD"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredNotes.length === 0 && (
                            <tr>
                                <td colSpan={allPropertyKeys.length + 4} className="p-20 text-center relative overflow-hidden">
                                    <div className="relative z-10 flex flex-col items-center gap-4">
                                        <ShieldAlert size={48} className="text-pm-red/20" />
                                        <div className="text-[11px] font-bold uppercase text-gray-600 tracking-[0.5em] animate-pulse">
                                            DATABASE_ENTRY_MATCH_NULL
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* FOOTER BAR - Tactical Information */}
            <div className="p-2 border-t border-pm-border bg-pm-dark flex items-center justify-between text-[8px] font-mono text-gray-500 uppercase tracking-widest">
                <div className="flex items-center gap-4">
                    <span>SECURE_DATA_MODE</span>
                    <span>ENTRIES: {filteredNotes.length} / {notes.length}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span>MEM_SEQ_BLOCK: {Math.random().toString(16).slice(2, 10).toUpperCase()}</span>
                    <span className="text-pm-red">ENCRYPTION: AES-256</span>
                </div>
            </div>
        </div>
    );
};

export default DatabaseView;
