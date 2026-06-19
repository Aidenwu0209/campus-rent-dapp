export default function NavTabs({ tabs, activeTab, onChange }) {
  return (
    <nav className="nav-tabs" aria-label="主要页面">
      {tabs.map((tab, index) => {
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            className={tab.id === activeTab ? "nav-tab active" : "nav-tab"}
            onClick={() => onChange(tab.id)}
          >
            {Icon ? <Icon className="nav-tab-icon" aria-hidden="true" size={21} /> : (
              <span className="nav-tab-index">{String(index + 1).padStart(2, "0")}</span>
            )}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
