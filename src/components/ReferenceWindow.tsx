import React, { useState } from 'react';
import type { LoreNote } from '../types';
import { X, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface ReferenceWindowProps {
    note: LoreNote | null;
    onSelectNote: (id: string) => void;
    onClose: () => void;
    t: any;
    lang: string;
}

const ReferenceWindow: React.FC<ReferenceWindowProps> = ({ note, onSelectNote, onClose, t, lang }) => {
    const [pos, setPos] = useState({ x: window.innerWidth - 350, y: 100 });
    const [isDragging, setIsDragging] = useState(false);

    if (!note) return null;

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.drag-handle')) {
            setIsDragging(true);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPos(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div
            style={{ left: pos.x, top: pos.y }}
            className="fixed z-[60] w-80 bg-pm-dark border-2 border-pm-red shadow-[0_0_20px_rgba(148,27,27,0.4)] flex flex-col overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Header / Drag Handle */}
            <div
                onMouseDown={handleMouseDown}
                className="drag-handle h-8 bg-pm-black border-b border-pm-border flex items-center justify-between px-3 cursor-move select-none"
            >
                <div className="flex items-center gap-2">
                    <ImageIcon size={14} className="text-pm-red" />
                    <h2 className="text-[10px] font-bold uppercase tracking-widest text-white">{t.ref_window}</h2>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-pm-red transition-colors">
                    <X size={14} />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 bg-pm-black flex flex-col gap-4">
                {note.imageUrl ? (
                    <div className="relative group">
                        <div className="absolute inset-0 border-2 border-pm-red/30 -m-1 pointer-events-none" />
                        <img
                            src={note.imageUrl}
                            alt={note.title[lang] || note.id}
                            className="w-full h-auto object-contain bg-pm-dark"
                        />
                        <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => onSelectNote(note.id)}
                                className="bg-pm-red text-white p-1 hover:bg-pm-brightRed"
                                title="Open in Editor"
                            >
                                <ExternalLink size={12} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="h-40 flex flex-col items-center justify-center border border-dashed border-pm-border opacity-30 text-pm-sepia text-xs uppercase italic">
                        <ImageIcon size={24} className="mb-2" />
                        No illustration attached
                    </div>
                )}

                <div className="border-t border-pm-border pt-3">
                    <div className="text-[9px] uppercase font-bold text-pm-red mb-1">{t.ref_snippet}</div>
                    <div className="text-[10px] text-gray-400 line-clamp-3 italic">
                        {note.content[lang] || "No narrative established..."}
                    </div>
                </div>
            </div>

            <div className="h-4 bg-pm-red px-2 flex items-center justify-end">
                <div className="text-[8px] font-mono text-white opacity-80">REF_ID: {note.id}</div>
            </div>
        </div>
    );
};

export default ReferenceWindow;
