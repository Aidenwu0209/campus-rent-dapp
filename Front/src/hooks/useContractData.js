import { useCallback, useEffect, useState } from "react";
import {
  getAllItems,
  getMyPublishedItems,
  getMyRentalRecords
} from "../services/campusRentalService.js";
import { toUserError } from "../utils/errors.js";

export function useContractData(readContract, account) {
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [state, setState] = useState({
    items: [],
    publishedItems: [],
    rentalRecords: [],
    loading: false,
    error: ""
  });

  const refresh = useCallback(() => {
    setRefreshIndex((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (!readContract) {
        setState({
          items: [],
          publishedItems: [],
          rentalRecords: [],
          loading: false,
          error: "请先安装 MetaMask 并确认合约地址已生成"
        });
        return;
      }

      setState((current) => ({ ...current, loading: true, error: "" }));

      try {
        const [items, publishedItems, rentalRecords] = await Promise.all([
          getAllItems(readContract),
          getMyPublishedItems(readContract, account),
          getMyRentalRecords(readContract, account)
        ]);

        if (!cancelled) {
          setState({
            items,
            publishedItems,
            rentalRecords,
            loading: false,
            error: ""
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState((current) => ({
            ...current,
            loading: false,
            error: toUserError(error)
          }));
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [readContract, account, refreshIndex]);

  return {
    ...state,
    refresh
  };
}
