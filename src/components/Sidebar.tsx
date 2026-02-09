import React from 'react';
import {
    Plus,
    Database,
    Trash2,
    Globe,
    Users,
    Sword,
    MessageSquare,
    Layers,
    Activity,
    LogOut,
    Book,
    Skull,
    Crown,
    FlaskConical,
    Zap,
    Shield,
    Music,
    Map,
    Ghost,
    Barcode,
} from 'lucide-react';
import type { LoreNote, NoteType } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface SidebarProps {
    notes: LoreNote[];
    activeNoteId: string | null;
    onSelectNote: (id: string) => void;
    onAddNote: (type: NoteType) => void;
    onDeleteNote: (note: LoreNote) => void;
    categories: { type: NoteType; label: string; icon: string }[];
    onAddCategory: (label: string) => void;
    onRestartTutorial: () => void;
    onUpdateCategoryIcon: (type: NoteType, icon: string) => void;
    playKeystroke: () => void;
    onPurgeData: () => void;
    t: any;
    lang: string;
}

const Sidebar: React.FC<SidebarProps> = ({ notes, activeNoteId, onSelectNote, onAddNote, onDeleteNote, categories, onAddCategory, onUpdateCategoryIcon, onRestartTutorial, playKeystroke, onPurgeData, t, lang }) => {
    const [newCategoryName, setNewCategoryName] = React.useState('');
    const [editingIconCategory, setEditingIconCategory] = React.useState<string | null>(null);

    const availableIcons: Record<string, React.ReactNode> = {
        Globe: <Globe size={20} />,
        Users: <Users size={20} />,
        Sword: <Sword size={20} />,
        MessageSquare: <MessageSquare size={20} />,
        Layers: <Layers size={20} />,
        Book: <Book size={20} />,
        Skull: <Skull size={20} />,
        Crown: <Crown size={20} />,
        FlaskConical: <FlaskConical size={20} />,
        Zap: <Zap size={20} />,
        Shield: <Shield size={20} />,
        Music: <Music size={20} />,
        Map: <Map size={20} />,
        Ghost: <Ghost size={20} />
    };

    const getCategoryIcon = (iconName: string) => {
        return availableIcons[iconName] || <Layers size={20} />;
    };

    // Helper for 2-digit index
    const formatIndex = (i: number) => (i + 1).toString().padStart(2, '0');

    return (
        // Vignette Background: Gradient top to darker bottom
        <div className="h-full bg-gradient-to-b from-pm-graphite to-[#050505] border-r border-[#1A1A1A] flex flex-col relative overflow-hidden w-full font-mono antialiased" style={{ textRendering: 'optimizeLegibility' }}>

            {/* Header - ARCHIVAL VAULT Signature */}
            <div className="p-4 border-b border-[#3A3A3A] bg-transparent flex flex-col gap-2 flex-shrink-0 relative z-10">
                <div className="flex items-center gap-3 cursor-default group">
                    {/* Badge Icon */}
                    <div className="relative flex items-center justify-center w-8 h-8 border border-[#B22222]/30 bg-[#B22222]/5">
                        <Shield size={18} className="text-[#B22222]" />
                        <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#B22222]" />
                    </div>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            {/* Stamped Name */}
                            <div className="px-2 py-0.5 border border-[#DAC5A0]/40 bg-[#DAC5A0]/5">
                                <h1 className="text-[12px] font-black tracking-[0.25em] uppercase text-[#DAC5A0]">
                                    LAVA<span className="text-[#B22222]">.</span>ARCHIVE
                                </h1>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-1 px-1">
                            <span className="text-[7px] text-[#555] font-black tracking-widest uppercase">Clearance: Eyes_Only</span>
                            <span className="text-[7px] text-[#B22222] font-black tracking-tighter ml-2">ID: ███-77-9</span>
                        </div>
                    </div>
                </div>

                {/* Sub-Metadata Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <button
                        onClick={onPurgeData}
                        className="flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity group"
                    >
                        <Barcode size={10} className="text-[#DAC5A0] group-hover:text-[#B22222]" />
                        <span className="text-[8px] text-[#DAC5A0] font-bold tracking-tight group-hover:text-[#B22222]">PURGE_ARCHIVE</span>
                    </button>
                    <div className="text-[8px] text-pm-amber font-black tracking-tighter opacity-40">V1.1.GENESIS</div>
                </div>
            </div>

            <div id="sidebar-category-list" className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-[#222] scrollbar-track-transparent">
                {categories.map((category, index) => (
                    <div key={category.type} className="mb-2">
                        {/* Tapered Line Separator (Top of section) */}
                        {index > 0 && (
                            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#444] to-transparent mb-2 opacity-80" />
                        )}

                        {/* Category Header */}
                        <div className="relative pl-4 pr-4 py-3 group">
                            <div className="flex items-center justify-between transition-colors">
                                {/* Text + Index */}
                                <h3 className="text-[12px] font-medium text-[#E6D69C] uppercase tracking-[1.2px] flex items-center gap-3 transition-colors relative">
                                    <span
                                        className="text-[#E6D69C] hover:text-white transition-colors opacity-80 decoration-slice cursor-pointer hover:scale-110 active:scale-95 duration-200"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingIconCategory(editingIconCategory === category.type ? null : category.type);
                                        }}
                                        title="Change Icon"
                                    >
                                        {getCategoryIcon(category.icon)}
                                    </span>

                                    {/* ICON PICKER POPOVER */}
                                    {editingIconCategory === category.type && (
                                        <div className="absolute top-6 left-0 z-50 bg-[#111] border border-[#333] shadow-xl p-2 rounded grid grid-cols-4 gap-2 w-[160px]">
                                            {/* Backdrop to close */}
                                            <div
                                                className="fixed inset-0 z-[-1] cursor-default"
                                                onClick={(e) => { e.stopPropagation(); setEditingIconCategory(null); }}
                                            />
                                            {Object.entries(availableIcons).map(([name, icon]) => (
                                                <button
                                                    key={name}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onUpdateCategoryIcon(category.type, name);
                                                        setEditingIconCategory(null);
                                                    }}
                                                    className={cn(
                                                        "p-1.5 rounded hover:bg-white/10 transition-colors flex items-center justify-center",
                                                        category.icon === name ? "text-pm-red bg-white/5" : "text-gray-400 hover:text-white"
                                                    )}
                                                    title={name}
                                                >
                                                    {React.cloneElement(icon as React.ReactElement, { size: 16 })}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <span style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.8)' }}>
                                        {category.label}
                                    </span>
                                    {/* Index Number usually small gold */}
                                    <span className="text-[8px] text-[#D4AF37] opacity-60 ml-1 font-bold tracking-widest">
                                        {formatIndex(index)}
                                    </span>
                                </h3>
                                <button
                                    onClick={() => {
                                        onAddNote(category.type);
                                        playKeystroke();
                                    }}
                                    className="text-pm-iron hover:text-[#D1D1D1] transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Notes List */}
                        <div className="mt-0 space-y-1 pl-4">
                            {notes.filter(n => n.type === category.type).map(note => {
                                const isActive = activeNoteId === note.id;
                                return (
                                    <div
                                        key={note.id}
                                        onClick={() => {
                                            onSelectNote(note.id);
                                            playKeystroke();
                                        }}
                                        className={cn(
                                            "group flex items-center justify-between px-3 py-2 cursor-pointer transition-all relative overflow-hidden tracking-[0.5px] mx-0 rounded-sm",
                                            isActive
                                                ? "bg-[#2A0000]/10" // 10% Deep Red BG
                                                : "text-[#8F8870] hover:text-[#E6D69C]" // Muted Gold-Gray -> Pale Gold Hover
                                        )}
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden ml-1 w-full relative">
                                            {/* Note Icon - Click to Select/Change */}
                                            <div className={cn(
                                                "shrink-0 transition-colors duration-300",
                                                isActive ? "text-pm-red" : "text-[#555] group-hover:text-[#E6D69C]"
                                            )}>
                                                {React.isValidElement(getCategoryIcon(category.icon))
                                                    ? React.cloneElement(getCategoryIcon(category.icon) as React.ReactElement, { size: 12 })
                                                    : <Layers size={12} />
                                                }
                                            </div>

                                            {/* Active Brackets & Text */}
                                            {isActive ? (
                                                <div className="flex items-center w-full">
                                                    <span className="text-[#CC0000] font-thin mr-2 opacity-80 text-[10px] animate-pulse">▐</span>
                                                    <span
                                                        className="text-[#D4AF37] font-bold font-mono tracking-widest truncate flex-1 text-sm pl-2 border-l border-[#CC0000]/30"
                                                        style={{ textShadow: '0 0 10px rgba(212, 175, 55, 0.2)' }}
                                                    >
                                                        {note.title[lang] || 'Untitled'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[11px] truncate font-medium tracking-wide transition-colors">
                                                    {note.title[lang] || 'Untitled'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Trash Icon */}
                                        {isActive && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDeleteNote(note); }}
                                                className="absolute right-2 opacity-0 group-hover:opacity-100 text-[#555] hover:text-[#CC0000] transition-colors bg-black/50 px-1 rounded"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                            {/* "No items" */}
                            {notes.filter(n => n.type === category.type).length === 0 && (
                                <div className="px-3 py-2 text-[10px] text-[#333] tracking-wider font-medium ml-2 italic opacity-50">
                                    {t.no_entries}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Add Category */}
                <div id="sidebar-add-category" className="p-4 border-t border-[#2A2A2A] mt-2 bg-transparent text-center">
                    <div className="relative inline-block w-full">
                        <input
                            type="text"
                            placeholder={t.add_category}
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newCategoryName.trim()) {
                                    onAddCategory(newCategoryName);
                                    setNewCategoryName('');
                                }
                            }}
                            className="w-full bg-[#111] border border-[#333] px-3 py-2 text-[10px] text-[#D1D1D1] placeholder-[#444] focus:outline-none focus:border-[#D4AF37] transition-colors rounded-none font-mono uppercase tracking-widest font-semibold text-center"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#444]">
                            <Plus size={10} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            {/* Footer - Tactical System Monitor */}
            <div className="p-4 bg-[#0a0a0a] border-t border-[#333] relative overflow-hidden flex flex-col gap-3">
                {/* Background Grid for Footer */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '10px 10px' }} />

                {/* Status Row */}
                <div className="flex items-center justify-between z-10">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-[#666] font-mono uppercase tracking-widest mb-0.5">System Status</span>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-[#CC0000] rounded-full animate-pulse shadow-[0_0_5px_#FF0000]" />
                            <span className="text-[#D4AF37] font-bold font-mono text-xs tracking-wider">OPERATIONAL</span>
                        </div>
                    </div>
                    {/* Decorative Hex */}
                    <Activity className="text-[#333]" size={16} />
                </div>

                {/* Progress Bar Decoration */}
                <div className="w-full h-1 bg-[#111] overflow-hidden flex gap-0.5">
                    <div className="h-full w-1/3 bg-[#CC0000] opacity-60" />
                    <div className="h-full w-1/4 bg-[#D4AF37] opacity-60" />
                    <div className="h-full w-full bg-[#333] opacity-40" />
                </div>

                {/* Reboot Button with Guide Text */}
                <div className="flex flex-col gap-2">
                    <span className="text-[8px] text-[#444] font-mono uppercase tracking-[0.2em] animate-pulse">
                        [ Info: Click below to re-initialize system protocol ]
                    </span>
                    <button
                        id="reboot-protocol-trigger"
                        onClick={onRestartTutorial}
                        className="group flex items-center justify-between w-full px-3 py-2 border border-[#333] bg-[#050505] hover:bg-[#CC0000]/10 hover:border-[#CC0000] transition-all text-left"
                    >
                        <span className="text-[10px] text-[#888] group-hover:text-white font-mono uppercase tracking-wider">
                            Reboot Protocol
                        </span>
                        <LogOut size={12} className="text-[#555] group-hover:text-[#CC0000] transition-colors" />
                    </button>
                </div>

                {/* Version ID */}
                <div className="flex justify-between items-end border-t border-[#222] pt-2">
                    <span className="text-[8px] text-[#444] font-mono">V.0.9.84-BETA</span>
                    <span className="text-[8px] text-[#333] font-mono">LOBOTOMY_CORP_OS</span>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
