export default function LoadingButton({ loading, children, disabled, type = "button", ...props }) {
  return (
    <button type={type} disabled={disabled || loading} {...props}>
      {loading ? "等待确认..." : children}
    </button>
  );
}
