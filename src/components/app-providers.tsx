"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { xLayerTestnet } from "@/lib/chain";

export function AppProviders({children}:{children:React.ReactNode}) {
  const appId=process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  // VoxApp uses Privy's hooks, so rendering it without a provider produces a
  // client-side crash that looks like a broken backend. Fail visibly instead.
  if(!appId) return <main className="shell auth-screen"><div className="wordmark">vox<span>.</span></div><div className="config-notice"><h1>Sign-in needs configuration</h1><p>Set <code>NEXT_PUBLIC_PRIVY_APP_ID</code> and restart the app.</p></div></main>;
  return <PrivyProvider appId={appId} config={{
    loginMethods:["email","google","wallet"],
    appearance:{theme:"light",accentColor:"#000000",logo:"/icon.svg"},
    embeddedWallets:{ethereum:{createOnLogin:"all-users"}},
    supportedChains:[xLayerTestnet],
    defaultChain:xLayerTestnet,
  }}>{children}</PrivyProvider>;
}
