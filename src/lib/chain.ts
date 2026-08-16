import { defineChain } from "viem";

export const xLayerTestnet = defineChain({
  id: 1952,
  name: "X Layer Testnet",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testrpc.xlayer.tech/terigon", "https://xlayertestrpc.okx.com/terigon"] },
  },
  blockExplorers: {
    default: { name: "OKLink", url: "https://www.okx.com/web3/explorer/xlayer-test" },
  },
  testnet: true,
});

export const rpcUrl = process.env.XLAYER_TESTNET_RPC_URL ?? xLayerTestnet.rpcUrls.default.http[0];
