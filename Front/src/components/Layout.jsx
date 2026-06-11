export default function Layout({ walletPanel, nav, children }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>校园共享物品租赁平台</h1>
          <p>发布、租赁、押金托管、归还确认和链上记录查询</p>
        </div>
        {walletPanel}
      </header>
      <main className="main-layout">
        {nav}
        <section className="content-panel">{children}</section>
      </main>
    </div>
  );
}
