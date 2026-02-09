import { useState, useEffect, useCallback } from 'react';
import type { LoreNote, Relationship, NoteType } from '../types';

const STORAGE_KEY = 'lava-archive-v4-notes';
const RELATIONS_KEY = 'lava-archive-v4-relations';

export const useNotes = () => {
    const [notes, setNotes] = useState<LoreNote[]>([]);
    const [relations, setRelations] = useState<Relationship[]>([]);

    // Load from LocalStorage
    useEffect(() => {
        const savedNotes = localStorage.getItem(STORAGE_KEY);
        const savedRelations = localStorage.getItem(RELATIONS_KEY);
        if (savedNotes) {
            try {
                setNotes(JSON.parse(savedNotes));
            } catch (e) {
                console.error("Failed to parse notes", e);
            }
        } else {
            // Default Data if empty - Classified Archival Content (V4 Image Fix)
            const initialNotes: LoreNote[] = [
                {
                    id: 'protocol-01',
                    type: 'WORLD',
                    title: { KO: '[보안] 접속 프로토콜 01', EN: '[SEC] Access Protocol 01' },
                    content: {
                        KO: 'LAVA ARCHIVE 보안 등급 승인됨. 모든 데이터는 [[데이터 분류]] 체계에 따라 격리 보관됩니다.\n\n시스템 접근 권한: LEVEL_4\n상태: [[기밀 유지]] 상태.',
                        EN: 'LAVA ARCHIVE security clearance verified. All data is isolated according to [[Data Classification]].\n\nAccess Level: LEVEL_4\nStatus: [[Classified]] Mode.'
                    },
                    imageUrl: '/assets/initial/protocol.png',
                    updatedAt: new Date().toISOString(),
                    properties: [
                        { key: 'Clearance', value: '4', type: 'number' },
                        { key: 'Encryption', value: 'AES-LAVA', type: 'string' }
                    ],
                    position: { x: 0, y: -200 }
                },
                {
                    id: 'arch-01',
                    type: 'WORLD',
                    title: { KO: '[기밀] 보관소 구조 개요', EN: '[CON] Vault Architecture' },
                    content: {
                        KO: '본 아카이브는 [[보안 구역]]별로 나뉘어 있으며, 각 노드는 개별적인 관계성을 유지합니다.\n\n주요 섹터:\n- [[주요 관계자 리스트]] (Dossiers)\n- [[특수 관리 대상 현황]] (Materials)\n- [[데이터 복구 기록]] (Audio Logs)',
                        EN: 'This archive is divided into [[Security Sectors]], with each node maintaining individual relationships.\n\nMain Sectors:\n- [[Personnel Dossiers]]\n- [[Secure Materials]]\n- [[Intercepted Audio]]'
                    },
                    imageUrl: '/assets/initial/vault.png',
                    updatedAt: new Date().toISOString(),
                    properties: [],
                    position: { x: -300, y: 0 }
                },
                {
                    id: 'person-01',
                    type: 'CHARACTER',
                    title: { KO: '[기밀] 주요 관계자 리스트', EN: '[CON] Personnel Dossiers' },
                    content: {
                        KO: 'LAVA ARCHIVE에 접근 가능한 인원 목록입니다. 모든 [[관계자]]는 최고 등급의 보안 서약을 마쳤으며, 이들의 신상은 ██████ 처리되어 보호받습니다.',
                        EN: 'List of personnel authorized to access LAVA ARCHIVE. All [[Staff]] have completed top-tier security oaths. Their identities are ██████ protected.'
                    },
                    imageUrl: '/assets/initial/dossier.png',
                    updatedAt: new Date().toISOString(),
                    properties: [
                        { key: 'Status', value: 'Monitored', type: 'string' },
                        { key: 'Auth', value: 'Level_4', type: 'string' }
                    ],
                    position: { x: 0, y: 0 }
                },
                {
                    id: 'item-01',
                    type: 'ITEM',
                    title: { KO: '[인가] 특수 관리 대상 현황', EN: '[AUTH] Secure Materials' },
                    content: {
                        KO: '아카이브 내부에 물리적으로 보관된 [[보안 물자]] 목록입니다. 각 물품은 고유한 [[에너지 파장]]을 가지고 있으며, 임의 반출 시 즉각적인 격리 조치가 시행됩니다.',
                        EN: 'List of [[Resources]] physically stored within the vault. Each item has a unique [[Energy Signature]]. Any unauthorized removal triggers immediate lockdown.'
                    },
                    imageUrl: '/assets/initial/material.png',
                    updatedAt: new Date().toISOString(),
                    properties: [
                        { key: 'Hazard', value: 'High', type: 'string' }
                    ],
                    position: { x: 300, y: 0 }
                },
                {
                    id: 'audio-01',
                    type: 'DIALOGUE',
                    title: { KO: '[감청] 데이터 복구 기록', EN: '[INT] Audio Intercepts' },
                    content: {
                        KO: '관리자: "시스템 동기화가 예상보다 늦어지고 있어."\n요원: "[[LAVA_CORE]]와의 연결 상태가 불안정합니다. 데이터 보존을 최우선으로..."\n(이후 기록 말소)',
                        EN: 'Admin: "Syncing is slower than expected."\nAgent: "Connection to [[LAVA_CORE]] is unstable. Prioritizing data integrity..."\n(Rest of log redacted)'
                    },
                    imageUrl: '/assets/initial/waveform.png',
                    updatedAt: new Date().toISOString(),
                    properties: [],
                    position: { x: 0, y: 200 }
                }
            ];
            setNotes(initialNotes);
        }

        if (savedRelations) {
            try {
                setRelations(JSON.parse(savedRelations));
            } catch (e) {
                console.error("Failed to parse relations", e);
            }
        }
    }, []);

    // Save to LocalStorage
    useEffect(() => {
        if (notes.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
        if (relations.length > 0) localStorage.setItem(RELATIONS_KEY, JSON.stringify(relations));
    }, [notes, relations]);

    // HANDLERS
    const addNote = useCallback((type: string = 'DOC') => {
        const id = `${type.toLowerCase()}-${Date.now().toString(36).substr(2, 5)}`;
        const newNote: LoreNote = {
            id,
            type: type as NoteType,
            title: { KO: '제목 없음', EN: 'Untitled' },
            content: { KO: '', EN: '' },
            updatedAt: new Date().toISOString(),
            properties: [],
            position: {
                x: (Math.random() - 0.5) * 400,
                y: (Math.random() - 0.5) * 400
            }
        };
        setNotes(prev => [...prev, newNote]);
        return id;
    }, []);

    const updateNote = useCallback((updatedNote: LoreNote) => {
        setNotes(prev => prev.map(n => n.id === updatedNote.id ? { ...updatedNote, updatedAt: new Date().toISOString() } : n));
    }, []);

    const deleteNote = useCallback((noteToDelete: LoreNote) => {
        setNotes(prev => prev.filter(n => n.id !== noteToDelete.id));
        setRelations(prev => prev.filter(r => r.fromNodeId !== noteToDelete.id && r.toNodeId !== noteToDelete.id));
    }, []);

    const addRelation = useCallback((fromId: string, toId: string) => {
        setRelations(prev => {
            if (prev.some(r => r.fromNodeId === fromId && r.toNodeId === toId)) return prev;
            const newRel: Relationship = {
                id: `rel-${Date.now()}`,
                fromNodeId: fromId,
                toNodeId: toId,
                label: 'LINK',
                status: 'NEUTRAL'
            };
            return [...prev, newRel];
        });
    }, []);

    const deleteRelation = useCallback((id: string) => {
        setRelations(prev => prev.filter(r => r.id !== id));
    }, []);

    const clearNotes = useCallback(() => {
        if (confirm('모든 데이터가 영구적으로 파기됩니다. 계속하시겠습니까?\nALL DATA WILL BE PERMANENTLY PURGED. PROCEED?')) {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(RELATIONS_KEY);
            window.location.reload();
        }
    }, []);

    return {
        notes,
        relations,
        addNote,
        updateNote,
        deleteNote,
        addRelation,
        deleteRelation,
        clearNotes
    };
};
