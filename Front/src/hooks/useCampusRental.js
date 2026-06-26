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
    hasProvider: hasEthereumProvider(),
    writeMode: "",
    writeError: ""
  });

  useEffect(() => {
    let cancelled = false;

    async function createContracts() {
      if (!hasEthereumProvider()) {
        setState({
          readContract: createCampusRentalContract(readProvider),
          writeContract: null,
          contractAddress: campusRentalAddress,
          hasProvider: false,
          writeMode: "",
          writeError: "请先安装 MetaMask 选择一个 Ganache 测试账户"
        });
        return;
      }

      const provider = getBrowserProvider();
      const readContract = createCampusRentalContract(readProvider);
      let writeContract = null;
      let writeMode = "";
      let writeError = "";

      if (account) {
        try {
          const localSigner = await readProvider.getSigner(account);
          writeContract = createCampusRentalContract(localSigner);
          writeMode = "ganache-local";
        } catch {
          try {
            const signer = await provider.getSigner();
            writeContract = createCampusRentalContract(signer);
            writeMode = "metamask";
          } catch {
            writeContract = null;
            writeError = "当前账户不是 Ganache 本地解锁账户，请切换到 npm run ganache 输出的测试账户";
          }
        }
      }

      if (!cancelled) {
        setState({
          readContract,
          writeContract,
          contractAddress: campusRentalAddress,
          hasProvider: true,
          writeMode,
          writeError
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
