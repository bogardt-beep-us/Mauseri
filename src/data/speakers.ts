/**
 * Sprecher fuer das Dialogfenster.
 *
 * Portraits werden aus demselben CatLook gezeichnet wie die Weltsprites -
 * dadurch sieht die Figur im Dialog genauso aus wie auf der Karte, ohne dass
 * zwei Darstellungen gepflegt werden muessen.
 */

import type { CatLook } from './types';
import { NPCS } from './npcs';

export interface SpeakerDef {
  id: string;
  name: string;
  look: CatLook;
  /** Farbe des Namensfeldes im Dialog. */
  color: string;
}

export const MAUSERI_LOOK: CatLook = {
  fur: 0xf0b45e,
  furDark: 0xc9863a,
  belly: 0xfff0d2,
  eye: 0x2e5e3a,
  pattern: 'stripes',
  accessory: 'scarf',
  accessoryColor: 0xc75f4a,
};

export const POOKIE_LOOK: CatLook = {
  fur: 0x8fa8c4,
  furDark: 0x63809e,
  belly: 0xf0f4fa,
  eye: 0x3a5a8a,
  pattern: 'patch',
  accessory: 'bandana',
  accessoryColor: 0x6fb85f,
};

/** Erzaehlerstimme - bekommt kein Portrait. */
const NARRATOR_LOOK: CatLook = {
  fur: 0x3a2c60,
  furDark: 0x241a3d,
  belly: 0x4a3c70,
  eye: 0xffd98a,
};

const BASE_SPEAKERS: Record<string, SpeakerDef> = {
  mauseri: { id: 'mauseri', name: 'Mauseri', look: MAUSERI_LOOK, color: '#ffd98a' },
  pookie: { id: 'pookie', name: 'Pookie', look: POOKIE_LOOK, color: '#9fd8ff' },
  erzaehler: { id: 'erzaehler', name: '', look: NARRATOR_LOOK, color: '#b8aad8' },
  stimme: { id: 'stimme', name: '???', look: NARRATOR_LOOK, color: '#c8a0ff' },
};

/** Alle Sprecher: Grundfiguren plus jeder NPC. */
export const SPEAKERS: Record<string, SpeakerDef> = {
  ...BASE_SPEAKERS,
  ...Object.fromEntries(
    Object.values(NPCS).map((npc) => [
      npc.id,
      { id: npc.id, name: npc.name, look: npc.look, color: '#f0e0c0' } satisfies SpeakerDef,
    ]),
  ),
};

export function getSpeaker(id: string): SpeakerDef {
  return SPEAKERS[id] ?? BASE_SPEAKERS.erzaehler!;
}

/** Sprecher ohne Portrait (Erzaehltext). */
export function isNarrator(id: string): boolean {
  return id === 'erzaehler';
}
