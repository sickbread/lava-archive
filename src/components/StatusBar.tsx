import React from 'react';
import type { LoreNote } from '../types';
import { Activity, FileText, Share2, Database, Zap } from 'lucide-react';

interface StatusBarProps {
    notes: LoreNote[];
    t: any;
    lang: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ notes, t, lang }) => {
    const totalWordCount = notes.reduce((acc, note) => {
        const content = note.content[lang] || '';
        return acc + (content.split(/\s+/).filter(w => w.length > 0).length || 0);
    }, 0);

    // Calculate connections (bi-directional or references)
    const connectionCount = notes.reduce((acc, note) => {
        const content = note.content[lang] || '';
        const refs = (content.match(/\[\[.*?\]\]/g) || []).length;
        return acc + refs;
    }, 0);

    // Asset Volume (simulated calculation based on content length and properties)
    const assetVolume = (JSON.stringify(notes).length / 1024).toFixed(2);

    return (
        <div className="h-6 bg-pm-black border-t border-pm-border flex items-center justify-between px-4 select-none">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#DAC5A0]/80">
                    <Activity size={10} className="text-[#B22222]" />
                    <span className="uppercase opacity-50">ARCHIVE_OS:</span>
                    <span className="text-[#B22222] font-black tracking-widest">CLASSIFIED</span>
                </div>

                <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#DAC5A0]/60">
                    <FileText size={10} className="text-[#B22222]" />
                    <span className="uppercase opacity-50">{t.stats_words}:</span>
                    <span className="text-white font-bold">{totalWordCount.toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#DAC5A0]/60">
                    <Share2 size={10} className="text-[#B22222]" />
                    <span className="uppercase opacity-50">{t.stats_connections}:</span>
                    <span className="text-white font-bold">{connectionCount}</span>
                </div>

                <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#DAC5A0]/60">
                    <Database size={10} className="text-[#B22222]" />
                    <span className="uppercase opacity-50">{t.stats_volume}:</span>
                    <span className="text-white font-bold">{assetVolume} KB</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#DAC5A0]/80">
                    <Zap size={10} className="text-[#B22222]" />
                    <span className="uppercase opacity-50">{t.stats_sync}:</span>
                    <span className="text-[#B22222] font-black uppercase tracking-widest">SECURE_LINK</span>
                </div>
                <div className="h-2 w-32 bg-[#444]/20 border border-white/5 overflow-hidden relative">
                    <div className="absolute inset-y-0 left-0 bg-[#B22222]/40 w-2/3" />
                </div>
            </div>
        </div>
    );
};

export default StatusBar;
