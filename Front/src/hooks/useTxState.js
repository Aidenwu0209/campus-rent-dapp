import { useState } from "react";
import { toUserError } from "../utils/errors.js";

const initialTxState = {
  loading: false,
  message: "",
  error: "",
  txHash: ""
};

export function useTxState() {
  const [txState, setTxState] = useState(initialTxState);

  const runTransaction = async (messages, action, afterSuccess) => {
    setTxState({
      loading: true,
      message: messages.pending,
      error: "",
      txHash: ""
    });

    try {
      const { tx } = await action();
      await afterSuccess?.();
      setTxState({
        loading: false,
        message: messages.success,
        error: "",
        txHash: tx.hash
      });
      return true;
    } catch (error) {
      setTxState({
        loading: false,
        message: "",
        error: toUserError(error),
        txHash: ""
      });
      return false;
    }
  };

  return {
    txState,
    runTransaction,
    resetTxState: () => setTxState(initialTxState)
  };
}
