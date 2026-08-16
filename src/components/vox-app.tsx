"use client";

import { useEffect, useRef, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Arrow, Clock, Home, Mic, Sliders } from "./icons";
import {DitheringShader} from "@/components/ui/dithering-shader";

type Tab = "home" | "activity" | "settings";
type VoiceReply = { speak: string; state: string; requiresResponse: boolean; transcript?:string; plan: null | { actions: Array<{type:string; tokenIn?:string; tokenOut?:string; amount?:{value:string;type:string}}> }; resolvedActions?:Array<{type:string;tokenIn?:string;tokenOut?:string;amountIn?:string;expectedOut?:string;minimumOut?:string;provider?:string;network?:string}>;ownerActions?:Array<{type:string;ownerTransaction?:{to:string;data:string;value:string}}> };
export function VoxApp() {
  const {ready:authReady,authenticated,login,logout,user}=usePrivy();
  const {ready:walletsReady,wallets}=useWallets();
  const [tab, setTab] = useState<Tab>("home");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<VoiceReply | null>(null);
  const [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const conversationId=useRef<string|undefined>(undefined);
  const [portfolio,setPortfolio]=useState<{estimatedTestUsd:string;balances:Array<{symbol:string;formatted:string}>}|null>(null);
  const accountAddress=wallets.find(wallet=>wallet.type==="ethereum"&&wallet.walletClientType==="privy")?.address??wallets.find(wallet=>wallet.type==="ethereum")?.address??"";
  useEffect(()=>{if("serviceWorker" in navigator)navigator.serviceWorker.register("/sw.js").catch(()=>undefined)},[]);
  useEffect(()=>{if(accountAddress)fetch(`/api/portfolio?address=${accountAddress}`).then(r=>r.ok?r.json():Promise.reject()).then(setPortfolio).catch(()=>setPortfolio(null))},[accountAddress]);

  async function toggleRecording() {
    if (listening) { recorder.current?.stop(); return; }
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(stream);
      chunks.current = [];
      media.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      media.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop()); setListening(false); setBusy(true);
        const body = new FormData(); body.set("audio", new Blob(chunks.current, { type: media.mimeType }), "voice.webm"); if(accountAddress)body.set("walletAddress",accountAddress); if(conversationId.current)body.set("conversationId",conversationId.current);
        try {
          const res = await fetch("/api/voice/turn", { method: "POST", body });
          const data = await res.json(); if (!res.ok) throw new Error(data.error ?? "Voice request failed");
          conversationId.current=data.conversationId; setReply(data); if (data.speak && "speechSynthesis" in window) speechSynthesis.speak(new SpeechSynthesisUtterance(data.speak));
        } catch (e) { setError(e instanceof Error ? e.message : "Voice request failed"); }
        finally { setBusy(false); }
      };
      media.start(); recorder.current = media; setListening(true);
    } catch { setError("Microphone access is required to speak with Vox."); }
  }

  if(!authReady)return <main className="shell auth-screen"><div className="wordmark">vox<span>.</span></div><p>Loading secure sign-in…</p></main>;
  if(!authenticated)return <Landing login={login}/>;
  return <main className="shell">
    <header className="topbar"><div className="wordmark">vox<span>.</span></div><button className="network"><i/> X Layer Testnet</button><button className="avatar" aria-label="Sign out" title="Sign out" onClick={logout}>{user?.email?.address?.slice(0,1).toUpperCase()||"V"}</button></header>
    <section className="content">
      {tab === "home" && <HomeScreen listening={listening} busy={busy} reply={reply} error={error} portfolio={portfolio} walletReady={walletsReady} accountAddress={accountAddress} onMic={toggleRecording}/>} 
      {tab === "activity" && <Activity/>}
      {tab === "settings" && <Settings owner={accountAddress}/>} 
    </section>
    <nav className="bottom-nav">
      <Nav active={tab==="home"} label="Home" icon={<Home/>} onClick={()=>setTab("home")}/>
      <Nav active={tab==="activity"} label="Activity" icon={<Clock/>} onClick={()=>setTab("activity")}/>
      <Nav active={tab==="settings"} label="Settings" icon={<Sliders/>} onClick={()=>setTab("settings")}/>
    </nav>
  </main>;
}

function Landing({login}:{login:()=>void}){return <main className="landing"><nav className="floating-vox-nav"><div className="wordmark">vox<span>.</span></div><div className="landing-links"><a href="#how">How it works</a><a href="#control">Why Vox</a><span>X Layer</span></div><button onClick={login}>Open Vox <Arrow/></button></nav><section className="hero"><div className="eyebrow">VOICE-NATIVE ONCHAIN FINANCE</div><h1>The whole wallet,<br/><em>one conversation away.</em></h1><p>Speak naturally, review an exact plan, and stay in control. Vox turns financial intent into deterministic X Layer actions.</p><div className="hero-actions"><button className="hero-cta" onClick={login}>Sign in to start</button><a href="#how">See how it works ↓</a></div><div className="wave-stage" aria-hidden="true"><DitheringShader shape="wave" type="8x8" colorBack="#071827" colorFront="#ff2f8b" pxSize={3} speed={.6}/><div className="wave-card"><span>VOX HEARD</span><strong>“Swap half my test ETH to test USDC.”</strong><small>Intent structured · awaiting review</small></div></div></section><section className="proof" id="how"><article><b>01</b><h2>Say it once.</h2><p>Ask for a balance, a swap, or a change to your plan without memorizing commands.</p></article><article><b>02</b><h2>See the exact plan.</h2><p>Vox exposes the understood assets, amounts, quote, and authorization state.</p></article><article><b>03</b><h2>Confirm deliberately.</h2><p>Nothing state-changing executes from ambiguous speech or without policy checks.</p></article></section><section className="control-story" id="control"><div><span className="chapter-dot"/><h2>AI understands.<br/>Code decides.</h2><p>The model interprets your words. Deterministic services read balances, validate tokens, calculate amounts, construct calldata, and enforce permissions.</p></div><div className="control-card"><div><small>YOUR REQUEST</small><strong>Swap $20 of test ETH</strong></div><div><small>NETWORK</small><strong>X Layer Testnet</strong></div><div><small>STATUS</small><strong>Review required</strong></div></div></section><section className="landing-final"><h2>Your voice.<br/>Your wallet.</h2><p>Start with email, Google, or an existing wallet.</p><button onClick={login}>Open Vox</button></section><footer><div className="wordmark">vox<span>.</span></div><p>Voice-controlled finance on X Layer Testnet.</p><small>Testnet software · No real assets</small></footer></main>}

function Nav({active,label,icon,onClick}:{active:boolean;label:string;icon:React.ReactNode;onClick:()=>void}) { return <button className={active?"active":""} onClick={onClick}>{icon}<span>{label}</span></button>; }

function HomeScreen({listening,busy,reply,error,portfolio,walletReady,accountAddress,onMic}:{listening:boolean;busy:boolean;reply:VoiceReply|null;error:string;portfolio:{estimatedTestUsd:string;balances:Array<{symbol:string;formatted:string}>}|null;walletReady:boolean;accountAddress:string;onMic:()=>void}) {
  return <div className="home-screen">
    <div className="eyebrow">YOUR X LAYER TESTNET WALLET</div><div className="balance">{portfolio?`$${portfolio.estimatedTestUsd}`:"—"}</div><div className="change">{portfolio?portfolio.balances.map(b=>`${Number(b.formatted).toFixed(3)} ${b.symbol}`).join(" · "):walletReady&&!accountAddress?"No wallet is linked to this account":"Reading balances from X Layer…"}</div>{accountAddress&&<div className="wallet-line">{accountAddress.slice(0,8)}…{accountAddress.slice(-6)} · estimated from test AMM reserves</div>}
    <div className={`voice-orb ${listening?"listening":""} ${busy?"busy":""}`}><button onClick={onMic} disabled={busy} aria-label={listening?"Stop recording":"Start recording"}><Mic size={34}/></button>{listening && <div className="waves">{[1,2,3,4,5].map(i=><i key={i}/>)}</div>}</div>
    <h1>{listening ? "I’m listening" : busy ? "Understanding…" : "What would you like to do?"}</h1>
    <p className="hint">{listening ? "Tap when you’re finished" : "Tap the microphone and speak naturally"}</p>
    {error && <div className="error">{error}</div>}
    {reply && <div className="reply"><div className="reply-label">VOX UNDERSTOOD</div>{reply.transcript&&<small className="transcript">“{reply.transcript}”</small>}<p>{reply.speak}</p>{reply.plan && <Plan plan={reply.plan} resolved={reply.resolvedActions}/>} {reply.ownerActions?.some(a=>a.ownerTransaction)&&<button className="owner-approve" onClick={async()=>{const accounts=await window.ethereum?.request({method:"eth_requestAccounts"}) as string[];for(const action of reply.ownerActions??[])if(action.ownerTransaction)await window.ethereum?.request({method:"eth_sendTransaction",params:[{from:accounts[0],...action.ownerTransaction}]})}}>Approve with owner wallet</button>}</div>}
    {!reply && <div className="suggestions" aria-label="Things you can say"><span>“How much test USDC do I have?”</span><span>“Swap 0.01 test ETH to test USDC”</span></div>}
  </div>;
}

function Plan({plan,resolved}:{plan:NonNullable<VoiceReply["plan"]>;resolved?:VoiceReply["resolvedActions"]}) { return <div className="plan">{plan.actions.map((a,i)=>{const q=resolved?.[i];return <div className="plan-row" key={i}><span className="step">{i+1}</span><div><strong>{a.type === "swap" ? `${q?.tokenIn??a.tokenIn} → ${q?.tokenOut??a.tokenOut}` : "Transfer"}</strong><small>{q?`${q.amountIn} → ~${q.expectedOut} · min ${q.minimumOut}`:`${a.amount?.value} ${a.amount?.type === "usd" ? "USD" : a.tokenIn}`}</small>{q&&<small>{q.provider} · {q.network} · 1% slippage</small>}</div><Arrow/></div>})}<div className="auth-note">{resolved?.length?"Session eligible · confirmation required":"Awaiting deterministic quote"}</div></div>; }

function Activity() {return <div className="page"><div className="eyebrow">YOUR HISTORY</div><h1>Activity</h1><div className="empty"><Clock size={28}/><h2>No activity yet</h2><p>Only transactions associated with your authenticated wallet will appear here.</p></div></div>; }

function Settings({owner}:{owner:string}) {return <div className="page settings"><div className="eyebrow">ACCOUNT</div><h1>Settings</h1><section><h2>Voice</h2><Setting title="Spoken responses" detail="Enabled through browser speech"/><Setting title="Language" detail="Detected from each request"/></section><section><h2>Network</h2><Setting title="Environment" detail="X Layer Testnet"/><Setting title="Supported reads" detail="OKB, tETH, and tUSDC balances"/></section><section><h2>Wallet</h2><Setting title="Authenticated wallet" detail={owner?`${owner.slice(0,8)}…${owner.slice(-6)}`:"Creating embedded wallet…"}/></section><p className="fine">State-changing voice execution is disabled until a per-user smart account is provisioned. Vox will not use the old shared demo account.</p></div>; }
function Setting({title,detail}:{title:string;detail:string}) { return <div className="setting"><div><strong>{title}</strong><small>{detail}</small></div></div>; }
