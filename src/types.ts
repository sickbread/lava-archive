export type NoteType = 'WORLD' | 'CHARACTER' | 'ITEM' | 'DIALOGUE' | string;

export interface Property {
    key: string;
    value: string | number | boolean;
    type: 'string' | 'number' | 'boolean';
}

export type ArtStatus = 'IDEA' | 'SKETCH' | 'LINEART' | 'FINAL';

export interface LoreNote {
    id: string;
    title: Record<string, string>; // e.g. { KO: '...', EN: '...' }
    type: NoteType;
    content: Record<string, string>;
    updatedAt: string;
    properties: Property[];
    position?: { x: number; y: number };
    imageUrl?: string;
    artStatus?: ArtStatus;
}

export type RelationshipStatus = 'FRIENDLY' | 'HOSTILE' | 'NEUTRAL';

export interface Relationship {
    id: string;
    fromNodeId: string;
    toNodeId: string;
    label: string;
    status: RelationshipStatus;
    affinity?: number;
}

export interface ProjectState {
    notes: LoreNote[];
    relations: Relationship[];
    activeNoteId: string | null;
}
