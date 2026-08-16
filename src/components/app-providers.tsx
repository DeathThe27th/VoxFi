"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { xLayerTestnet } from "@/lib/chain";

export function AppProviders({children}:{children:React.ReactNode}) {
  const appId=process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if(!appId) return children;
  return <PrivyProvider appId={appId} config={{
    loginMethods:["email","google","wallet"],
    appearance:{theme:"light",accentColor:"#171815",logo:"/icon.svg"},
    embeddedWallets:{ethereum:{createOnLogin:"all-users"}},
    supportedChains:[xLayerTestnet],
    defaultChain:xLayerTestnet,
  }}>{children}</PrivyProvider>;
}
