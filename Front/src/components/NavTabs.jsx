export default function NavTabs({ tabs, activeTab, onChange }) {
  return (
    <nav className="nav-tabs" aria-label="主要页面">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={tab.id === activeTab ? "nav-tab active" : "nav-tab"}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
