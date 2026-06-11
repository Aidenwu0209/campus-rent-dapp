import { useCallback, useEffect, useState } from "react";
import { getWalletSnapshot, hasEthereumProvider, requestWallet } from "../services/walletService.js";
import { toUserError } from "../utils/errors.js";

const initialState = {
  account: "",
  chainId: "",
  balance: "",
  isConnected: false,
  loading: false,
  error: ""
};

export function useWallet() {
  const [wallet, setWallet] = useState(initialState);

  const refreshWallet = useCallback(async (preferredAccount) => {
    try {
      const snapshot = await getWalletSnapshot(preferredAccount);
      setWallet((current) => ({ ...current, ...snapshot, error: "" }));
    } catch (error) {
      setWallet((current) => ({ ...current, error: toUserError(error) }));
    }
  }, []);

  const connectWallet = useCallback(async () => {
    setWallet((current) => ({ ...current, loading: true, error: "" }));

    try {
      const snapshot = await requestWallet();
      setWallet((current) => ({ ...current, ...snapshot, loading: false, error: "" }));
    } catch (error) {
      setWallet((current) => ({ ...current, loading: false, error: toUserError(error) }));
    }
  }, []);

  useEffect(() => {
    refreshWallet();

    if (!hasEthereumProvider()) {
      return undefined;
    }

    const handleAccountsChanged = (accounts) => {
      refreshWallet(accounts[0] || "");
    };

    const handleChainChanged = () => {
      refreshWallet();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [refreshWallet]);

  return {
    ...wallet,
    hasProvider: hasEthereumProvider(),
    connectWallet,
    refreshWallet
  };
}
