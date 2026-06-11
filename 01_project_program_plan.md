# 基于区块链的校园共享物品租赁平台：程序开发目标书

> 当前阶段只完成程序部分，不完成课程设计报告。程序部分要为后续报告、PPT、答辩提供可截图、可测试、可演示的证据。

## 1. 选题

选题一：基于区块链的校园共享物品租赁平台。

系统目标：面向校园闲置物品共享场景，实现一个基于 Solidity 智能合约的去中心化物品租赁平台。系统通过链上合约完成物品发布、租赁交易、押金托管、归还申请、发布者确认归还、押金退款和租赁记录存证。前端通过钱包连接本地区块链网络，用户可以在网页中完成完整租赁流程。

## 2. 项目要解决的问题

校园内存在充电宝、教材、计算器、摄影器材、运动器材等闲置物品。传统线下租赁通常存在以下问题：

1. 物品信息分散，发布和查询不方便。
2. 押金由个人私下保管，容易出现退款争议。
3. 租赁状态不透明，同一物品可能被重复租赁。
4. 归还确认缺少可靠记录。
5. 租赁双方发生争议时缺少可追溯证据。

本项目用智能合约托管关键流程，让物品发布、租赁、押金锁定、归还申请、确认归还、押金退款和租赁记录全部由合约执行或记录。

## 3. 用户角色

### 3.1 物品发布者

发布自己的闲置物品，设置物品名称、描述、日租金、押金、最大租赁天数。发布者可以下架未出租物品，可以确认租赁者归还物品。确认归还后，合约将押金退回租赁者，将租金转给发布者。

### 3.2 租赁者

浏览可租赁物品，选择租赁天数并支付租金和押金。使用完物品后，租赁者发起归还申请，等待发布者确认。

### 3.3 智能合约

合约作为链上业务执行层，负责保存核心数据、校验权限、校验状态、锁定押金、发放租金、退还押金、记录事件日志。

## 4. 当前阶段交付范围

本阶段只交付程序，不做课程设计报告。程序交付包括：

1. Solidity 智能合约。
2. Truffle 编译、迁移、测试环境。
3. Ganache 本地链部署能力。
4. React + Vite 前端页面。
5. MetaMask 钱包连接与交易交互。
6. 合约 ABI 和部署地址同步到前端。
7. 自动化测试用例。
8. README 运行说明。
9. 可用于后续报告和答辩的运行截图目录占位说明。

## 5. 推荐技术栈

智能合约：Solidity ^0.8.20。

开发框架：Truffle。

本地链：Ganache，建议端口 7545；兼容 8545 可选。

前端：React + Vite。

链上交互库：ethers.js v6 或 v5，优先使用 v6。

钱包：MetaMask。

测试：Truffle test + Mocha/Chai。

包管理：npm。

## 6. 推荐项目目录

```text
project-root/
├── AGENTS.md
├── README.md
├── package.json
├── truffle-config.js
├── contracts/
│   ├── Migrations.sol
│   └── CampusRental.sol
├── migrations/
│   ├── 1_initial_migration.js
│   └── 2_deploy_campus_rental.js
├── test/
│   └── campusRental.test.js
├── docs/
│   ├── architecture.md
│   ├── frontend-patterns.md
│   ├── backend-patterns.md
│   ├── api-contract.md
│   └── core-flows.md
└── Front/
    ├── package.json
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── app/
        ├── pages/
        ├── features/
        ├── components/
        ├── hooks/
        ├── services/
        ├── models/
        ├── utils/
        └── contracts/
            ├── CampusRental.json
            └── campusRentalAddress.json
```

## 7. 智能合约功能要求

合约名称建议为 `CampusRental`。

### 7.1 上链数据要素

物品数据至少包括：

- itemId：物品编号。
- owner：发布者地址。
- name：物品名称。
- description：物品描述。
- rentPerDay：日租金，单位 wei。
- deposit：押金，单位 wei。
- maxRentalDays：最大租赁天数。
- status：物品状态。
- createdAt：发布时间。

租赁记录至少包括：

- rentalId：租赁记录编号。
- itemId：关联物品编号。
- renter：租赁者地址。
- rentDays：租赁天数。
- rentAmount：租金总额。
- depositAmount：押金金额。
- startTime：租赁开始时间。
- returnRequestedAt：申请归还时间。
- completedAt：完成时间。
- status：租赁状态。

### 7.2 状态枚举

建议使用枚举，不要使用字符串状态。

```solidity
enum ItemStatus {
    Available,
    Rented,
    ReturnRequested,
    Unlisted
}

enum RentalStatus {
    Active,
    ReturnRequested,
    Completed
}
```

### 7.3 必须实现的合约函数

```solidity
function createItem(
    string memory name,
    string memory description,
    uint256 rentPerDay,
    uint256 deposit,
    uint256 maxRentalDays
) external returns (uint256 itemId);
```

发布物品。要求租金、押金、最大租赁天数必须大于 0。

```solidity
function rentItem(uint256 itemId, uint256 rentDays) external payable returns (uint256 rentalId);
```

租赁物品。要求物品存在、处于 Available、未下架、租赁者不是发布者、租赁天数合法、支付金额等于 `rentPerDay * rentDays + deposit`。

```solidity
function requestReturn(uint256 rentalId) external;
```

租赁者申请归还。要求调用者是当前租赁者，租赁记录处于 Active。

```solidity
function confirmReturn(uint256 rentalId) external;
```

发布者确认归还。要求调用者是物品发布者，租赁记录处于 ReturnRequested。确认后押金退回租赁者，租金转给发布者，租赁记录变为 Completed，物品恢复 Available。

```solidity
function unlistItem(uint256 itemId) external;
```

发布者下架物品。要求调用者是发布者，且物品未处于出租状态。

```solidity
function getItem(uint256 itemId) external view returns (...);
function getRental(uint256 rentalId) external view returns (...);
function getAllItems() external view returns (...);
function getAvailableItems() external view returns (...);
function getMyPublishedItems(address user) external view returns (...);
function getMyRentalRecords(address user) external view returns (...);
function getActiveRentalByItem(uint256 itemId) external view returns (uint256);
```

查询函数可以根据 Solidity 返回结构体数组的可用性自行设计。重点是前端可以正常读取数据。

### 7.4 必须实现的权限和安全规则

1. 发布者不能租赁自己的物品。
2. 只有 Available 状态的物品可以被租赁。
3. 已租赁物品不能重复租赁。
4. 已下架物品不能被租赁。
5. 租赁时支付金额必须等于租金加押金。
6. 只有租赁者可以申请归还。
7. 只有发布者可以确认归还。
8. 确认归还后押金退回租赁者。
9. 确认归还后租金转给发布者。
10. 资金转账采用 checks-effects-interactions 顺序。
11. 关键操作必须触发 event。

### 7.5 必须实现的事件

```solidity
event ItemCreated(uint256 indexed itemId, address indexed owner, string name, uint256 rentPerDay, uint256 deposit);
event ItemUnlisted(uint256 indexed itemId, address indexed owner);
event ItemRented(uint256 indexed rentalId, uint256 indexed itemId, address indexed renter, uint256 rentDays, uint256 paidAmount);
event ReturnRequested(uint256 indexed rentalId, uint256 indexed itemId, address indexed renter);
event ReturnConfirmed(uint256 indexed rentalId, uint256 indexed itemId, address indexed owner, address renter, uint256 rentAmount, uint256 depositAmount);
```

## 8. 前端功能要求

前端不需要做复杂后台系统，但必须真实调用链上合约，不能只写静态页面。

### 8.1 页面模块

至少实现以下页面或模块：

1. 首页 / 物品列表页：展示所有物品或可租赁物品。
2. 发布物品页：输入名称、描述、日租金、押金、最大租赁天数，调用 `createItem`。
3. 物品卡片 / 详情模块：展示状态、发布者、租金、押金、最大租赁天数，支持输入租赁天数并调用 `rentItem`。
4. 我的租赁页：展示当前钱包租赁过的记录，支持调用 `requestReturn`。
5. 我的发布页：展示当前钱包发布的物品，支持 `unlistItem` 和 `confirmReturn`。
6. 顶部钱包区域：连接 MetaMask，显示当前地址、网络 ID、合约地址。

### 8.2 前端状态要求

每个关键操作都要有以下状态处理：

- loading：交易等待中。
- success：交易成功，刷新链上数据。
- error：交易失败，显示可读错误。
- empty：暂无物品或暂无记录。
- permission：当前账户不是操作所需角色时，按钮置灰或提示不可操作。

### 8.3 单位转换要求

前端输入使用 ETH，传给合约前转换为 wei。链上读取的 wei 在页面显示为 ETH。

示例：

- 用户输入租金：0.01 ETH。
- 前端调用 `parseEther("0.01")`。
- 页面展示时调用 `formatEther(value)`。

## 9. 测试要求

至少实现 12 个 Truffle 测试用例。

| 编号 | 测试内容 | 预期结果 |
|---|---|---|
| TC01 | 发布物品成功 | 物品创建成功，状态为 Available |
| TC02 | 发布物品参数非法 | 交易失败 |
| TC03 | 查询物品列表 | 返回已发布物品 |
| TC04 | 租赁者支付正确金额租赁 | 租赁成功，状态变为 Rented |
| TC05 | 支付金额不足 | 交易失败 |
| TC06 | 已出租物品再次租赁 | 交易失败 |
| TC07 | 发布者租赁自己的物品 | 交易失败 |
| TC08 | 非租赁者申请归还 | 交易失败 |
| TC09 | 租赁者申请归还 | 状态变为 ReturnRequested |
| TC10 | 非发布者确认归还 | 交易失败 |
| TC11 | 发布者确认归还 | 押金退回，租金转给发布者 |
| TC12 | 下架未出租物品 | 下架成功 |
| TC13 | 下架已出租物品 | 交易失败 |

## 10. 与评分标准的对应关系

| 评分项 | 分值 | 程序阶段必须完成的内容 | 验收证据 |
|---|---:|---|---|
| 需求分析与设计 | 15 | 用 docs 文件明确需求、架构、模块、流程 | docs/architecture.md、docs/core-flows.md |
| 合约编写：上链数据与核心逻辑 | 15 | 完成 CampusRental.sol，包含物品、租赁、押金、归还、权限、事件 | 合约源码、测试通过 |
| 合约编译部署 | 10 | Truffle compile、migrate 成功，部署到 Ganache | 命令行输出、合约地址、Ganache 交易记录 |
| 代码结构与注释 | 5 | 合约结构清晰、函数命名规范、关键逻辑注释 | 代码审查 |
| 前端页面与区块链网络连通 | 10 | 前端读取 ABI 和合约地址，能读取链上物品数据 | 页面显示链上物品、网络、合约地址 |
| 页面连接钱包并交互 | 5 | MetaMask 连接、切换账号、发起交易 | 连接钱包与交易弹窗截图 |
| 合约功能调用正常 | 5 | 前端完成发布、租赁、申请归还、确认归还、查询 | 浏览器完整流程演示 |
| 整体测试稳定 | 5 | Truffle 测试覆盖成功与失败场景 | `truffle test` 全部通过 |
| 答辩演示准备 | 10 中的程序部分 | 系统可按 A/B 账号完成完整流程 | README 演示流程、前端运行稳定 |

课程设计报告的 20 分暂不在本阶段完成，但本阶段的 docs、截图、测试输出会为后续报告提供材料。

## 11. 程序验收标准

### 11.1 命令行验收

在项目根目录执行：

```bash
npm install
truffle compile
truffle migrate --network development --reset
truffle test
```

全部应成功。

进入前端目录执行：

```bash
cd Front
npm install
npm run dev
```

浏览器打开 Vite 地址，页面应正常显示。

### 11.2 浏览器人工验收

人工演示必须跑通：

1. 启动 Ganache。
2. 部署合约。
3. 启动前端。
4. 连接 MetaMask 账号 A。
5. 账号 A 发布物品“校园充电宝”。
6. 页面物品列表出现该物品，状态为 Available。
7. 切换 MetaMask 账号 B。
8. 账号 B 租赁该物品，支付租金和押金。
9. 页面状态变为 Rented。
10. 账号 B 在“我的租赁”中申请归还。
11. 页面状态变为 ReturnRequested。
12. 切换回账号 A。
13. 账号 A 在“我的发布”中确认归还。
14. 页面显示物品恢复 Available，租赁记录变为 Completed。
15. MetaMask 或 Ganache 中可看到相关交易记录。

### 11.3 不接受的情况

1. 只有静态前端，没有真实合约调用。
2. 只在 Remix 中运行，没有 Truffle 项目。
3. 合约不能部署到 Ganache。
4. 钱包不能连接或交易不能发起。
5. 前端数据写死，不读取链上数据。
6. 没有测试用例。
7. 只做成功流程，不处理权限错误和金额错误。
8. 押金和租金没有经过合约托管。

## 12. 开发优先级

第一优先级：合约核心闭环。先保证发布、租赁、申请归还、确认归还、资金流转和查询能跑通。

第二优先级：Truffle 部署和测试。必须能一键 compile、migrate、test。

第三优先级：前端连接钱包和读取链上数据。不能做假数据。

第四优先级：前端完成完整操作流程。页面简洁即可，但流程必须稳定。

第五优先级：美化界面、补充 README 和运行截图说明。
