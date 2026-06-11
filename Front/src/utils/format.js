import { ethers } from "ethers";

export function shortAddress(address) {
  if (!address) {
    return "-";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatEth(value) {
  if (value === undefined || value === null || value === "") {
    return "0";
  }

  const formatted = ethers.formatEther(value);
  return Number(formatted).toString();
}

export function parseEth(value) {
  return ethers.parseEther(String(value || "0"));
}

export function formatTimestamp(timestamp) {
  const normalized = Number(timestamp);

  if (!normalized) {
    return "-";
  }

  return new Date(normalized * 1000).toLocaleString();
}

export function sameAddress(left, right) {
  return Boolean(left && right && left.toLowerCase() === right.toLowerCase());
}
