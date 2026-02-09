import React from 'react';
import type { LoreNote } from '../types';
import { Terminal, Download, Copy, Code, Layers, ArrowRight } from 'lucide-react';

interface InspectorProps {
    note: LoreNote | null;
    notes: LoreNote[];
    onSelectNote: (id: string) => void;
    t: any;
    lang: string;
}

const Inspector: React.FC<InspectorProps> = ({ note, notes, onSelectNote, t, lang }) => {
    const [view, setView] = React.useState<'JSON' | 'CSHARP'>('JSON');
    // Placeholder for visual effect trigger
    const imageRef = React.useRef<HTMLImageElement>(null);

    React.useEffect(() => {
        if (imageRef.current) {
            // Re-trigger reveal animation on note change
            imageRef.current.classList.remove('reveal-img');
            void imageRef.current.offsetWidth; // trigger reflow
            imageRef.current.classList.add('reveal-img');
        }
    }, [note?.id]);

    if (!note) {
        return (
            <div className="h-full bg-pm-charcoal flex flex-col items-center justify-center text-pm-iron w-full border-l border-pm-iron relative overflow-hidden">
                <div className="absolute inset-0 blueprint-grid opacity-10 pointer-events-none" />
                <Terminal size={32} className="animate-pulse" />
                <span className="mt-4 text-xs font-mono uppercase tracking-widest">Awaiting Data Selection...</span>
            </div>
        );
    }

    const jsonSnippet = JSON.stringify(note, null, 2);

    const generateCSharp = (note: LoreNote) => {
        const className = (note.title.EN || note.title.KO || 'Unnamed').replace(/[^a-zA-Z0-9]/g, '');
        const narrative = (note.content[lang] || '').replace(/"/g, '\\"').replace(/\n/g, '\\n');
        return `using System;
using System.Collections.Generic;
using UnityEngine;

// [ARCHIVED BY LAVA_ARCHIVE // EYES ONLY]
[Serializable]
public class ${className}Data : ILoreEntry {
    [SerializeField] private string _id = "${note.id}";
    [SerializeField] private string _title = "${note.title[lang] || ''}";
    [SerializeField] private string _type = "${note.type}";
    [TextArea(5, 10)]
    [SerializeField] private string _narrative = "${narrative}";
    
    // Anomaly Properties
    ${note.properties.map(p => {
            const tsToCsType = { string: 'string', number: 'float', boolean: 'bool' };
            const defaultValue = p.type === 'string' ? `"${p.value}"` : p.value;
            return `public ${tsToCsType[p.type]} ${p.key} = ${defaultValue};`;
        }).join('\n    ')}

    public string GetID() => _id;
    public string GetNarrative() => _narrative;
}

/* 
 * ARCHIVE METADATA
 * Last Updated: ${new Date().toLocaleString()}
 * Reference Count: ${notes.filter(n => n.content[lang]?.includes(`[[${note.title[lang]}]]`)).length}
 */`;
    };

    const handleCopy = () => {
        const text = view === 'JSON' ? jsonSnippet : generateCSharp(note);
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    // BACKLINKS 2.0 ENGINE
    const activeTitle = note.title[lang] || '';

    // Linked Mentions with Context
    const linkedMentions = notes.filter((n: LoreNote) =>
        n.id !== note.id && n.content[lang]?.includes(`[[${activeTitle}]]`)
    ).map(n => {
        const content = n.content[lang] || '';
        const matchIndex = content.indexOf(`[[${activeTitle}]]`);
        // Find sentence boundaries (approximate)
        const start = Math.max(0, content.lastIndexOf('.', matchIndex) + 1);
        const end = content.indexOf('.', matchIndex + activeTitle.length + 4);
        const snippet = content.substring(start, end === -1 ? content.length : end + 1).trim();
        return { note: n, snippet };
    });

    // Unlinked Mentions Logic
    const unlinkedMentions = notes.filter((n: LoreNote) => {
        if (n.id === note.id) return false;
        const content = n.content[lang] || '';
        const hasFormalLink = content.includes(`[[${activeTitle}]]`);
        const hasPlainTitle = content.includes(activeTitle);
        return !hasFormalLink && hasPlainTitle;
    }).map(n => {
        const content = n.content[lang] || '';
        const matchIndex = content.indexOf(activeTitle);
        const start = Math.max(0, content.lastIndexOf('.', matchIndex) + 1);
        const end = content.indexOf('.', matchIndex + activeTitle.length);
        const snippet = content.substring(start, end === -1 ? content.length : end + 1).trim();
        return { note: n, snippet };
    });

    // Connectivity Metrics
    const outboundLinks = (note.content[lang]?.match(/\[\[.*?\]\]/g) || []).length;
    const inboundLinks = linkedMentions.length;
    const centrality = ((inboundLinks / Math.max(1, notes.length)) * 100).toFixed(0);

    return (
        <div className="h-full border-l border-pm-iron bg-pm-graphite flex flex-col relative overflow-hidden w-full shadow-[-10px_0_30px_rgba(0,0,0,1.0)] font-sans">
            {/* HUD Header */}
            <div className="p-3 bg-pm-charcoal border-b border-pm-iron flex items-center justify-between z-10 metal-frame">
                <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-pm-blood animate-pulse" />
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-pm-amber font-mono shadow-red-glow">
                        <span className="text-pm-blood mr-1">■</span>
                        ARCHIVE_READER
                    </h2>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => setView('JSON')}
                        className={`text-[9px] font-bold px-2 py-0.5 border ${view === 'JSON' ? 'bg-pm-blood border-pm-blood text-white' : 'bg-pm-graphite border-pm-iron text-pm-iron hover:text-pm-amber'}`}
                    >
                        JSON
                    </button>
                    <button
                        onClick={() => setView('CSHARP')}
                        className={`text-[9px] font-bold px-2 py-0.5 border ${view === 'CSHARP' ? 'bg-pm-blood border-pm-blood text-white' : 'bg-pm-graphite border-pm-iron text-pm-iron hover:text-pm-amber'}`}
                    >
                        C#
                    </button>
                </div>
            </div>

            {/* VISUAL FRAME (IMAGE SLOT) */}
            <div className="p-4 bg-pm-graphite border-b border-pm-iron flex justify-center relative bg-[url('/grid_noise.png')]">
                <div className="w-full aspect-video bg-black/80 border-2 border-pm-iron relative overflow-hidden group metal-frame">
                    {/* Placeholder for Image - In future this will be the Drop Target */}
                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 text-pm-iron/30 pointer-events-none group-hover:text-pm-blood/50 transition-colors">
                        {!note.imageUrl && (
                            <>
                                <div className="w-12 h-12 border border-dashed border-current flex items-center justify-center overflow-hidden relative">
                                    <span className="text-2xl font-thin">+</span>
                                </div>
                                <span className="text-[9px] font-mono tracking-widest uppercase">Visual Reference Void</span>
                            </>
                        )}
                        {note.imageUrl && (
                            <img
                                src={note.imageUrl}
                                ref={imageRef}
                                alt="Visual Reference"
                                className="absolute inset-0 w-full h-full object-cover reveal-img opacity-80 mix-blend-screen"
                            />
                        )}
                    </div>
                    {/* Scanner Line Effect */}
                    <div className="absolute top-0 w-full h-[2px] bg-pm-blood/50 shadow-[0_0_10px_#9B0000] animate-[scanline_3s_linear_infinite] opacity-50" />

                    {/* Corner Decorators */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-pm-amber" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-pm-amber" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-pm-amber" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-pm-amber" />
                </div>
            </div>

            {/* CONNECTIVITY METRICS HV */}
            <div className="p-3 grid grid-cols-3 gap-2 bg-pm-charcoal border-b border-pm-iron">
                <div className="flex flex-col text-center">
                    <span className="text-[8px] text-[#DAC5A0]/80 uppercase font-bold tracking-wider opacity-50">Inbound</span>
                    <span className="text-lg font-black text-[#B22222] font-mono">{inboundLinks}</span>
                </div>
                <div className="flex flex-col text-center border-x border-pm-iron/30">
                    <span className="text-[8px] text-[#DAC5A0]/80 uppercase font-bold tracking-wider opacity-50">Outbound</span>
                    <span className="text-lg font-black text-gray-400 font-mono">{outboundLinks}</span>
                </div>
                <div className="flex flex-col text-center">
                    <span className="text-[8px] text-[#DAC5A0]/80 uppercase font-bold tracking-wider opacity-50">Centrality</span>
                    <span className="text-lg font-black text-pm-amber font-mono">{centrality}%</span>
                </div>
            </div>

            {/* Output Stream - Balanced Flex */}
            <div className="flex-[2] overflow-y-auto p-3 bg-pm-graphite font-mono scrollbar-thumb-pm-iron scrollbar-track-pm-graphite border-b border-pm-iron relative min-h-[120px]">
                <div className="absolute inset-0 blueprint-grid opacity-5 pointer-events-none" />
                <div className="flex items-center gap-2 mb-2 text-[9px] text-pm-amber/50 opacity-80 z-10 relative">
                    <Code size={10} />
                    <span className="tracking-widest font-bold">DATA_STREAM // {view}</span>
                </div>
                <pre className="text-[10px] text-pm-amber leading-tight whitespace-pre-wrap break-all font-mono opacity-90 bg-black/50 p-3 border border-pm-iron/50 shadow-inner relative z-10 selection:bg-pm-blood selection:text-white">
                    {view === 'JSON' ? jsonSnippet : generateCSharp(note)}
                </pre>
            </div>

            {/* Enhanced Mentions Section - Static height or flexible without forced scroll */}
            <div className="flex-[1.5] bg-black/60 p-3 overflow-y-auto scrollbar-hide border-b border-pm-iron/20">
                <div className="flex items-center gap-2 mb-3 border-b border-pm-border/20 pb-1">
                    <Layers size={10} className="text-[#B22222]" />
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-[#DAC5A0] opacity-50 font-heading">Reference Analysis</h3>
                </div>

                {/* Linked Mentions */}
                <div className="mb-4">
                    <div className="text-[8px] text-pm-red uppercase tracking-widest mb-2 font-bold opacity-70">Linked Content</div>
                    <div className="space-y-2">
                        {linkedMentions.map(({ note: bn, snippet }, idx) => (
                            <button
                                key={`linked-${idx}`}
                                onClick={() => onSelectNote(bn.id)}
                                className="w-full text-left p-2 bg-white/5 border border-pm-border/10 hover:border-pm-red/30 hover:bg-white/10 transition-all group flex flex-col gap-1"
                            >
                                <div className="flex items-center justify-between w-full">
                                    <span className="text-[9px] font-bold text-gray-300 truncate">{bn.title[lang] || bn.id}</span>
                                    <ArrowRight size={8} className="text-pm-red opacity-0 group-hover:opacity-100" />
                                </div>
                                <div className="text-[8px] text-pm-sepia leading-snug italic line-clamp-2 opacity-60">
                                    ...{snippet}...
                                </div>
                            </button>
                        ))}
                        {linkedMentions.length === 0 && (
                            <div className="text-[8px] italic text-gray-800 uppercase p-2 border border-dashed border-white/5">NO_FORMAL_LINKS</div>
                        )}
                    </div>
                </div>

                {/* Unlinked Mentions */}
                <div>
                    <div className="text-[8px] text-pm-gold uppercase tracking-widest mb-2 font-bold opacity-70">Unlinked Mentions</div>
                    <div className="space-y-2">
                        {unlinkedMentions.map(({ note: bn, snippet }, idx) => (
                            <button
                                key={`unlinked-${idx}`}
                                onClick={() => onSelectNote(bn.id)}
                                className="w-full text-left p-2 bg-pm-gold/5 border border-pm-border/10 hover:border-pm-gold/30 hover:bg-pm-gold/10 transition-all group flex flex-col gap-1"
                            >
                                <div className="flex items-center justify-between w-full">
                                    <span className="text-[9px] font-bold text-pm-gold opacity-80 truncate">{bn.title[lang] || bn.id}</span>
                                    <ArrowRight size={8} className="text-pm-gold opacity-0 group-hover:opacity-100" />
                                </div>
                                <div className="text-[8px] text-pm-sepia leading-snug italic line-clamp-2 opacity-60">
                                    ...{snippet}...
                                </div>
                            </button>
                        ))}
                        {unlinkedMentions.length === 0 && (
                            <div className="text-[8px] italic text-gray-800 uppercase p-2 border border-dashed border-white/5">NO_POTENTIAL_MENTIONS</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="p-3 space-y-2 border-t border-pm-border/30 bg-pm-black flex-shrink-0">
                <button
                    onClick={handleCopy}
                    className="w-full flex items-center justify-center gap-2 industrial-button text-[9px] py-1 border-opacity-50"
                >
                    <Copy size={10} /> {t.copy_clipboard}
                </button>
                <button
                    onClick={() => {
                        const text = view === 'JSON' ? jsonSnippet : generateCSharp(note);
                        const blob = new Blob([text], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${(note.title[lang] || 'note').replace(/[^a-z0-9]/gi, '_')}.${view === 'JSON' ? 'json' : 'cs'}`;
                        a.click();
                        URL.revokeObjectURL(url);
                    }}
                    className="w-full flex items-center justify-center gap-2 industrial-button bg-pm-red/10 text-pm-red border-pm-red/50 text-[9px] py-1 hover:bg-pm-red hover:text-white"
                >
                    <Download size={10} /> {t.export_unity}
                </button>
            </div>
        </div>
    );
};

export default Inspector;
