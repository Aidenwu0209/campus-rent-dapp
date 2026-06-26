import { ethers } from "ethers";
import { GANACHE_CHAIN_ID, GANACHE_RPC_URL } from "../app/config.js";
import { formatEth } from "../utils/format.js";

const ganacheProvider = new ethers.JsonRpcProvider(GANACHE_RPC_URL);

function toHexChainId(chainId) {
  return `0x${Number(chainId).toString(16)}`;
}

export function hasEthereumProvider() {
  return typeof window !== "undefined" && Boolean(window.ethereum);
}

export function getBrowserProvider() {
  if (!hasEthereumProvider()) {
    return null;
  }

  return new ethers.BrowserProvider(window.ethereum);
}

export async function requestWallet() {
  const provider = getBrowserProvider();

  if (!provider) {
    throw new Error("请先安装 MetaMask 钱包");
  }

  const accounts = await provider.send("eth_requestAccounts", []);
  return getWalletSnapshot(accounts[0]);
}

export async function requestAccountSwitch() {
  const provider = getBrowserProvider();

  if (!provider) {
    throw new Error("请先安装 MetaMask 钱包");
  }

  try {
    await provider.send("wallet_revokePermissions", [{ eth_accounts: {} }]);
  } catch (error) {
    if (error?.code === 4001 || error?.code === -32002) {
      throw error;
    }
  }

  const accounts = await provider.send("eth_requestAccounts", []);
  return getWalletSnapshot(accounts[0]);
}

export async function switchToGanacheNetwork() {
  const provider = getBrowserProvider();

  if (!provider) {
    throw new Error("请先安装 MetaMask 钱包");
  }

  const chainId = toHexChainId(GANACHE_CHAIN_ID);

  try {
    await provider.send("wallet_switchEthereumChain", [{ chainId }]);
  } catch (error) {
    if (error?.code !== 4902) {
      throw error;
    }

    await provider.send("wallet_addEthereumChain", [{
      chainId,
      chainName: `Ganache Local ${GANACHE_CHAIN_ID}`,
      rpcUrls: [GANACHE_RPC_URL],
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18
      }
    }]);
  }

  return getWalletSnapshot();
}

export async function getWalletSnapshot(preferredAccount) {
  const provider = getBrowserProvider();

  if (!provider) {
    return {
      account: "",
      chainId: "",
      balance: "",
      isConnected: false
    };
  }

  const accounts = preferredAccount ? [preferredAccount] : await provider.send("eth_accounts", []);
  const account = accounts[0] || "";
  const network = await provider.getNetwork();
  let balance = account ? await provider.getBalance(account) : 0n;

  if (account && network.chainId.toString() === GANACHE_CHAIN_ID) {
    try {
      balance = await ganacheProvider.getBalance(account);
    } catch {
      // Keep the injected-provider balance if the local read RPC is unavailable.
    }
  }

  return {
    account,
    chainId: network.chainId.toString(),
    balance: account ? formatEth(balance) : "",
    isConnected: Boolean(account)
  };
}
