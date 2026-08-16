import type { ResolvedAction } from "./execution";
type QuoteRecord={planId:string;revision:number;actions:ResolvedAction[];createdAt:number};
const g=globalThis as typeof globalThis&{voxQuotes?:Map<string,QuoteRecord>};const quotes=g.voxQuotes??new Map<string,QuoteRecord>();g.voxQuotes=quotes;
export function saveQuote(q:QuoteRecord){quotes.set(q.planId,q)}export function getQuote(id:string){return quotes.get(id)}
