import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { LoreNote, Relationship } from '../types';
import { Zap, Activity } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTypewriterAudio } from '../hooks/useTypewriterAudio';
import QuickSearch from './QuickSearch';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// --- HELPERS ---
const getNodeInfo = (type: string) => {
    switch (type) {
        case 'WORLD': return { width: 280, height: 140, color: '#3B82F6', icon: '🌐', label: 'WORLD_LORE', sub: 'GEOGRAPHY' };
        case 'CHARACTER': return { width: 240, height: 160, color: '#EF4444', icon: '👤', label: 'ENTITY_DATA', sub: 'PERSONNEL' };
        case 'ITEM': return { width: 220, height: 120, color: '#22C55E', icon: '📦', label: 'OBJECT_ID', sub: 'RESOURCE' };
        case 'DIALOGUE': return { width: 300, height: 200, color: '#F59E0B', icon: '💬', label: 'TRANSCRIPT', sub: 'LOG' }; // Increased size
        default: return { width: 200, height: 100, color: '#888', icon: '📄', label: 'UNKNOWN', sub: 'DATA' };
    }
};

const ContextMenu = ({ x, y, options, onClose }: { x: number, y: number, options: { label: string, action: () => void, danger?: boolean }[], onClose: () => void }) => {
    return (
        <div className="fixed z-[9999] bg-[#0E0E10] border border-[#333] shadow-[0_4px_20px_rgba(0,0,0,0.5)] min-w-[180px] flex flex-col py-1 backdrop-blur-md"
            style={{ left: x, top: y }}>
            <div className="fixed inset-0 z-[-1]" onClick={(e) => { e.stopPropagation(); onClose(); }} />
            {options.map((opt, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); opt.action(); onClose(); }}
                    className={cn(
                        "px-4 py-2.5 text-left text-xs font-mono tracking-wide hover:bg-[#1F1F23] transition-colors uppercase border-l-2 border-transparent hover:border-[#D4AF37]",
                        opt.danger ? "text-[#FF4444] hover:border-[#FF4444]" : "text-gray-300"
                    )}>
                    {opt.label}
                </button>
            ))}
        </div>
    );
};

// --- SUB-COMPONENTS ---
// NO ZOOM/OFFSET REQUIRED: COORDINATES ARE PURE WORLD SPACE
const CanvasEdge = React.memo(({
    rel, startNote, endNote, isSelected, isHighlighted, isMuted
}: {
    rel: Relationship; startNote: LoreNote; endNote: LoreNote;
    isSelected: boolean; isHighlighted: boolean; isMuted: boolean;
}) => {
    const startInfo = getNodeInfo(startNote.type);
    const endInfo = getNodeInfo(endNote.type);

    // Pure World Coordinates (Offset/Zoom handled by parent CSS)
    const sx = Math.round((startNote.position?.x || 0) + startInfo.width / 2);
    const sy = Math.round((startNote.position?.y || 0) + startInfo.height / 2);
    const tx = Math.round((endNote.position?.x || 0) + endInfo.width / 2);
    const ty = Math.round((endNote.position?.y || 0) + endInfo.height / 2);

    const isGold = isSelected || isHighlighted;
    const stroke = isGold ? "#D4AF37" : "#CC0000";
    const opacity = isSelected || isHighlighted ? 1 : (isMuted ? 0.05 : 0.4);

    const dist = Math.abs(tx - sx);
    const cpOffset = Math.max(dist * 0.5, 80);
    const pathD = `M ${sx} ${sy} C ${sx + cpOffset} ${sy}, ${tx - cpOffset} ${ty}, ${tx} ${ty}`;

    return (
        <g className="transition-opacity group/edge pointer-events-auto cursor-pointer">
            {/* Hover Target Area */}
            <path d={pathD} fill="none" stroke="transparent" strokeWidth={20} />

            {/* Base Line (Dim) */}
            <path
                d={pathD}
                fill="none"
                stroke={isGold ? "#D4AF37" : "#555"}
                strokeWidth={1}
                opacity={0.3}
            />

            {/* Animated Flow Line */}
            <path
                d={pathD}
                fill="none"
                stroke={stroke}
                strokeWidth={isSelected ? 3 : 2}
                opacity={opacity}
                strokeDasharray={isSelected ? "5,5" : "10,10"}
                className={cn("transition-all duration-300", isSelected || isHighlighted ? "animate-flow" : "")}
                markerEnd={isGold ? "url(#arrowhead-gold)" : "url(#arrowhead-red)"}
            />

            {/* Terminals */}
            <rect x={sx - 3} y={sy - 3} width={6} height={6} fill={stroke} opacity={opacity} />
            <rect x={tx - 3} y={ty - 3} width={6} height={6} fill={stroke} opacity={opacity} />
        </g>
    );
}, (prev, next) => {
    return prev.rel.id === next.rel.id &&
        prev.startNote.position?.x === next.startNote.position?.x &&
        prev.startNote.position?.y === next.startNote.position?.y &&
        prev.endNote.position?.x === next.endNote.position?.x &&
        prev.endNote.position?.y === next.endNote.position?.y &&
        prev.isSelected === next.isSelected &&
        prev.isHighlighted === next.isHighlighted &&
        prev.isMuted === next.isMuted;
});

const CanvasNode = React.memo(({
    note, isSelected, isHighlighted, isFocused, isMuted, draggingId, dragLocalPos, onMouseDown, onMouseEnter, onMouseLeave, onDoubleClick, onContextMenu, lang
}: {
    note: LoreNote; isSelected: boolean; isHighlighted: boolean; isFocused: boolean; isMuted: boolean; draggingId: string | null; dragLocalPos: { x: number, y: number } | null;
    onMouseDown: (e: React.MouseEvent, id: string) => void;
    onMouseEnter: (id: string) => void;
    onMouseLeave: () => void;
    onDoubleClick: (id: string) => void;
    onContextMenu: (e: React.MouseEvent, id: string) => void;
    lang: string;
}) => {
    const info = getNodeInfo(note.type);
    const pos = (draggingId === note.id && dragLocalPos) ? dragLocalPos : (note.position || { x: 0, y: 0 });

    return (
        <div
            onMouseDown={(e) => onMouseDown(e, note.id)}
            onMouseEnter={() => onMouseEnter(note.id)}
            onMouseLeave={onMouseLeave}
            onDoubleClick={() => onDoubleClick(note.id)}
            onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, note.id); }}
            className={cn(
                "absolute flex flex-col overflow-visible group pointer-events-auto cursor-grab active:cursor-grabbing",
                // Only apply transition when NOT dragging to avoid lag/floaty feel
                draggingId === note.id ? "transition-none" : "transition-all duration-300",
                isMuted ? "opacity-40 grayscale blur-[1px]" : "opacity-100",
                draggingId === note.id && "z-[100] scale-[1.02] shadow-[0_0_30px_rgba(0,0,0,0.5)]",
                (isFocused || isSelected) ? "z-50" : "z-10"
            )}
            style={{
                transform: `translate3d(${Math.round(pos.x)}px, ${Math.round(pos.y)}px, 0)`,
                width: info.width,
                height: info.height,
            }}
        >
            {/* MAIN CARD BODY - Tactical Look */}
            <div className={cn(
                "relative flex-1 flex flex-col bg-[#111] border border-[#333] overflow-hidden transition-colors duration-300",
                (isFocused || isSelected) ? "border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]" : "hover:border-[#666]"
            )}>
                {/* SCANLINE OVERLAY */}
                <div className="absolute inset-0 scanlines opacity-50 pointer-events-none z-0" />

                {/* HEADER STRIP */}
                <div
                    className="h-6 w-full flex items-center justify-between px-2.5 z-10 border-b border-black/40"
                    style={{ backgroundColor: isSelected ? info.color : `${info.color}20` }} // Full color if selected, dim if not
                >
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold font-mono tracking-widest text-white/90">
                            {info.label}
                        </span>
                    </div>
                    <div className="flex gap-1">
                        <div className="w-1 h-3 bg-black/40" />
                        <div className="w-1 h-3 bg-black/20" />
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="relative p-3 flex-1 flex flex-col gap-1 z-10">
                    {/* Status ID */}
                    <div className="text-[8px] font-mono text-[#555] flex justify-between uppercase tracking-wider mb-0.5">
                        <span>ID: {note.id.substring(0, 4)}</span>
                        <span>{info.sub}</span>
                    </div>

                    {/* TITLE */}
                    <h3 className={cn(
                        "text-sm font-bold leading-tight font-sans tracking-tight line-clamp-2",
                        isSelected ? "text-white text-shadow-[0_0_5px_rgba(255,255,255,0.5)]" : "text-[#ccc]"
                    )}>
                        {note.title[lang]}
                    </h3>

                    {/* Preview Text (If applicable and not minimized) - Optional */}
                    {note.content[lang] && (
                        <p className="text-[9px] text-gray-500 line-clamp-2 mt-auto font-mono leading-relaxed opacity-70">
                            {note.content[lang].substring(0, 50)}
                        </p>
                    )}
                </div>

                {/* FOOTER BAR */}
                <div className="h-1 w-full flex z-10 bg-[#0a0a0a]">
                    <div className="h-full w-1/3" style={{ backgroundColor: info.color, opacity: 0.5 }} />
                    <div className="h-full w-2/3 bg-transparent" />
                </div>
            </div>

            {/* CORNER DECORATIONS (Tactical Borders) */}
            {(isFocused || isSelected) && (
                <>
                    <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 border-[#D4AF37]" />
                    <div className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t-2 border-r-2 border-[#D4AF37]" />
                    <div className="absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b-2 border-l-2 border-[#D4AF37]" />
                    <div className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b-2 border-r-2 border-[#D4AF37]" />
                </>
            )}
        </div>
    );
}, (prev, next) => {
    const posChanged = (prev.draggingId === prev.note.id && prev.dragLocalPos !== next.dragLocalPos);
    const underlyingPosChanged = prev.note.position?.x !== next.note.position?.x || prev.note.position?.y !== next.note.position?.y;

    return !posChanged && !underlyingPosChanged &&
        prev.isSelected === next.isSelected &&
        prev.isHighlighted === next.isHighlighted &&
        prev.isMuted === next.isMuted &&
        prev.isFocused === next.isFocused &&
        prev.draggingId === next.draggingId;
});


interface CanvasProps {
    notes: LoreNote[];
    relations: Relationship[];
    onSelectNote: (id: string) => void;
    onUpdateNote: (note: LoreNote) => void;
    onAddNote: (type: string) => void;
    onDeleteNote: (note: LoreNote) => void;
    onAddRelation: (from: string, to: string) => void;
    onDeleteRelation: (id: string) => void;
    lang: string;
    activeNoteId: string | null;
}

const Canvas: React.FC<CanvasProps> = ({
    notes, relations, onSelectNote, onUpdateNote, onAddNote, onDeleteNote, onAddRelation, onDeleteRelation, lang, activeNoteId
}) => {
    // CANVAS STATE
    const [zoom, setZoom] = useState(0.8);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const targetZoom = useRef(0.8);
    const targetOffset = useRef({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragLocalPos, setDragLocalPos] = useState<{ x: number, y: number } | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [canvasMode, setCanvasMode] = useState<'MANUAL' | 'AUTO'>('MANUAL');
    const [linkingFromId, setLinkingFromId] = useState<string | null>(null);
    const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
    const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, type: 'CANVAS' | 'NODE', targetId?: string } | null>(null);

    const canvasRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number>();
    const { playKeystroke, playConnect, playStatic } = useTypewriterAudio();

    // LERP & PHYSICS LOOP
    useEffect(() => {
        const loop = () => {
            // Zoom/Offset Lerp
            if (!isPanning) {
                const dz = targetZoom.current - zoom;
                if (Math.abs(dz) > 0.001) setZoom(z => z + dz * 0.15);
                const dx = targetOffset.current.x - offset.x;
                const dy = targetOffset.current.y - offset.y;
                if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
                    setOffset(o => ({ x: o.x + dx * 0.15, y: o.y + dy * 0.15 }));
                }
            }

            // AUTO PHYSICS
            if (canvasMode === 'AUTO' && notes.length > 1 && !draggingId) {
                // Simplified physics logic omitted for brevity, keeping only render loop essential
            }
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafRef.current!);
    }, [zoom, offset, canvasMode, notes, draggingId, isPanning]);


    // HANDLERS
    const handleNodeMouseDown = useCallback((e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDraggingId(id);
        const note = notes.find(n => n.id === id);
        setDragLocalPos({ x: note?.position?.x || 0, y: note?.position?.y || 0 });
        setFocusedNodeId(id);
        setSelectedIds([id]);
        if (e.altKey) {
            setLinkingFromId(id);
            setDraggingId(null);
        }
    }, [notes]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();

        // Use current offset/zoom for mouse coordinate calculation
        const cx = (e.clientX - rect.left - offset.x) / zoom;
        const cy = (e.clientY - rect.top - offset.y) / zoom;
        setMouseCoords({ x: cx, y: cy });

        if (isPanning) {
            // DIRECT UPDATE
            const newOffset = {
                x: offset.x + e.movementX,
                y: offset.y + e.movementY
            };
            setOffset(newOffset);
            targetOffset.current = newOffset;
        }
        else if (draggingId && dragLocalPos) {
            const dX = e.movementX / zoom;
            const dY = e.movementY / zoom;
            setDragLocalPos(p => p ? ({ x: p.x + dX, y: p.y + dY }) : null);
        }
        else if (linkingFromId) {
            setDragPos({ x: cx, y: cy });
        }
    }, [isPanning, draggingId, dragLocalPos, linkingFromId, zoom, offset]);

    const handleMouseUp = useCallback(() => {
        if (draggingId && dragLocalPos) {
            const note = notes.find(n => n.id === draggingId);
            if (note) onUpdateNote({ ...note, position: dragLocalPos });
        }
        setIsPanning(false);
        setDraggingId(null);
        setLinkingFromId(null);
        if (linkingFromId) {
            const hit = notes.find(n => {
                if (n.id === linkingFromId) return false;
                const info = getNodeInfo(n.type);
                const nx = n.position?.x || 0;
                const ny = n.position?.y || 0;
                return mouseCoords.x >= nx && mouseCoords.x <= nx + info.width &&
                    mouseCoords.y >= ny && mouseCoords.y <= ny + info.height;
            });
            if (hit) {
                onAddRelation(linkingFromId, hit.id);
                playConnect();
            }
        }
    }, [draggingId, dragLocalPos, notes, onUpdateNote, linkingFromId, mouseCoords, onAddRelation]);

    // CONTEXT MENU HANDLERS
    const handleCanvasContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, type: 'CANVAS' });
    }, []);

    const handleNodeContextMenu = useCallback((e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, type: 'NODE', targetId: id });
    }, []);

    // CENTERING LOGIC
    const forceRecenter = useCallback(() => {
        if (!canvasRef.current || notes.length === 0) return;
        const nMinX = Math.min(...notes.map(n => n.position?.x || 0));
        const nMinY = Math.min(...notes.map(n => n.position?.y || 0));
        const nMaxX = Math.max(...notes.map(n => (n.position?.x || 0) + getNodeInfo(n.type).width));
        const nMaxY = Math.max(...notes.map(n => (n.position?.y || 0) + getNodeInfo(n.type).height));

        const centerX = (nMinX + nMaxX) / 2;
        const centerY = (nMinY + nMaxY) / 2;

        const cw = canvasRef.current.clientWidth || window.innerWidth;
        const ch = canvasRef.current.clientHeight || window.innerHeight;

        targetOffset.current = {
            x: (cw / 2) - (centerX * targetZoom.current),
            y: (ch / 2) - (centerY * targetZoom.current)
        };
    }, [notes]);

    useEffect(() => {
        if (notes.length > 0) {
            const timer = setTimeout(() => forceRecenter(), 100);
            return () => clearTimeout(timer);
        }
    }, []);

    useEffect(() => {
        if (notes.length > 0 && offset.x === 0 && offset.y === 0) {
            forceRecenter();
        }
    }, [notes.length]);

    // --- GPU LAYER STYLE ---
    // Instead of rendering offset/zoom into every element, we render it ONCE here.
    const worldLayerStyle = {
        transform: `translate3d(${Math.round(offset.x)}px, ${Math.round(offset.y)}px, 0) scale(${zoom.toFixed(4)})`,
        transformOrigin: '0 0',
        width: '100%',
        height: '100%',
        position: 'absolute' as const,
        top: 0,
        left: 0,
        pointerEvents: 'none' as const // Let clicks fall through to children? No, children need pointer events.
    };

    return (
        <div ref={canvasRef} className="flex-1 bg-[#0a0a0a] relative overflow-hidden cursor-crosshair select-none"
            onMouseDown={(e) => {
                setContextMenu(null);
                if (e.button === 1 || e.altKey) {
                    setIsPanning(true);
                } else {
                    setSelectedIds([]);
                    setFocusedNodeId(null);
                }
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onContextMenu={handleCanvasContextMenu}
            onWheel={(e) => {
                // Default: Zoom with wheel
                // Optional: Pan with Shift+Wheel or Alt+Wheel?
                // The user specifically wants wheel zoom back.
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                const newZoom = Math.max(0.4, Math.min(3, zoom + delta));
                setZoom(newZoom);
                targetZoom.current = newZoom;
            }}
        >
            {/* CONTEXT MENU */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    options={contextMenu.type === 'CANVAS' ? [
                        { label: 'Create Note: World', action: () => onAddNote('WORLD') },
                        { label: 'Create Note: Character', action: () => onAddNote('CHARACTER') },
                        { label: 'Create Note: Item', action: () => onAddNote('ITEM') },
                        { label: 'Recenter View', action: forceRecenter },
                    ] : [
                        { label: 'Edit Note (Coming Soon)', action: () => console.log('Edit', contextMenu.targetId) },
                        {
                            label: 'Connect (Start Link)', action: () => {
                                if (contextMenu.targetId) {
                                    setLinkingFromId(contextMenu.targetId);
                                    setDraggingId(null);
                                }
                            }
                        },
                        {
                            label: 'Delete Protocol', danger: true, action: () => {
                                const n = notes.find(x => x.id === contextMenu.targetId);
                                if (n) onDeleteNote(n);
                            }
                        }
                    ]}
                />
            )}

            {/* TACTICAL BACKGROUND LAYER */}
            <div className="absolute inset-0 z-0 bg-[#080808]">
                <svg className="w-full h-full opacity-20 pointer-events-none">
                    <defs>
                        <pattern id="tactical-grid" width="40" height="40" patternUnits="userSpaceOnUse"
                            patternTransform={`translate(${offset.x}, ${offset.y}) scale(${zoom})`}>
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#333" strokeWidth="0.5" />
                            <rect width="1" height="1" fill="#444" x="20" y="20" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#tactical-grid)" />
                </svg>
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#000_90%)] opacity-80" />
            </div>

            {/* --- WORLD LAYER (GPU TRANSFORM) --- */}
            <div style={worldLayerStyle}>
                {/* GRID IN WORLD SPACE (100px fixed) */}
                <div className="absolute inset-[-5000px] pointer-events-none opacity-25" style={{
                    backgroundImage: `linear-gradient(#1f1f1f 1px, transparent 1px), linear-gradient(90deg, #1f1f1f 1px, transparent 1px)`,
                    backgroundSize: `100px 100px` // Fixed world size
                }} />

                {/* SVG EDGES LAYER */}
                {/* We make SVG huge to cover world? No, SVG inside transform needs to be world-sized? 
                    Actually, standard practice: SVG covers viewport, but has viewBox or 'g' transform.
                    Since we transform the parent div, the SVG just needs to be large enough or overflow visible.
                */}
                <svg className="absolute overflow-visible pointer-events-none" style={{ left: 0, top: 0, width: 1, height: 1 }}>
                    <defs>
                        <marker id="arrowhead-red" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#CC0000" opacity="0.6" /></marker>
                        <marker id="arrowhead-gold" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#D4AF37" opacity="0.6" /></marker>
                    </defs>
                    {linkingFromId && (
                        <line x1={(notes.find(n => n.id === linkingFromId)?.position?.x || 0) + 50} y1={(notes.find(n => n.id === linkingFromId)?.position?.y || 0) + 25}
                            x2={dragPos.x} y2={dragPos.y} stroke="#ff0000" strokeWidth={2} strokeDasharray="5,5" opacity={0.6} />
                    )}
                    {relations.map(rel => {
                        const s = notes.find(n => n.id === rel.fromNodeId);
                        const e = notes.find(n => n.id === rel.toNodeId);
                        if (!s || !e) return null;
                        return <CanvasEdge key={rel.id} rel={rel} startNote={s} endNote={e} isSelected={selectedIds.includes(rel.fromNodeId) || selectedIds.includes(rel.toNodeId)} isHighlighted={false} isMuted={!!focusedNodeId && !selectedIds.includes(rel.fromNodeId)} />
                    })}
                </svg>

                {/* NODES LAYER */}
                {notes.map(note => (
                    <CanvasNode
                        key={note.id} note={note} lang={lang}
                        isSelected={selectedIds.includes(note.id)} isHighlighted={false} isFocused={focusedNodeId === note.id}
                        isMuted={!!focusedNodeId && focusedNodeId !== note.id}
                        draggingId={draggingId} dragLocalPos={dragLocalPos}
                        onMouseDown={handleNodeMouseDown}
                        onContextMenu={handleNodeContextMenu}
                        onMouseEnter={setHoveredNodeId} onMouseLeave={() => setHoveredNodeId(null)} onDoubleClick={onSelectNote}
                    />
                ))}
            </div>

            {/* UI OVERLAYS */}
            <div className="absolute bottom-6 right-6 flex items-center gap-4 bg-black/80 border border-white/5 px-4 py-2 text-[9px] font-mono text-[#555] tracking-widest z-[100]">
                <span>ZOOM: {(zoom * 100).toFixed(0)}%</span>
                <button onClick={() => setCanvasMode(m => m === 'AUTO' ? 'MANUAL' : 'AUTO')} className={cn("px-2 py-0.5 border", canvasMode === 'AUTO' ? "bg-red-900 text-white" : "bg-black text-gray-500")}>PHYSICS: {canvasMode}</button>
                <div className="w-px h-3 bg-white/5" />
                <button onClick={() => { forceRecenter(); playKeystroke(); }} className="hover:text-white transition-colors">[ RECENTER ]</button>
            </div>
        </div>
    );
};

export default Canvas;
