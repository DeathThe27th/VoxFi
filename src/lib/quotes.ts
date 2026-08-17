import type { ResolvedAction } from "./execution";
export type QuoteRecord={ownerId:string;planId:string;revision:number;actions:ResolvedAction[];createdAt:number};
const g=globalThis as typeof globalThis&{voxQuotes?:Map<string,QuoteRecord>};const quotes=g.voxQuotes??new Map<string,QuoteRecord>();g.voxQuotes=quotes;
export function saveQuote(q:QuoteRecord){quotes.set(q.planId,q)}
export function getQuote(id:string,ownerId:string,revision:number){const quote=quotes.get(id);if(!quote||quote.ownerId!==ownerId||quote.revision!==revision)return undefined;return quote;}
