import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { GANACHE_RPC_URL } from "../app/config.js";
import { createCampusRentalContract, campusRentalAddress } from "../services/campusRentalService.js";
import { getBrowserProvider, hasEthereumProvider } from "../services/walletService.js";

const readProvider = new ethers.JsonRpcProvider(GANACHE_RPC_URL);

export function useCampusRental(account) {
  const [state, setState] = useState({
    readContract: null,
    writeContract: null,
    contractAddress: campusRentalAddress,
    hasProvider: hasEthereumProvider()
  });

  useEffect(() => {
    let cancelled = false;

    async function createContracts() {
      if (!hasEthereumProvider()) {
        setState({
          readContract: null,
          writeContract: null,
          contractAddress: campusRentalAddress,
          hasProvider: false
        });
        return;
      }

      const provider = getBrowserProvider();
      const readContract = createCampusRentalContract(readProvider);
      let writeContract = null;

      if (account) {
        try {
          const signer = await provider.getSigner();
          writeContract = createCampusRentalContract(signer);
        } catch {
          writeContract = null;
        }
      }

      if (!cancelled) {
        setState({
          readContract,
          writeContract,
          contractAddress: campusRentalAddress,
          hasProvider: true
        });
      }
    }

    createContracts().catch(() => {
      if (!cancelled) {
        setState((current) => ({ ...current, writeContract: null }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [account]);

  return state;
}
