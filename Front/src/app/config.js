export const GANACHE_CHAIN_ID = "1337";
export const GANACHE_RPC_URL = "http://127.0.0.1:7545";
export const SUPPORTED_CHAIN_IDS = [GANACHE_CHAIN_ID];

export function isSupportedLocalChain(chainId) {
  return SUPPORTED_CHAIN_IDS.includes(String(chainId));
}
