"use client";

import { useEffect, useRef, useState } from "react";
import { Arrow, Clock, Home, Mic, Sliders } from "./icons";

type Tab = "home" | "activity" | "settings";
type VoiceReply = { speak: string; state: string; requiresResponse: boolean; transcript?:string; plan: null | { actions: Array<{type:string; tokenIn?:string; tokenOut?:string; amount?:{value:string;type:string}}> }; resolvedActions?:Array<{type:string;tokenIn?:string;tokenOut?:string;amountIn?:string;expectedOut?:string;minimumOut?:string;provider?:string;network?:string}>;ownerActions?:Array<{type:string;ownerTransaction?:{to:string;data:string;value:string}}> };
type EthereumProvider={request(args:{method:string;params?:unknown[]}):Promise<unknown>};
declare global{interface Window{ethereum?:EthereumProvider}}

export function VoxApp() {
  const [tab, setTab] = useState<Tab>("home");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<VoiceReply | null>(null);
  const [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const conversationId=useRef<string|undefined>(undefined);
  const [owner,setOwner]=useState(""); const [ready,setReady]=useState(false); const [setupBusy,setSetupBusy]=useState(false);
  const [setupStatus,setSetupStatus]=useState("");
  const [portfolio,setPortfolio]=useState<{estimatedTestUsd:string;balances:Array<{symbol:string;formatted:string}>}|null>(null);
  useEffect(()=>{if("serviceWorker" in navigator)navigator.serviceWorker.register("/sw.js").catch(()=>undefined);const id=window.setTimeout(()=>{setOwner(localStorage.getItem("voxOwner")??"");setReady(localStorage.getItem("voxReady")==="true")},0);return()=>window.clearTimeout(id)},[]);
  useEffect(()=>{if(ready)fetch("/api/portfolio?address=0x576a6fc07724d6cf1e4a9a154f0e28f9a2940b24").then(r=>r.json()).then(setPortfolio).catch(()=>setPortfolio(null))},[ready]);

  async function connect(){if(!window.ethereum)throw new Error("Install or open an EVM wallet browser");await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:"0x7a0"}]}).catch(async()=>window.ethereum!.request({method:"wallet_addEthereumChain",params:[{chainId:"0x7a0",chainName:"X Layer Testnet",nativeCurrency:{name:"OKB",symbol:"OKB",decimals:18},rpcUrls:["https://testrpc.xlayer.tech/terigon"],blockExplorerUrls:["https://www.okx.com/web3/explorer/xlayer-test"]}]}));const accounts=await window.ethereum.request({method:"eth_requestAccounts"}) as string[];if(!accounts[0])throw new Error("Wallet connection was cancelled");setOwner(accounts[0]);localStorage.setItem("voxOwner",accounts[0]);}
  async function setup(){setSetupBusy(true);setError("");try{if(!owner)await connect();setSetupStatus("Checking the deployed account…");const response=await fetch("/api/session/setup");const config=await response.json();if(!response.ok)throw new Error(config.error??"Unable to inspect the Vox account");const activeOwner=owner||localStorage.getItem("voxOwner")||"";if(config.owner?.toLowerCase()!==activeOwner.toLowerCase())throw new Error("For this deployed demo, connect the disposable owner wallet configured during setup.");setSetupStatus("Checking test-asset funding…");const funded=await fetch("/api/session/setup",{method:"POST"});if(!funded.ok)throw new Error((await funded.json()).error??"Test-asset funding failed");for(let index=0;index<config.transactions.length;index++){const tx=config.transactions[index];setSetupStatus(`${index+1} of ${config.transactions.length}: ${tx.label}`);let hash:string;try{hash=await window.ethereum!.request({method:"eth_sendTransaction",params:[{from:activeOwner,to:tx.to,data:tx.data,value:"0x0"}]}) as string}catch{throw new Error(`${tx.label} was rejected. No permissions were changed.`)}let confirmed=false;for(let i=0;i<60;i++){const receipt=await window.ethereum!.request({method:"eth_getTransactionReceipt",params:[hash]}) as {status?:string}|null;if(receipt){if(receipt.status==="0x0")throw new Error(`${tx.label} reverted on X Layer Testnet.`);confirmed=true;break}await new Promise(r=>setTimeout(r,1000));}if(!confirmed)throw new Error(`${tx.label} is still pending. Check MetaMask activity before trying again.`)}localStorage.setItem("voxReady","true");setSetupStatus("Vox is ready");setReady(true);}catch(e){setError(e instanceof Error?e.message:"Setup failed");setSetupStatus("")}finally{setSetupBusy(false)}}

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
        const body = new FormData(); body.set("audio", new Blob(chunks.current, { type: media.mimeType }), "voice.webm"); body.set("smartAccount","0x576a6fc07724d6cf1e4a9a154f0e28f9a2940b24"); if(conversationId.current)body.set("conversationId",conversationId.current);
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

  if(!ready)return <Onboarding owner={owner} busy={setupBusy} status={setupStatus} error={error} connect={async()=>{try{await connect()}catch(e){setError(e instanceof Error?e.message:"Connection failed")}}} setup={setup}/>;
  return <main className="shell">
    <header className="topbar"><div className="wordmark">vox<span>.</span></div><button className="network"><i/> X Layer Testnet</button><button className="avatar" aria-label="Wallet">V</button></header>
    <section className="content">
      {tab === "home" && <HomeScreen listening={listening} busy={busy} reply={reply} error={error} portfolio={portfolio} onMic={toggleRecording}/>} 
      {tab === "activity" && <Activity/>}
      {tab === "settings" && <Settings owner={owner} onRevoked={()=>{localStorage.removeItem("voxReady");setReady(false)}}/>}
    </section>
    <nav className="bottom-nav">
      <Nav active={tab==="home"} label="Home" icon={<Home/>} onClick={()=>setTab("home")}/>
      <Nav active={tab==="activity"} label="Activity" icon={<Clock/>} onClick={()=>setTab("activity")}/>
      <Nav active={tab==="settings"} label="Settings" icon={<Sliders/>} onClick={()=>setTab("settings")}/>
    </nav>
  </main>;
}

function Onboarding({owner,busy,status,error,connect,setup}:{owner:string;busy:boolean;status:string;error:string;connect:()=>void;setup:()=>void}){return <main className="shell onboarding"><div className="wordmark">vox<span>.</span></div><div className="onboarding-copy"><div className="eyebrow">WELCOME TO VOX</div><h1>Finance, at the speed of speech.</h1><p>Connect your owner wallet once, authorize a limited testnet session, then speak naturally to act onchain.</p></div><div className="setup-list"><div className={owner?"done":"current"}><b>1</b><span><strong>Connect owner wallet</strong><small>{owner?`${owner.slice(0,6)}…${owner.slice(-4)}`:"X Layer Testnet"}</small></span></div><div className={owner?"current":""}><b>2</b><span><strong>Configure Vox account</strong><small>{status||"Finite test-asset allowances and a 24-hour session"}</small></span></div><div><b>3</b><span><strong>Speak with Vox</strong><small>Every action still needs confirmation</small></span></div></div>{error&&<div className="error">{error}</div>}<button className="primary" disabled={busy} onClick={owner?setup:connect}>{busy?status||"Configuring on X Layer…":owner?"Review & authorize Vox":"Connect wallet"}</button><p className="disclaimer">Only use the disposable X Layer Testnet wallet. If MetaMask labels a request malicious, reject it; Vox will not ask you to bypass that warning.</p></main>}

function Nav({active,label,icon,onClick}:{active:boolean;label:string;icon:React.ReactNode;onClick:()=>void}) { return <button className={active?"active":""} onClick={onClick}>{icon}<span>{label}</span></button>; }

function HomeScreen({listening,busy,reply,error,portfolio,onMic}:{listening:boolean;busy:boolean;reply:VoiceReply|null;error:string;portfolio:{estimatedTestUsd:string;balances:Array<{symbol:string;formatted:string}>}|null;onMic:()=>void}) {
  return <div className="home-screen">
    <div className="eyebrow">TESTNET PORTFOLIO</div><div className="balance">{portfolio?`$${portfolio.estimatedTestUsd}`:"—"}</div><div className="change">{portfolio?portfolio.balances.map(b=>`${Number(b.formatted).toFixed(3)} ${b.symbol}`).join(" · "):"Loading onchain balances…"}</div>
    <div className={`voice-orb ${listening?"listening":""} ${busy?"busy":""}`}><button onClick={onMic} disabled={busy} aria-label={listening?"Stop recording":"Start recording"}><Mic size={34}/></button>{listening && <div className="waves">{[1,2,3,4,5].map(i=><i key={i}/>)}</div>}</div>
    <h1>{listening ? "I’m listening" : busy ? "Understanding…" : "What would you like to do?"}</h1>
    <p className="hint">{listening ? "Tap when you’re finished" : "Tap the microphone and speak naturally"}</p>
    {error && <div className="error">{error}</div>}
    {reply && <div className="reply"><div className="reply-label">VOX UNDERSTOOD</div>{reply.transcript&&<small className="transcript">“{reply.transcript}”</small>}<p>{reply.speak}</p>{reply.plan && <Plan plan={reply.plan} resolved={reply.resolvedActions}/>} {reply.ownerActions?.some(a=>a.ownerTransaction)&&<button className="owner-approve" onClick={async()=>{const accounts=await window.ethereum?.request({method:"eth_requestAccounts"}) as string[];for(const action of reply.ownerActions??[])if(action.ownerTransaction)await window.ethereum?.request({method:"eth_sendTransaction",params:[{from:accounts[0],...action.ownerTransaction}]})}}>Approve with owner wallet</button>}</div>}
    {!reply && <div className="suggestions"><button>“How much OKB do I have?”</button><button>“Send 0.01 OKB to…”</button></div>}
  </div>;
}

function Plan({plan,resolved}:{plan:NonNullable<VoiceReply["plan"]>;resolved?:VoiceReply["resolvedActions"]}) { return <div className="plan">{plan.actions.map((a,i)=>{const q=resolved?.[i];return <div className="plan-row" key={i}><span className="step">{i+1}</span><div><strong>{a.type === "swap" ? `${q?.tokenIn??a.tokenIn} → ${q?.tokenOut??a.tokenOut}` : "Transfer"}</strong><small>{q?`${q.amountIn} → ~${q.expectedOut} · min ${q.minimumOut}`:`${a.amount?.value} ${a.amount?.type === "usd" ? "USD" : a.tokenIn}`}</small>{q&&<small>{q.provider} · {q.network} · 1% slippage</small>}</div><Arrow/></div>})}<div className="auth-note">{resolved?.length?"Session eligible · confirmation required":"Awaiting deterministic quote"}</div></div>; }

function Activity() { const[items,setItems]=useState<Array<{id:string;summary:string;status:string;timestamp:string;transactionHash?:string}>>([]);useEffect(()=>{fetch("/api/activity").then(r=>r.json()).then(d=>setItems(d.activity??[]))},[]);return <div className="page"><div className="eyebrow">HISTORY</div><h1>Activity</h1>{items.length? <div className="activity-list">{items.map(x=><a key={x.id} href={x.transactionHash?`https://www.okx.com/web3/explorer/xlayer-test/tx/${x.transactionHash}`:undefined} target="_blank"><span className="status-dot"/><div><strong>{x.summary}</strong><small>{new Date(x.timestamp).toLocaleString()} · {x.status}</small></div><Arrow/></a>)}</div>:<div className="empty"><Clock size={28}/><h2>No activity yet</h2><p>Your completed onchain actions will appear here with their real transaction status.</p></div>}</div>; }

function Settings({owner,onRevoked}:{owner:string;onRevoked:()=>void}) { const[message,setMessage]=useState("");async function revoke(){try{const tx=await fetch("/api/session/revoke",{method:"POST"}).then(r=>r.json());const hash=await window.ethereum?.request({method:"eth_sendTransaction",params:[{from:owner,to:tx.to,data:tx.data,value:"0x0"}]});setMessage(`Revocation submitted: ${String(hash).slice(0,12)}…`);onRevoked()}catch(e){setMessage(e instanceof Error?e.message:"Revocation failed")}}return <div className="page settings"><div className="eyebrow">CONTROL CENTER</div><h1>Settings</h1><section><h2>Voice</h2><Setting title="Spoken responses" detail="Read plans and results aloud" toggle/><Setting title="Language" detail="Auto-detect"/><Setting title="Shortcut duration" detail="10 seconds"/></section><section><h2>Authorization</h2><Setting title="Voice transactions" detail="Active on X Layer Testnet" toggle/><Setting title="Per-transaction native value" detail="0 OKB; test-token swaps only"/><Setting title="Session expiry" detail="24 hours"/><Setting title="Allowed assets" detail="tETH, tUSDC"/></section><section><h2>Wallet</h2><Setting title="Owner" detail={owner?`${owner.slice(0,8)}…${owner.slice(-6)}`:"Not connected"}/><Setting title="Smart account" detail="0x576a…0b24"/></section><section><h2>Security</h2><button className="revoke" onClick={revoke}>Revoke Vox access</button><p className="fine">{message||"Immediately disables delegated execution. Owner control remains."}</p></section></div>; }
function Setting({title,detail,toggle}:{title:string;detail:string;toggle?:boolean}) { return <div className="setting"><div><strong>{title}</strong><small>{detail}</small></div>{toggle?<span className="toggle"/>:<Arrow/>}</div>; }
