import React, { useEffect } from 'react';
import type { LoreNote, Property, Relationship } from '../types';
import { Edit3, Layers, Plus, Trash2, Image as ImageIcon, Volume2, VolumeX, ChevronUp, Settings, Crosshair, Scan } from 'lucide-react';
import { useTypewriterAudio } from '../hooks/useTypewriterAudio';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface EditorProps {
    note: LoreNote | null;
    onUpdateNote: (note: LoreNote) => void;
    notes: LoreNote[];
    onSelectNote: (noteId: string) => void;
    relations: Relationship[];
    onAddRelation: (from: string, to: string) => void;
    onDeleteRelation: (id: string) => void;
    t: any;
    lang: string;
}

const getCaretCoordinates = (element: HTMLTextAreaElement, position: number) => {
    const div = document.createElement('div');
    const style = window.getComputedStyle(element);
    const properties = [
        'direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
        'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
        'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'fontSizeAdjust', 'lineHeight', 'fontFamily', 'textAlign', 'textTransform', 'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing', 'tabSize', 'MozTabSize'
    ];
    properties.forEach(prop => {
        // @ts-ignore
        div.style[prop] = style[prop];
    });
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    div.style.overflow = 'hidden';
    div.textContent = element.value.substring(0, position);
    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    div.appendChild(span);
    document.body.appendChild(div);
    const coordinates = {
        top: span.offsetTop + parseInt(style.borderTopWidth),
        left: span.offsetLeft + parseInt(style.borderLeftWidth),
        height: parseInt(style.lineHeight)
    };
    document.body.removeChild(div);
    return coordinates;
};

const Editor: React.FC<EditorProps> = ({ note, onUpdateNote, notes, onSelectNote, relations, onAddRelation, onDeleteRelation, t, lang }) => {
    const [showPicker, setShowPicker] = React.useState(false);
    const [pickerPos, setPickerPos] = React.useState({ top: 0, left: 0 });
    const [pickerQuery, setPickerQuery] = React.useState('');
    const [isKeyVisualOpen, setIsKeyVisualOpen] = React.useState(false);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const [newPropKey, setNewPropKey] = React.useState('');
    const [newPropValue, setNewPropValue] = React.useState('');
    const { playKeystroke, playReturn, playSpace, playDelete, playShutter, toggleMute, muted } = useTypewriterAudio();
    const [isTyping, setIsTyping] = React.useState(false);

    const [vibrate, setVibrate] = React.useState(false);
    const [isReadMode, setIsReadMode] = React.useState(false);

    // Auto-open key visual if image exists
    React.useEffect(() => {
        if (note?.imageUrl) {
            setIsKeyVisualOpen(true);
        }
    }, [note?.id]);

    // SYNC LINKS LOGIC (Restored)
    useEffect(() => {
        if (!note) return;
        const content = note.content[lang] || '';
        const regex = /\[\[(.*?)\]\]/g;
        const matches = [];
        let match;
        while ((match = regex.exec(content)) !== null) {
            matches.push(match[1]);
        }

        const targetIds = matches.map(title => {
            const target = notes.find(n => n.title[lang] === title); // Match by title
            return target ? target.id : null;
        }).filter(id => id !== null) as string[];

        const uniqueTargetIds = [...new Set(targetIds)]; // Dedupe in text

        // Get current outgoing relations
        const currentOutgoing = relations.filter(r => r.fromNodeId === note.id);
        const currentTargetIds = currentOutgoing.map(r => r.toNodeId);

        // 1. Add new relations
        uniqueTargetIds.forEach(targetId => {
            if (!currentTargetIds.includes(targetId)) {
                onAddRelation(note.id, targetId);
            }
        });

        // 2. Remove obsolete relations (Strict Sync for 'LINK' types)
        // If a relation exists but is NOT in the text matches, remove it.
        // NOTE: We only remove relations that are likely text-based.
        // Since we don't have 'type' in relation, we assume all outgoing from this note are managed by text for now.
        // To be safe, maybe only remove if we are sure? The user asked for "Data Structure Synchronization".
        // Let's implement strict sync for now: Text is Truth.
        currentOutgoing.forEach(rel => {
            if (!uniqueTargetIds.includes(rel.toNodeId)) {
                onDeleteRelation(rel.id);
            }
        });

    }, [note?.content, lang, notes, relations]); // Dependency on content and relations to sync

    if (!note) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-pm-black/50 text-pm-border relative overflow-hidden font-mono">
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <Layers size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest opacity-20">Awaiting Decryption Key...</p>
                <div className="stamp-restricted opacity-5">RESTRICTED</div>
            </div>
        );
    }

    const filteredPickerNotes = notes.filter((n: LoreNote) =>
        (n.title[lang] || '').toLowerCase().includes(pickerQuery.toLowerCase()) && n.id !== note.id
    );

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        const caretPos = e.target.selectionStart;
        onUpdateNote({ ...note, content: { ...note.content, [lang]: val } });

        // Check for [[ trigger
        const lastTwo = val.substring(caretPos - 2, caretPos);
        if (lastTwo === '[[' && caretPos >= 2) {
            const coords = getCaretCoordinates(e.target, caretPos);
            const rect = e.target.getBoundingClientRect();
            // Calculate absolute position
            const top = rect.top + coords.top - e.target.scrollTop;
            const left = rect.left + coords.left - e.target.scrollLeft;

            setShowPicker(true);
            setPickerPos({ top, left });
            setPickerQuery('');
        } else if (showPicker) {
            const lastTriggerIndex = val.lastIndexOf('[[', caretPos - 1);
            if (lastTriggerIndex === -1 || lastTriggerIndex < caretPos - 20) {
                setShowPicker(false);
            } else {
                const textSinceTrigger = val.substring(lastTriggerIndex + 2, caretPos);
                if (textSinceTrigger.includes(' ') || textSinceTrigger.includes('\n')) {
                    setShowPicker(false);
                } else {
                    setPickerQuery(textSinceTrigger);
                    // Update position dynamically as we type? 
                    // Ideally yes, but let's keep it simple for now or update it here too if needed.
                    // For now, initial trigger position is usually fine for a short query.
                }
            }
        }
    };

    const insertLink = (linkedNote: LoreNote) => {
        const caretPos = textareaRef.current?.selectionStart || 0;
        const currentContent = note.content[lang] || '';
        const lastTriggerIndex = currentContent.lastIndexOf('[[', caretPos - 1);
        const before = currentContent.substring(0, lastTriggerIndex);
        const after = currentContent.substring(caretPos);
        onUpdateNote({
            ...note,
            content: { ...note.content, [lang]: `${before}[[${linkedNote.title[lang]}]]${after}` }
        });
        setShowPicker(false);
        // Focus back to textarea
        textareaRef.current?.focus();
    };


    const handleAddProperty = () => {
        if (!newPropKey || !newPropValue) return;
        const newProperty: Property = { key: newPropKey, value: newPropValue, type: 'string' };
        onUpdateNote({ ...note, properties: [...note.properties, newProperty] });
        setNewPropKey('');
        setNewPropValue('');
    };

    const handleDeleteProperty = (index: number) => {
        const newProperties = note.properties.filter((_, i) => i !== index);
        onUpdateNote({ ...note, properties: newProperties });
    };

    return (
        <div className={cn(
            "flex-1 flex flex-col h-full bg-[#050505] overflow-y-auto relative font-sans scrollbar-hide",
            vibrate && "animate-tactical-vibrate"
        )}>
            {/* Background Dot Pattern (10% Opacity) */}
            <div className="absolute inset-0 pointer-events-none opacity-10 z-0" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '10px 10px' }} />

            {/* Background Stamps */}
            <div className="stamp-restricted opacity-5 hover:opacity-100 transition-opacity">RESTRICTED</div>

            {/* Header - STICKY */}
            <div className="sticky top-0 p-6 pb-2 border-b border-[#222] bg-[#0c0c0c]/95 backdrop-blur-md relative z-30">

                {/* DOC_REF Label System */}
                <div className="flex items-center gap-2 mb-2 font-mono text-[9px] uppercase tracking-widest">
                    <span className="bg-[#1A1A1A] text-[#D4AF37] px-2 py-0.5 rounded-sm opacity-80">
                        DOC_REF: {note.id}
                    </span>
                    <span className="text-[#444]">//</span>
                    <span className="text-[#666]">TS: {Date.now()}</span>
                </div>

                <div className="flex items-center gap-4 mb-2">
                    {/* Red Bar - Tall & Thin (2px) */}
                    <div className="bg-[#CC0000] w-[2px] h-[32px] shadow-[0_0_8px_#FF0000]" />
                    <input
                        type="text"
                        value={note.title[lang] || ''}
                        onChange={(e) => onUpdateNote({ ...note, title: { ...note.title, [lang]: e.target.value } })}
                        className="bg-transparent text-3xl font-bold text-white uppercase tracking-tight w-full focus:outline-none focus:text-[#FF0000] transition-colors font-heading"
                    />
                </div>
                <div className="flex items-center gap-4 pl-0 mt-3 pt-3 border-t border-[#1a1a1a]">
                    {/* ID & TYPE - Sharp Small Rectangles (0.5px line) */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center border border-[#444] px-2 py-0.5 bg-[#0a0a0a]">
                            <span className="text-[9px] text-[#666] font-mono tracking-wider mr-2">ID</span>
                            <span className="text-[9px] text-[#D1D1D1] font-mono font-bold">{note.id.split('-')[1]}</span>
                        </div>
                        <div className="flex items-center border border-[#444] px-2 py-0.5 bg-[#0a0a0a]">
                            <span className="text-[9px] text-[#666] font-mono tracking-wider mr-2">TYPE</span>
                            <span className="text-[9px] text-[#D1D1D1] font-mono font-bold">{note.type}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 ml-auto">
                        <button
                            onClick={() => setIsReadMode(!isReadMode)}
                            className={cn(
                                "text-[9px] px-3 py-1 border transition-all uppercase font-bold font-mono tracking-wider rounded-none relative overflow-hidden flex items-center gap-1 mr-4",
                                isReadMode
                                    ? "bg-[#D4AF37] border-[#D4AF37] text-black hover:bg-[#ffe066]"
                                    : "border-[#333] bg-transparent text-[#555] hover:text-[#D1D1D1] hover:border-[#666]"
                            )}
                        >
                            {isReadMode ? "READING_MODE" : "EDIT_MODE"}
                        </button>

                        {(['IDEA', 'SKETCH', 'LINEART', 'FINAL'] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => onUpdateNote({ ...note, artStatus: status })}
                                className={cn(
                                    "text-[9px] w-[60px] py-1 border transition-all uppercase font-bold font-mono tracking-wider rounded-none relative overflow-hidden",
                                    note.artStatus === status
                                        ? "bg-[#CC0000] border-[#CC0000] text-white"
                                        : "border-[#333] bg-transparent text-[#555] hover:text-[#D1D1D1] hover:border-[#666]"
                                )}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* COLLAPSIBLE ASSET SLOT - Viewfinder Style */}
            <div
                className={cn(
                    "relative flex-shrink-0 transition-all duration-300 ease-in-out border-b border-[#1A1A1A] bg-[#080808] overflow-hidden group/asset z-20 mx-auto mt-6 mb-2",
                    isKeyVisualOpen
                        ? "max-h-[400px] w-full max-w-4xl" // Fixed max height to prevent scroll
                        : "h-[120px] w-[120px] border border-[#222]" // Square when closed
                )}
                onDragOver={(e) => { e.preventDefault(); !isKeyVisualOpen && setIsKeyVisualOpen(true); }}
                onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (re) => {
                            onUpdateNote({ ...note, imageUrl: re.target?.result as string });
                            setIsKeyVisualOpen(true);
                        };
                        reader.readAsDataURL(file);
                    }
                }}
            >
                {/* Inner Viewfinder Container */}
                <div className="relative w-full h-full p-0 flex items-center justify-center">

                    {note.imageUrl ? (
                        /* Expanded / Image Present Mode */
                        isKeyVisualOpen ? (
                            <div className="relative w-full h-full flex items-center justify-center p-2">
                                {/* Gold Corner Brackets - Thin & Sharp */}
                                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#D4AF37] z-10" />
                                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#D4AF37] z-10" />
                                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#D4AF37] z-10" />
                                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#D4AF37] z-10" />

                                <div className="absolute top-2 right-2 z-30 opacity-0 group-hover/asset:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsKeyVisualOpen(false); }}
                                        className="bg-black/80 hover:bg-[#CC0000] text-white p-1 backdrop-blur-md border border-[#333]"
                                    >
                                        <ChevronUp size={14} />
                                    </button>
                                </div>

                                <div
                                    className="relative max-w-full max-h-full cursor-pointer group/image"
                                    onClick={() => playShutter()}
                                >
                                    <img
                                        src={note.imageUrl}
                                        alt="Evidence"
                                        className="max-w-full max-h-[380px] object-contain select-none border border-[#333]"
                                    />
                                    <div className="flex justify-between items-end mt-1 px-1">
                                        <div className="text-[8px] font-mono text-[#666] uppercase tracking-widest">
                                            SCAN_DATA: {note.id}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Collapsed with Image */
                            <div
                                className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-[#CC0000]/5 bg-[#050505] p-1"
                                onClick={() => setIsKeyVisualOpen(true)}
                            >
                                <img
                                    src={note.imageUrl}
                                    className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-500"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Scan size={24} className="text-[#D4AF37] opacity-80" />
                                </div>
                            </div>
                        )
                    ) : (
                        /* Empty State - Square Viewfinder */
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-[#333] group-hover/asset:text-[#CC0000] transition-colors gap-2">
                            <ImageIcon size={24} strokeWidth={1} />
                            <span className="text-[9px] font-mono uppercase tracking-widest opacity-50">Visual Input</span>
                        </div>
                    )}
                </div>
            </div>


            {/* NARRATIVE SECTION */}
            <div className="px-4 md:px-12 pb-24 max-w-4xl mx-auto w-full flex-1 flex flex-col relative h-[500px]">

                {/* Narrative Header */}
                <div className="flex items-center gap-2 mb-4 mt-4 border-b border-[#222] pb-2">
                    {/* Gear Symbol */}
                    <Settings size={10} className="text-[#666]" />
                    <span className="text-[9px] font-bold text-[#666] uppercase tracking-widest">
                        NARRATIVE_RECORD // {lang}
                    </span>
                    <div className={cn("ml-auto text-[9px] font-mono text-[#CC0000] transition-opacity duration-500", isTyping ? "opacity-100" : "opacity-0")}>
                        ● RECORDING
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="relative flex-1 flex flex-col min-h-[400px]">

                    {/* DECRYPTION LINK POPUP (Only in Edit Mode) */}
                    {!isReadMode && showPicker && (
                        <div
                            className="fixed z-50 w-64 bg-black border border-[#333] shadow-2xl flex flex-col font-mono"
                            style={{ top: pickerPos.top + 24, left: pickerPos.left }}
                        >
                            <div className="text-[9px] font-bold text-[#888] p-2 uppercase border-b border-[#333] bg-[#080808]">Decryption Link System</div>
                            <div className="max-h-48 overflow-y-auto">
                                {filteredPickerNotes.map((n: LoreNote) => (
                                    <button
                                        key={n.id}
                                        onClick={() => insertLink(n)}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-[#CC0000] hover:text-white transition-colors flex items-center gap-2 text-gray-400 border-b border-white/5 last:border-0"
                                    >
                                        <span className="text-[10px] opacity-50">{n.id}</span>
                                        {n.title[lang]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {isReadMode ? (
                        /* READING MODE RENDERER */
                        <div
                            className="w-full flex-1 bg-transparent border-none text-[16px] text-[#E0E0E0] font-serif leading-[1.8] tracking-wide py-2 scrollbar-hide relative z-10 select-text whitespace-pre-wrap"
                            style={{ minHeight: '400px' }}
                        >
                            {(note.content[lang] || '').split(/(\[\[.*?\]\])/g).map((part, i) => {
                                if (part.startsWith('[[') && part.endsWith(']]')) {
                                    const title = part.slice(2, -2);
                                    const target = notes.find(n => n.title[lang] === title);
                                    return (
                                        <span
                                            key={i}
                                            className="text-[#D4AF37] hover:text-[#FFD700] hover:underline cursor-pointer font-bold transition-colors"
                                            onClick={() => target && onSelectNote(target.id)}
                                            title={target ? `Jump to: ${title}` : "Unlinked Entity"}
                                        >
                                            {title}
                                        </span>
                                    );
                                }
                                return <span key={i}>{part}</span>;
                            })}
                        </div>
                    ) : (
                        /* EDIT MODE TEXTAREA */
                        <textarea
                            ref={textareaRef}
                            value={note.content[lang] || ''}
                            onChange={(e) => {
                                handleTextChange(e);
                                setIsTyping(true);
                            }}
                            onKeyDown={(e) => {
                                // Audio
                                const k = e.key;
                                if (k === 'Enter') {
                                    playReturn();
                                    setVibrate(true);
                                    setTimeout(() => setVibrate(false), 80);
                                }
                                else if (k === 'Backspace') playDelete();
                                else if (k === ' ') playSpace();
                                else if (k.length === 1 || k === 'Process' || e.nativeEvent.isComposing) {
                                    playKeystroke();
                                }
                            }}
                            placeholder={t.narrative_placeholder}
                            className="w-full flex-1 bg-transparent border-none text-[16px] text-[#E0E0E0] focus:outline-none resize-none font-serif leading-[1.8] tracking-wide placeholder-[#333] selection:bg-[#CC0000]/30 py-2 scrollbar-hide relative z-10 select-text"
                            style={{ height: 'auto', minHeight: '400px' }}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = target.scrollHeight + 'px';
                            }}
                        />
                    )}

                    {/* Faint Barcode Watermark at Bottom of Text Area */}
                    <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none opacity-[0.03] z-0"
                        style={{ backgroundImage: 'repeating-linear-gradient(90deg, #fff, #fff 1px, transparent 1px, transparent 4px, #fff 4px, #fff 5px)' }}
                    />
                </div>


                {/* PROPERTIES - Typewriter Table */}
                <div className="mt-12 mb-20 p-4 border-t border-[#222] relative group/props">
                    <div className="absolute -top-3 left-0 bg-[#050505] pr-2 flex items-center gap-2">
                        <Settings size={10} className="text-[#444]" />
                        <span className="text-[9px] font-bold text-[#444] uppercase tracking-widest">Metadata</span>
                    </div>

                    <div className="w-full max-w-2xl space-y-1 mt-2">
                        {note.properties.map((prop, idx) => (
                            <div key={idx} className="flex items-center text-xs font-mono group/prop hover:bg-[#111] p-1 rounded-sm cursor-default">
                                <div className="w-32 text-[#666] uppercase tracking-wider">{prop.key}</div>
                                <div className="flex-1 text-[#D4AF37]">{prop.value}</div>
                                <button
                                    onClick={() => handleDeleteProperty(idx)}
                                    className="opacity-0 group-hover/prop:opacity-100 text-[#444] hover:text-[#CC0000] ml-2"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}

                        {/* Input Row */}
                        <div className="flex items-center text-xs font-mono opacity-50 hover:opacity-100 transition-opacity mt-2">
                            <input
                                type="text"
                                value={newPropKey}
                                onChange={(e) => setNewPropKey(e.target.value)}
                                placeholder="NEW_METADATA"
                                className="w-32 bg-transparent text-[#666] uppercase tracking-wider focus:outline-none placeholder-[#333]"
                            />
                            <input
                                type="text"
                                value={newPropValue}
                                onChange={(e) => setNewPropValue(e.target.value)}
                                placeholder="VALUE"
                                className="flex-1 bg-transparent text-[#888] focus:outline-none placeholder-[#333]"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddProperty();
                                }}
                            />
                            <button
                                onClick={handleAddProperty}
                                disabled={!newPropKey || !newPropValue}
                                className="text-[#444] hover:text-[#CC0000] disabled:opacity-0"
                            >
                                <Plus size={12} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Audio Control - Floating Bottom Right */}
                <div className="fixed bottom-8 right-8 z-50 opacity-40 hover:opacity-100 transition-opacity">
                    <button
                        onClick={toggleMute}
                        className={cn(
                            "p-2 transition-all border border-[#CC0000] rounded-none text-[#CC0000] hover:bg-[#CC0000] hover:text-white"
                        )}
                        title={muted ? "Enable Audio" : "Disable Audio"}
                    >
                        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
};
export default Editor;
