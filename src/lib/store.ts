import { initialConversation, type ConversationState } from "./conversation";

type Record = { state: ConversationState; updatedAt: number };
const globalStore = globalThis as typeof globalThis & { voxConversations?: Map<string, Record> };
const conversations = globalStore.voxConversations ?? new Map<string, Record>();
globalStore.voxConversations = conversations;

export type Activity = { id:string; conversationId:string; type:string; summary:string; status:"pending"|"confirmed"|"failed"; timestamp:string; transactionHash?:`0x${string}`; transcript?:string };
const activityGlobal=globalThis as typeof globalThis&{voxActivity?:Activity[]};
const activities=activityGlobal.voxActivity??[]; activityGlobal.voxActivity=activities;

export function getConversation(id: string): ConversationState {
  return conversations.get(id)?.state ?? initialConversation;
}
export function saveConversation(id: string, state: ConversationState): void {
  conversations.set(id, { state, updatedAt: Date.now() });
}
export function addActivity(item:Activity){activities.unshift(item);if(activities.length>100)activities.length=100;}
export function listActivity(){return activities.slice();}
