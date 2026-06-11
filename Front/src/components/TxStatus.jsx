export default function TxStatus({ state }) {
  if (!state?.message && !state?.error && !state?.txHash) {
    return null;
  }

  const statusClass = state.error
    ? "tx-status error"
    : state.loading
      ? "tx-status pending"
      : "tx-status success";

  return (
    <div className={statusClass}>
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
