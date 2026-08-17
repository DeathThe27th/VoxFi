import { initialConversation, type ConversationState } from "./conversation";

type Record = { ownerId: string; state: ConversationState; updatedAt: number };
const globalStore = globalThis as typeof globalThis & { voxConversations?: Map<string, Record> };
const conversations = globalStore.voxConversations ?? new Map<string, Record>();
globalStore.voxConversations = conversations;

export type Activity = { id:string; ownerId:string; conversationId:string; type:string; summary:string; status:"pending"|"confirmed"|"failed"; timestamp:string; transactionHash?:`0x${string}`; transcript?:string };
const activityGlobal=globalThis as typeof globalThis&{voxActivity?:Activity[]};
const activities=activityGlobal.voxActivity??[]; activityGlobal.voxActivity=activities;

export function getConversation(id: string, ownerId: string): ConversationState {
  const record=conversations.get(id);
  if(record&&record.ownerId!==ownerId)throw new Error("Conversation not found");
  return record?.state ?? initialConversation;
}
export function saveConversation(id: string, ownerId:string, state: ConversationState): void {
  const record=conversations.get(id);
  if(record&&record.ownerId!==ownerId)throw new Error("Conversation not found");
  conversations.set(id, { ownerId,state, updatedAt: Date.now() });
}
export function addActivity(item:Activity){activities.unshift(item);if(activities.length>100)activities.length=100;}
export function listActivity(ownerId:string){return activities.filter(item=>item.ownerId===ownerId);}
