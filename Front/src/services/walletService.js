import { ethers } from "ethers";
import { formatEth } from "../utils/format.js";

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
  const balance = account ? await provider.getBalance(account) : 0n;

  return {
    account,
    chainId: network.chainId.toString(),
    balance: account ? formatEth(balance) : "",
    isConnected: Boolean(account)
  };
}
