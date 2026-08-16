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

function Landing({login}:{login:()=>void}){return <main className="landing-world"><nav className="floating-nav"><a className="brand-lockup" href="#top"><span className="brand-cube">V</span><span>vox.</span></a><div className="nav-links"><a href="#how">How it works</a><a href="#why">Why Vox</a><a href="#network">X Layer</a></div><button className="nav-open" onClick={login}>Open app ↗</button><button className="menu-toggle" aria-label="Menu">☰</button></nav><section className="cinematic-hero" id="top"><div className="voxel-field hero-voxel-field"><DitheringShader shape="wave" type="8x8" colorBack="#001122" colorFront="#ff0088" pxSize={3} speed={.6}/></div><div className="hero-voxel-shade"/><div className="hero-copy"><h1>The whole wallet,<br/><span>one conversation away.</span></h1><p className="hero-body">Speak naturally, review the plan once, and move through X Layer without navigating a maze of financial interfaces.</p><div className="hero-actions"><button className="primary-cta" onClick={login}>Open Vox ↗</button><a className="secondary-cta" href="#how">See how it works ↓</a></div></div></section><section className="story-world" id="how"><div className="story-sky"/><Story title="Say it naturally." body="Ask for a balance, swap, transfer, or change without memorizing command syntax."><div className="product-panel story-card"><div className="panel-topline"><span>Voice request</span><span className="status-chip">● Understood</span></div><div className="voice-quote">“Swap half my test ETH to test USDC.”</div><div className="panel-total"><span>Language</span><strong>Detected automatically</strong></div></div></Story><Story reverse title="Review one exact plan." body="Vox shows what it heard, the assets, amounts, route, and permission state before anything moves."><div className="product-panel story-card night-card"><div className="panel-topline"><span>Proposed swap</span><span>X Layer Testnet</span></div><div className="demo-amount">0.50 <small>tETH</small></div><div className="confirm-row"><span className="confirm-icon">✓</span><div><strong>Ready for review</strong><small>Deterministic quote · 1% slippage</small></div></div></div></Story><Story title="Continue the conversation." body="Change the amount, add another action, ask what remains, or cancel without restarting."><div className="product-panel story-card share-card"><div className="signal"><i/><i/><i/></div><h3>“Actually, make that $50.”</h3><p>The pending plan updates. Nothing executes yet.</p><div className="claim-url"><span>Plan revision 02</span><button>Review</button></div></div></Story><Story reverse title="Your wallet. Your control." body="Email users get an embedded wallet. Existing wallets can connect directly. Every displayed balance comes from that authenticated address."><div className="product-panel story-card claim-card"><p>Authenticated X Layer wallet</p><div className="demo-amount">0x7A…42F</div><div className="sender-row"><span className="confirm-icon">✓</span><span><small>Balance source</small><strong>Live X Layer RPC</strong></span></div><button className="demo-button">Wallet verified</button></div></Story><Story title="Nothing gets guessed." body="Ambiguous audio is clarified. Unsupported tokens and unsafe authorization requests are rejected."><div className="return-visual"><div className="return-orbit">0<small>guessed actions</small></div><div className="product-panel return-note"><span className="confirm-icon">↓</span><div><strong>Clarification required</strong><small>Repeat amount and asset</small></div></div></div></Story></section><section className="monad-chapter" id="network"><div className="monad-lines"><i/><i/><i/></div><div><h2>Finance,<br/>on X Layer.</h2><p>Vox reads live testnet state and keeps transaction construction deterministic.</p><div className="text-links"><a href="https://www.okx.com/web3/explorer/xlayer-test" target="_blank">View explorer ↗</a><a href="#why">How permissions work ↗</a></div></div></section><section className="final-cta" id="why"><h2>Your voice.<br/>Your wallet.</h2><p>Sign in with email, Google, or an existing wallet.</p><button className="primary-cta" onClick={login}>Open Vox ↗</button></section><footer className="landing-footer"><div className="brand-lockup"><span className="brand-cube">V</span><span>vox.</span></div><nav><a href="#how">How it works</a><a href="#why">Why Vox</a><a href="#network">X Layer</a></nav><div className="footer-base"><span>Voice-controlled finance on X Layer Testnet.</span><span>Testnet only · No real assets</span></div></footer></main>}

function Story({title,body,reverse=false,children}:{title:string;body:string;reverse?:boolean;children:React.ReactNode}){return <article className={`story-chapter ${reverse?"reverse":""}`}><div className="story-copy"><span className="chapter-dot"/><h2>{title}</h2><p>{body}</p></div><div className="story-visual">{children}</div></article>}

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
