export default function LoadingButton({ loading, children, disabled, ...props }) {
  return (
    <button type="button" disabled={disabled || loading} {...props}>
      {loading ? "等待确认..." : children}
    </button>
  );
}
