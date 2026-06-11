export const SUPPORTED_CHAIN_IDS = ["1337", "5777"];

export function isSupportedLocalChain(chainId) {
  return !chainId || SUPPORTED_CHAIN_IDS.includes(String(chainId));
}
