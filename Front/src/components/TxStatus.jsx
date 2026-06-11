export default function TxStatus({ state }) {
  if (!state?.message && !state?.error && !state?.txHash) {
    return null;
  }

  return (
    <div className={state.error ? "tx-status error" : "tx-status"}>
      {state.message && <p>{state.message}</p>}
      {state.error && <p>{state.error}</p>}
      {state.txHash && (
        <p>
          交易哈希：
          <span title={state.txHash}>{state.txHash.slice(0, 10)}...{state.txHash.slice(-8)}</span>
        </p>
      )}
    </div>
  );
}
