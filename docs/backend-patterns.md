# 后端模式与约定：Solidity 合约层

> 本项目没有传统服务器后端。本文档中的 Back 指 Solidity 智能合约、Truffle 部署脚本、Ganache 本地链和合约测试。

## 1. 技术栈

合约语言：Solidity ^0.8.20。

开发框架：Truffle。

本地链：Ganache。

测试框架：Truffle test + Mocha/Chai。

## 2. 合约分层设计

CampusRental.sol 内部按以下顺序组织代码：

1. SPDX 和 pragma。
2. contract 声明。
3. enum 状态定义。
4. struct 数据结构定义。
5. state variables 存储变量。
6. events 事件。
7. modifiers 权限和存在性校验。
8. constructor，如无必要可不写。
9. write functions 写入函数。
10. view functions 查询函数。
11. internal helper functions 内部工具函数。

不要把查询逻辑、资金逻辑、权限逻辑混成难以阅读的超长函数。核心写入函数必须有清楚注释。

## 3. 数据结构规范

### 3.1 Item

```solidity
struct Item {
    uint256 id;
    address payable owner;
    string name;
    string description;
    uint256 rentPerDay;
    uint256 deposit;
    uint256 maxRentalDays;
    ItemStatus status;
    uint256 createdAt;
}
```

### 3.2 RentalRecord

```solidity
struct RentalRecord {
    uint256 id;
    uint256 itemId;
    address payable renter;
    uint256 rentDays;
    uint256 rentAmount;
    uint256 depositAmount;
    uint256 startTime;
    uint256 returnRequestedAt;
    uint256 completedAt;
    RentalStatus status;
}
```

### 3.3 状态枚举

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

状态枚举顺序不能随意调整，因为前端会按数字枚举映射显示。

## 4. 存储变量规范

建议使用：

```solidity
uint256 private nextItemId;
uint256 private nextRentalId;

mapping(uint256 => Item) private items;
mapping(uint256 => RentalRecord) private rentals;
mapping(uint256 => uint256) private activeRentalByItem;
mapping(address => uint256[]) private userPublishedItems;
mapping(address => uint256[]) private userRentalRecords;
```

编号建议从 1 开始，0 用作不存在或空值。这样 `activeRentalByItem[itemId] == 0` 可以表示没有活跃租赁。

## 5. 参数校验规则

所有写入函数必须使用 require 进行边界校验。

createItem：

1. name 非空。
2. description 非空。
3. rentPerDay > 0。
4. deposit > 0。
5. maxRentalDays > 0。

rentItem：

1. itemId 存在。
2. item.status == ItemStatus.Available。
3. msg.sender != item.owner。
4. rentDays > 0。
5. rentDays <= item.maxRentalDays。
6. msg.value == item.rentPerDay * rentDays + item.deposit。
7. activeRentalByItem[itemId] == 0。

requestReturn：

1. rentalId 存在。
2. msg.sender == rental.renter。
3. rental.status == RentalStatus.Active。
4. item.status == ItemStatus.Rented。

confirmReturn：

1. rentalId 存在。
2. msg.sender == item.owner。
3. rental.status == RentalStatus.ReturnRequested。
4. item.status == ItemStatus.ReturnRequested。

unlistItem：

1. itemId 存在。
2. msg.sender == item.owner。
3. item.status == ItemStatus.Available。

## 6. 资金处理规则

资金处理必须遵守 checks-effects-interactions。

confirmReturn 中的推荐顺序：

1. 校验权限和状态。
2. 保存 renter、owner、rentAmount、depositAmount 到局部变量。
3. 更新 rental.status、completedAt。
4. 更新 item.status = Available。
5. 清空 activeRentalByItem[itemId]。
6. 使用 call 给 renter 退 deposit。
7. 使用 call 给 owner 转 rentAmount。
8. 触发 ReturnConfirmed 事件。

不要先转账再改状态。

推荐转账写法：

```solidity
(bool depositSent, ) = renter.call{value: depositAmount}("");
require(depositSent, "Deposit refund failed");

(bool rentSent, ) = owner.call{value: rentAmount}("");
require(rentSent, "Rent transfer failed");
```

## 7. 错误处理规范

require 错误提示使用英文短句，便于测试断言和前端识别。

示例：

```solidity
require(item.id != 0, "Item does not exist");
require(msg.sender == item.owner, "Only item owner can operate");
require(msg.value == totalPayment, "Incorrect payment amount");
```

错误提示不要过长，不要频繁变动，避免测试不稳定。

## 8. 事件规范

所有关键写入动作必须触发事件。

```solidity
event ItemCreated(uint256 indexed itemId, address indexed owner, string name, uint256 rentPerDay, uint256 deposit);
event ItemUnlisted(uint256 indexed itemId, address indexed owner);
event ItemRented(uint256 indexed rentalId, uint256 indexed itemId, address indexed renter, uint256 rentDays, uint256 paidAmount);
event ReturnRequested(uint256 indexed rentalId, uint256 indexed itemId, address indexed renter);
event ReturnConfirmed(uint256 indexed rentalId, uint256 indexed itemId, address indexed owner, address renter, uint256 rentAmount, uint256 depositAmount);
```

至少 itemId、rentalId、owner、renter 等关键检索字段使用 indexed。

## 9. 查询函数规范

查询函数要服务前端页面，不要只服务测试。

至少支持：

1. getItem(uint256 itemId)
2. getRental(uint256 rentalId)
3. getAllItems()
4. getAvailableItems()
5. getMyPublishedItems(address user)
6. getMyRentalRecords(address user)
7. getActiveRentalByItem(uint256 itemId)

如果结构体数组返回在前端处理困难，可以返回 id 数组，再由前端逐个调用 getItem / getRental。无论采用哪种方式，必须保证前端能展示列表。

## 10. Truffle 迁移规范

migrations/2_deploy_campus_rental.js 需要完成：

1. 部署 CampusRental。
2. 输出部署地址。
3. 将部署地址写入 `Front/src/contracts/campusRentalAddress.json`。
4. 将 ABI artifact 复制到 `Front/src/contracts/CampusRental.json`，或确保前端可以稳定访问 ABI。

迁移脚本不能只部署不输出地址，否则前端容易接不上合约。

## 11. 测试策略

测试文件：`test/campusRental.test.js`。

测试要求：

1. 使用不同账户模拟发布者和租赁者。
2. 覆盖成功流程。
3. 覆盖失败流程。
4. 覆盖权限错误。
5. 覆盖金额错误。
6. 覆盖状态流转。
7. 覆盖押金退款和租金结算。

建议账户：

```javascript
const owner = accounts[0];
const publisher = accounts[1];
const renter = accounts[2];
const other = accounts[3];
```

至少测试：

1. 发布物品成功。
2. 参数非法发布失败。
3. 支付正确金额租赁成功。
4. 金额不足租赁失败。
5. 发布者租赁自己的物品失败。
6. 已租赁物品再次租赁失败。
7. 非租赁者申请归还失败。
8. 租赁者申请归还成功。
9. 非发布者确认归还失败。
10. 发布者确认归还成功。
11. 下架未出租物品成功。
12. 下架已出租物品失败。

## 12. 合约验收标准

1. `truffle compile` 成功。
2. `truffle migrate --network development --reset` 成功。
3. `truffle test` 全部通过。
4. Ganache 中能看到部署交易和用户交易。
5. 合约地址能同步给前端。
6. 前端能使用该合约地址调用函数。
