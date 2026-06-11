# API 契约：前端与智能合约调用契约

> 本项目没有传统 REST API。本文档中的 API 指前端与 Solidity 合约之间的 ABI 调用契约、事件契约、数据字段契约和错误处理契约。

## 1. 基本约定

1. 所有金额在合约中使用 wei。
2. 前端表单输入和页面展示使用 ETH。
3. 前端调用交易函数时必须通过 signer。
4. 前端调用 view 函数时可以通过 provider 或 signer。
5. 合约地址由 `Front/src/contracts/campusRentalAddress.json` 提供。
6. 合约 ABI 由 `Front/src/contracts/CampusRental.json` 提供。
7. 前端不能发明不存在的合约字段或函数。

## 2. 状态枚举契约

### 2.1 ItemStatus

| 数值 | 合约枚举 | 页面中文显示 | 含义 |
|---:|---|---|---|
| 0 | Available | 可租赁 | 物品已上架且未出租 |
| 1 | Rented | 已租赁 | 物品正在出租中 |
| 2 | ReturnRequested | 待确认归还 | 租赁者已申请归还，等待发布者确认 |
| 3 | Unlisted | 已下架 | 发布者已下架，不能再租赁 |

### 2.2 RentalStatus

| 数值 | 合约枚举 | 页面中文显示 | 含义 |
|---:|---|---|---|
| 0 | Active | 租赁中 | 租赁已经开始，尚未申请归还 |
| 1 | ReturnRequested | 待确认归还 | 租赁者已申请归还 |
| 2 | Completed | 已完成 | 发布者已确认归还，资金已结算 |

前端状态映射必须严格遵守以上顺序。

## 3. 合约函数契约

### 3.1 createItem

```solidity
function createItem(
    string memory name,
    string memory description,
    uint256 rentPerDay,
    uint256 deposit,
    uint256 maxRentalDays
) external returns (uint256 itemId);
```

前端调用：

```javascript
await contract.createItem(name, description, rentPerDayWei, depositWei, maxRentalDays);
```

输入规则：

- name：非空字符串。
- description：非空字符串。
- rentPerDayWei：大于 0。
- depositWei：大于 0。
- maxRentalDays：正整数。

成功结果：

- 生成 itemId。
- 物品状态为 Available。
- 触发 ItemCreated 事件。

### 3.2 rentItem

```solidity
function rentItem(uint256 itemId, uint256 rentDays) external payable returns (uint256 rentalId);
```

前端调用：

```javascript
const totalPayment = rentPerDayWei * BigInt(rentDays) + depositWei;
await contract.rentItem(itemId, rentDays, { value: totalPayment });
```

输入规则：

- itemId 存在。
- rentDays 是正整数。
- rentDays <= maxRentalDays。
- msg.value 必须等于租金总额加押金。

成功结果：

- 生成 rentalId。
- 物品状态变为 Rented。
- 租赁记录状态为 Active。
- 合约托管租金和押金。
- 触发 ItemRented 事件。

### 3.3 requestReturn

```solidity
function requestReturn(uint256 rentalId) external;
```

前端调用：

```javascript
await contract.requestReturn(rentalId);
```

输入规则：

- rentalId 存在。
- 当前账户必须是该租赁记录的 renter。
- 租赁记录状态必须是 Active。

成功结果：

- 租赁记录状态变为 ReturnRequested。
- 物品状态变为 ReturnRequested。
- 触发 ReturnRequested 事件。

### 3.4 confirmReturn

```solidity
function confirmReturn(uint256 rentalId) external;
```

前端调用：

```javascript
await contract.confirmReturn(rentalId);
```

输入规则：

- rentalId 存在。
- 当前账户必须是物品 owner。
- 租赁记录状态必须是 ReturnRequested。

成功结果：

- 押金退给 renter。
- 租金转给 owner。
- 租赁记录状态变为 Completed。
- 物品状态恢复 Available。
- activeRentalByItem[itemId] 清零。
- 触发 ReturnConfirmed 事件。

### 3.5 unlistItem

```solidity
function unlistItem(uint256 itemId) external;
```

前端调用：

```javascript
await contract.unlistItem(itemId);
```

输入规则：

- itemId 存在。
- 当前账户必须是物品 owner。
- 物品状态必须是 Available。

成功结果：

- 物品状态变为 Unlisted。
- 触发 ItemUnlisted 事件。

## 4. 查询函数契约

### 4.1 getItem

```solidity
function getItem(uint256 itemId) external view returns (Item memory);
```

返回字段：

| 字段 | 类型 | 前端用途 |
|---|---|---|
| id | uint256 | 物品编号 |
| owner | address | 发布者地址 |
| name | string | 物品名称 |
| description | string | 物品描述 |
| rentPerDay | uint256 | 日租金，展示时转 ETH |
| deposit | uint256 | 押金，展示时转 ETH |
| maxRentalDays | uint256 | 最大租赁天数 |
| status | ItemStatus | 状态标签 |
| createdAt | uint256 | 发布时间 |

### 4.2 getRental

```solidity
function getRental(uint256 rentalId) external view returns (RentalRecord memory);
```

返回字段：

| 字段 | 类型 | 前端用途 |
|---|---|---|
| id | uint256 | 租赁记录编号 |
| itemId | uint256 | 关联物品 |
| renter | address | 租赁者地址 |
| rentDays | uint256 | 租赁天数 |
| rentAmount | uint256 | 租金总额 |
| depositAmount | uint256 | 押金 |
| startTime | uint256 | 开始时间 |
| returnRequestedAt | uint256 | 申请归还时间 |
| completedAt | uint256 | 完成时间 |
| status | RentalStatus | 租赁状态 |

### 4.3 列表查询

优先实现：

```solidity
function getAllItems() external view returns (Item[] memory);
function getAvailableItems() external view returns (Item[] memory);
function getMyPublishedItems(address user) external view returns (Item[] memory);
function getMyRentalRecords(address user) external view returns (RentalRecord[] memory);
```

如果数组结构体返回导致前端处理困难，可以改为返回 id 数组：

```solidity
function getAllItemIds() external view returns (uint256[] memory);
function getMyPublishedItemIds(address user) external view returns (uint256[] memory);
function getMyRentalRecordIds(address user) external view returns (uint256[] memory);
```

然后前端逐个调用 getItem / getRental。选一种实现即可，但前端必须能完整展示列表。

## 5. 事件契约

事件用于测试断言、后续报告截图和链上记录说明。

```solidity
event ItemCreated(uint256 indexed itemId, address indexed owner, string name, uint256 rentPerDay, uint256 deposit);
event ItemUnlisted(uint256 indexed itemId, address indexed owner);
event ItemRented(uint256 indexed rentalId, uint256 indexed itemId, address indexed renter, uint256 rentDays, uint256 paidAmount);
event ReturnRequested(uint256 indexed rentalId, uint256 indexed itemId, address indexed renter);
event ReturnConfirmed(uint256 indexed rentalId, uint256 indexed itemId, address indexed owner, address renter, uint256 rentAmount, uint256 depositAmount);
```

前端当前阶段不强制显示事件列表，但测试中应检查关键事件是否触发。

## 6. 错误格式与前端处理

合约使用 require revert 字符串。前端将错误转换为中文提示。

| 合约错误或钱包错误 | 前端提示 |
|---|---|
| User denied transaction signature | 用户取消了钱包确认 |
| Incorrect payment amount | 支付金额不正确，请检查租赁天数、租金和押金 |
| Only item owner can operate | 只有物品发布者可以执行该操作 |
| Only renter can operate | 只有当前租赁者可以执行该操作 |
| Item is not available | 物品当前不可租赁 |
| Item owner cannot rent own item | 发布者不能租赁自己的物品 |
| insufficient funds | 钱包余额不足 |

前端不要把原始错误完整堆在页面上，控制台可以输出原始错误，页面显示中文摘要。

## 7. 时间格式

合约中时间使用 Unix timestamp，单位秒。

前端显示使用本地时间格式，例如：

```javascript
new Date(Number(timestamp) * 1000).toLocaleString()
```

当时间字段为 0 时，页面显示“未发生”或“-”。

## 8. 地址格式

页面展示地址时使用缩略格式：

```text
0x1234...abcd
```

完整地址可放在 title 属性或详情中。

## 9. 版本策略

当前为课程项目 v1，不做多版本 API。若修改合约函数签名，必须同步修改：

1. 合约测试。
2. 前端 services。
3. 前端 models。
4. 本文档。
