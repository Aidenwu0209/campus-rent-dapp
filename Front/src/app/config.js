const DEFAULT_CHAIN_ID = "1337";
const DEFAULT_RPC_PORT = "7545";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);

function getRuntimeRpcHost() {
  if (typeof window === "undefined") {
    return "127.0.0.1";
  }

  const hostname = window.location.hostname;
  return LOCAL_HOSTNAMES.has(hostname) ? "127.0.0.1" : hostname;
}

function getSupportedChainIds(value) {
  return value
    .split(",")
    .map((chainId) => chainId.trim())
    .filter(Boolean);
}

export const GANACHE_CHAIN_ID = import.meta.env.VITE_GANACHE_CHAIN_ID || DEFAULT_CHAIN_ID;
export const GANACHE_RPC_URL = import.meta.env.VITE_GANACHE_RPC_URL
  || `http://${getRuntimeRpcHost()}:${import.meta.env.VITE_GANACHE_RPC_PORT || DEFAULT_RPC_PORT}`;
export const SUPPORTED_CHAIN_IDS = getSupportedChainIds(
  import.meta.env.VITE_SUPPORTED_CHAIN_IDS || GANACHE_CHAIN_ID
);

export function isSupportedLocalChain(chainId) {
  return SUPPORTED_CHAIN_IDS.includes(String(chainId));
}
