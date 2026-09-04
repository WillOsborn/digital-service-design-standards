// Hand-written types for actor-viewmodel.js. Kept in step by hand; the .js is the implementation.

export interface Item { primary: string; secondary?: string; badge?: string }

export interface ActorSectionSelection {
  traits: boolean; contexts: boolean; emergence: boolean; relationships: boolean; provenance: boolean; governance: boolean;
}

export type TraitGroup = 'demographics' | 'needs' | 'frustrations' | 'motivations' | 'technology' | 'communication'
  | 'learningStyle' | 'influences' | 'decisionMaking' | 'accessibility' | 'behaviouralPatterns';

export interface ViewModelOptions {
  sections?: Partial<ActorSectionSelection>;
  traitGroups?: TraitGroup[] | 'all';
  caps?: { summaryItems?: number };
  context?: string;
  deck?: { actorIds?: string[] };
}

export interface Emergence {
  goalsAsExperienced: Item[]; painPoints: Item[]; opportunities: Item[];
  emotionalContext: string; useCases: Item[]; successMetrics: Item[];
}

export interface ContextVM {
  contextId: string; title: string; contextType: string; description: string;
  needs: Item[]; frustrations: Item[]; channels: Item[]; momentsThatMatter: Item[]; details: Item[];
  emergence: Emergence | null;
}

export interface Relationship { target: string; type: string; typeLabel: string; description: string; strength?: string }

export interface Slot { items: Item[]; full: Item[]; truncated: boolean }
export interface ContextSlot extends Slot { contextId: string; title: string; contextType: string; moreContexts: number }

export interface Warning { code: 'UNATTRIBUTED_EMERGENCE' | 'CONTEXT_NOT_FOUND' | string; message: string }

export interface ActorViewModel {
  identity: { id: string; name: string; actorType: 'human' | 'ai_agent' | 'team' | 'organisation'; summary: string; quote: string; version: string };
  avatar: { kind: 'initials' | 'label'; text: string; colourKey: number };
  traits: Partial<Record<TraitGroup, { label: string; items: Item[] }>>;
  contexts: ContextVM[];
  unattributedEmergence: (Emergence & { contextRef: string })[];
  relationships: { inDeck: Relationship[]; external: Relationship[] };
  summarySlots: { who: Slot; context: ContextSlot | null; emerges: Slot };
  provenance?: Item[];
  governance?: Item[];
  warnings: Warning[];
}

export const TRAIT_GROUPS: TraitGroup[];
export const TRAIT_LABELS: Record<TraitGroup, string>;
export const DEFAULT_ACTOR_SECTIONS: Readonly<ActorSectionSelection>;
export function buildActorViewModel(actor: unknown, options?: ViewModelOptions): ActorViewModel;
export function humanise(key: string): string;
export function initialsOf(name: string): string;
export function colourKeyOf(id: string): number;
