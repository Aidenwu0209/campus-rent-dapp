import { useEffect, useState } from "react";
import { createCampusRentalContract, campusRentalAddress } from "../services/campusRentalService.js";
import { getBrowserProvider, hasEthereumProvider } from "../services/walletService.js";

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
      const readContract = createCampusRentalContract(provider);
      let writeContract = null;

      if (account) {
        const signer = await provider.getSigner();
        writeContract = createCampusRentalContract(signer);
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
