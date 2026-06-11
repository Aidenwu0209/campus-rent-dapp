# 前端模式与约定

## 1. 技术栈

前端使用 React + Vite。链上交互使用 ethers.js。钱包使用 MetaMask。

当前阶段目标是稳定调用合约和完成演示闭环，不追求复杂 UI 框架。可以使用普通 CSS 或 CSS Modules，不引入大型组件库，除非已有项目结构需要。

## 2. 分层设计

### 2.1 pages 层

pages 层只负责页面组合和展示框架，不直接写复杂合约调用逻辑。

建议页面：

```text
Front/src/pages/
├── HomePage.jsx            # 物品列表和租赁入口
├── PublishPage.jsx         # 发布物品
├── MyPublishedPage.jsx     # 我的发布、确认归还、下架
└── MyRentalsPage.jsx       # 我的租赁、申请归还
```

页面层可以调用 hooks 或 services，但不要把 ABI 解析、provider 初始化、合约实例创建等逻辑直接堆在页面组件中。

### 2.2 features 层

features 层按业务能力组织。

```text
Front/src/features/
├── wallet/
│   ├── WalletPanel.jsx
│   └── walletTypes.js
├── items/
│   ├── ItemList.jsx
│   ├── ItemCard.jsx
│   ├── PublishItemForm.jsx
│   └── itemMappers.js
└── rentals/
    ├── RentalList.jsx
    ├── RentalCard.jsx
    └── rentalMappers.js
```

features 层可以包含与某个业务能力强相关的组件、数据转换函数和局部状态。

### 2.3 components 层

components 层放通用 UI，不直接耦合具体合约函数。

建议组件：

```text
Front/src/components/
├── Layout.jsx
├── NavTabs.jsx
├── StatusBadge.jsx
├── TxStatus.jsx
├── EmptyState.jsx
├── ErrorMessage.jsx
└── LoadingButton.jsx
```

### 2.4 hooks 层

hooks 层封装可复用状态和合约读取逻辑。

```text
Front/src/hooks/
├── useWallet.js            # 连接钱包、监听账户和网络变化
├── useCampusRental.js      # 创建合约实例
└── useContractData.js      # 读取物品和租赁记录
```

### 2.5 services 层

services 层统一放链上读写函数。页面和业务组件不要直接散落调用 contract.methods 或 contract.function。

```text
Front/src/services/
├── walletService.js
└── campusRentalService.js
```

campusRentalService 至少封装：

1. getAllItems
2. getAvailableItems
3. getMyPublishedItems
4. getMyRentalRecords
5. createItem
6. rentItem
7. requestReturn
8. confirmReturn
9. unlistItem

### 2.6 models 层

models 层统一放状态枚举、字段映射和前端视图模型。

```text
Front/src/models/status.js
```

状态命名必须和合约枚举顺序对应。

```javascript
export const ITEM_STATUS = {
  0: 'Available',
  1: 'Rented',
  2: 'ReturnRequested',
  3: 'Unlisted',
};

export const RENTAL_STATUS = {
  0: 'Active',
  1: 'ReturnRequested',
  2: 'Completed',
};
```

### 2.7 utils 层

utils 层放纯工具函数。

```text
Front/src/utils/
├── format.js               # ETH / wei 转换、地址缩略
└── errors.js               # 合约错误信息转为用户可读提示
```

## 3. 状态管理

本项目不需要 Redux。优先使用 React useState、useEffect、useMemo、useCallback。

钱包状态由 useWallet 维护：

- account
- chainId
- balance
- isConnected
- connectWallet
- disconnectWallet 或 resetWalletState

链上数据状态由 useContractData 或页面局部状态维护：

- items
- publishedItems
- rentalRecords
- loading
- error
- refresh

交易状态可以统一使用：

```javascript
const txState = {
  loading: false,
  message: '',
  error: null,
  txHash: '',
};
```

## 4. 数据请求规则

1. 所有合约调用必须通过 services 或 hooks 封装。
2. 页面组件不直接读取 ABI 文件。
3. 页面组件不直接 new ethers.Contract。
4. 所有写交易必须使用 signer。
5. 所有读函数可以使用 provider 或 signer。
6. 交易完成必须 `await tx.wait()` 后刷新数据。
7. 用户切换账户或网络后必须刷新页面数据或重置数据状态。

## 5. 界面约定

### 5.1 页面布局

页面建议采用顶部导航 + 主内容区布局。

顶部显示：

- 项目名称：校园共享物品租赁平台。
- 当前钱包地址。
- 当前网络 ID。
- 合约地址。
- 连接钱包按钮。

主内容区显示：

- 物品列表。
- 发布物品表单。
- 我的发布。
- 我的租赁。

### 5.2 表单

发布物品表单字段：

- name：必填。
- description：必填。
- rentPerDayEth：必填，大于 0。
- depositEth：必填，大于 0。
- maxRentalDays：必填，正整数。

租赁表单字段：

- rentDays：必填，正整数，不能超过 maxRentalDays。

前端校验用于提升体验，合约仍需进行最终校验。

### 5.3 loading

按钮点击后进入 loading 状态，避免重复点击。交易等待期间显示“交易确认中”或“等待链上确认”。

### 5.4 error

捕获 MetaMask 拒绝交易、合约 revert、网络错误和 ABI / 地址缺失错误。错误信息要转换为用户可理解的中文提示。

示例：

- 用户拒绝交易：用户取消了钱包确认。
- insufficient funds：账户余额不足。
- execution reverted：合约校验未通过，请检查状态、权限或支付金额。

### 5.5 permission

当前账户不是发布者时，不显示或禁用“确认归还”“下架”按钮。

当前账户不是租赁者时，不显示或禁用“申请归还”按钮。

发布者查看自己发布的物品时，不允许租赁自己的物品。

## 6. 命名与目录规则

1. React 组件使用 PascalCase，例如 `ItemCard.jsx`。
2. hooks 使用 use 前缀，例如 `useWallet.js`。
3. services 使用 camelCase，例如 `campusRentalService.js`。
4. 工具函数使用 camelCase。
5. 状态枚举常量使用大写下划线，例如 `ITEM_STATUS`。
6. 不要在同一文件中混合过多职责。
7. 新增文件必须放入对应目录，不要直接堆在 src 根目录。

## 7. 前端验收标准

1. 页面能正常启动。
2. MetaMask 能连接。
3. 页面能显示当前账户和合约地址。
4. 页面能读取链上物品列表。
5. 页面能发布物品。
6. 页面能租赁物品并支付租金和押金。
7. 页面能申请归还。
8. 页面能确认归还。
9. 页面能显示我的发布和我的租赁。
10. 所有交易成功后页面自动刷新。
11. 错误场景有可读提示。
12. 页面无明显控制台报错。
