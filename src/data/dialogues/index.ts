/**
 * Alle Dialogknoten des Spiels, nach Region getrennt.
 *
 * Die Aufteilung folgt dem Spielverlauf, damit beim Schreiben einer Region
 * nicht in einer 3000-Zeilen-Datei gesucht werden muss.
 */

import type { DialogueNode } from '../types';
import { MIEZLINGEN_DIALOGUES } from './miezlingen';
import { SCHNURRWALD_DIALOGUES } from './schnurrwald';
import { KRATZFELS_DIALOGUES } from './kratzfels';
import { MIAUPORT_DIALOGUES } from './miauport';
import { MONDSEE_DIALOGUES } from './mondsee';
import { SCHATTENLANDE_DIALOGUES } from './schattenlande';
import { SCHLOSS_DIALOGUES } from './schloss';
import { BOSSE_DIALOGUES } from './bosse';

export const DIALOGUES: Record<string, DialogueNode> = {
  ...MIEZLINGEN_DIALOGUES,
  ...SCHNURRWALD_DIALOGUES,
  ...KRATZFELS_DIALOGUES,
  ...MIAUPORT_DIALOGUES,
  ...MONDSEE_DIALOGUES,
  ...SCHATTENLANDE_DIALOGUES,
  ...SCHLOSS_DIALOGUES,
  ...BOSSE_DIALOGUES,
};

export function getDialogue(id: string): DialogueNode | undefined {
  return DIALOGUES[id];
}
