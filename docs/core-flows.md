# 核心业务流程

## 1. 环境启动流程

```text
开发者启动 Ganache
  ↓
项目根目录执行 truffle compile
  ↓
项目根目录执行 truffle migrate --network development --reset
  ↓
迁移脚本部署 CampusRental 合约
  ↓
迁移脚本将合约地址和 ABI 同步到 Front/src/contracts/
  ↓
进入 Front 目录执行 npm run dev
  ↓
浏览器打开前端页面
  ↓
MetaMask 切换到 Ganache 本地网络
```

验收标准：

1. 合约编译无错误。
2. 合约部署有地址输出。
3. 前端能读取合约地址。
4. 页面不报 ABI 或 address 缺失错误。

## 2. 连接钱包流程

```text
用户点击“连接钱包”
  ↓
Front 检查 window.ethereum
  ↓
请求 eth_requestAccounts
  ↓
MetaMask 弹窗授权
  ↓
Front 获取当前账户 address
  ↓
Front 获取 chainId 和余额
  ↓
页面显示账户地址、网络 ID、合约地址
```

异常处理：

1. 未安装 MetaMask：提示请先安装 MetaMask。
2. 用户拒绝授权：提示用户取消了钱包授权。
3. 网络不是 Ganache：提示切换到本地测试网络。

验收标准：

1. 页面显示当前账户地址。
2. 切换 MetaMask 账户后，页面账户同步更新。
3. 切换网络后，页面网络信息同步更新。

## 3. 发布物品流程

```text
发布者账号 A 进入“发布物品”页面
  ↓
输入物品名称、描述、日租金 ETH、押金 ETH、最大租赁天数
  ↓
Front 做基础校验
  ↓
Front 将 ETH 转换为 wei
  ↓
调用 createItem(name, description, rentPerDayWei, depositWei, maxRentalDays)
  ↓
MetaMask 弹窗确认交易
  ↓
合约校验参数
  ↓
合约创建 Item，状态为 Available
  ↓
合约记录 userPublishedItems
  ↓
合约触发 ItemCreated 事件
  ↓
Front 等待 tx.wait()
  ↓
Front 刷新物品列表和我的发布
```

验收标准：

1. 发布成功后首页能看到新物品。
2. 我的发布能看到该物品。
3. 状态显示为“可租赁”。
4. Ganache 中有对应交易。

## 4. 租赁物品流程

```text
租赁者账号 B 打开首页
  ↓
选择账号 A 发布且状态为 Available 的物品
  ↓
输入租赁天数 rentDays
  ↓
Front 计算 totalPayment = rentPerDay * rentDays + deposit
  ↓
调用 rentItem(itemId, rentDays)，并附带 value = totalPayment
  ↓
MetaMask 弹窗确认支付
  ↓
合约校验物品状态、租赁者身份、租赁天数、支付金额
  ↓
合约创建 RentalRecord，状态为 Active
  ↓
合约将物品状态改为 Rented
  ↓
合约设置 activeRentalByItem[itemId] = rentalId
  ↓
合约触发 ItemRented 事件
  ↓
Front 等待交易确认并刷新数据
```

验收标准：

1. 账号 B 租赁成功。
2. 物品状态变为“已租赁”。
3. 我的租赁中能看到该租赁记录。
4. 其他账号不能再次租赁同一物品。
5. 账号 A 不能租赁自己发布的物品。

## 5. 申请归还流程

```text
租赁者账号 B 进入“我的租赁”
  ↓
找到状态为 Active 的租赁记录
  ↓
点击“申请归还”
  ↓
调用 requestReturn(rentalId)
  ↓
MetaMask 弹窗确认交易
  ↓
合约校验 msg.sender 是否为 renter
  ↓
合约校验 rental.status 是否为 Active
  ↓
合约将 rental.status 改为 ReturnRequested
  ↓
合约将 item.status 改为 ReturnRequested
  ↓
合约记录 returnRequestedAt
  ↓
合约触发 ReturnRequested 事件
  ↓
Front 等待交易确认并刷新数据
```

验收标准：

1. 只有租赁者能申请归还。
2. 非租赁者点击时前端不应提供按钮，合约也应拒绝。
3. 申请后物品状态显示为“待确认归还”。
4. 我的租赁记录状态显示为“待确认归还”。

## 6. 确认归还与退款流程

```text
发布者账号 A 进入“我的发布”
  ↓
找到状态为 ReturnRequested 的物品或其 active rental
  ↓
点击“确认归还”
  ↓
调用 confirmReturn(rentalId)
  ↓
MetaMask 弹窗确认交易
  ↓
合约校验 msg.sender 是否为 item.owner
  ↓
合约校验 rental.status 是否为 ReturnRequested
  ↓
合约更新 rental.status = Completed
  ↓
合约更新 item.status = Available
  ↓
合约清空 activeRentalByItem[itemId]
  ↓
合约将 deposit 退回 renter
  ↓
合约将 rentAmount 转给 owner
  ↓
合约触发 ReturnConfirmed 事件
  ↓
Front 等待交易确认并刷新数据
```

验收标准：

1. 只有发布者可以确认归还。
2. 确认后租赁记录变为“已完成”。
3. 物品恢复“可租赁”。
4. 押金退给租赁者。
5. 租金转给发布者。
6. activeRentalByItem 被清空，物品可以再次出租。

## 7. 下架物品流程

```text
发布者账号 A 进入“我的发布”
  ↓
选择状态为 Available 的物品
  ↓
点击“下架”
  ↓
调用 unlistItem(itemId)
  ↓
MetaMask 弹窗确认交易
  ↓
合约校验 msg.sender 是否为 owner
  ↓
合约校验 item.status 是否为 Available
  ↓
合约将 item.status 改为 Unlisted
  ↓
合约触发 ItemUnlisted 事件
  ↓
Front 刷新数据
```

验收标准：

1. 只有发布者可以下架。
2. 已租赁物品不能下架。
3. 下架后不能再被租赁。

## 8. 查询流程

### 8.1 首页查询

```text
Front 调用 getAllItems 或 getAvailableItems
  ↓
将链上 Item 转为前端视图模型
  ↓
按状态展示物品卡片
```

### 8.2 我的发布查询

```text
Front 读取当前 account
  ↓
调用 getMyPublishedItems(account)
  ↓
展示当前账号发布的物品
  ↓
对 ReturnRequested 状态物品显示确认归还入口
  ↓
对 Available 状态物品显示下架入口
```

### 8.3 我的租赁查询

```text
Front 读取当前 account
  ↓
调用 getMyRentalRecords(account)
  ↓
展示当前账号租赁记录
  ↓
对 Active 状态租赁显示申请归还入口
```

验收标准：

1. 切换账号后，我的发布和我的租赁随账号变化。
2. 列表为空时显示 empty 状态。
3. 查询失败时显示错误提示。

## 9. 完整课堂演示流程

固定使用两个账户演示：

1. 账号 A 连接钱包。
2. 账号 A 发布“校园充电宝”，日租金 0.01 ETH，押金 0.05 ETH，最大租赁天数 7 天。
3. 首页显示物品状态为 Available。
4. 切换账号 B。
5. 账号 B 租赁该物品，租赁 2 天，支付 0.07 ETH。
6. 首页显示物品状态为 Rented。
7. 账号 B 进入我的租赁，点击申请归还。
8. 状态显示 ReturnRequested。
9. 切换账号 A。
10. 账号 A 进入我的发布，点击确认归还。
11. 状态恢复 Available，租赁记录为 Completed。
12. 展示 `truffle test` 全部通过结果。

## 10. 必须测试的异常流程

1. 未连接钱包时点击交易按钮，应提示先连接钱包。
2. 发布物品时租金为 0，应前端提示，合约也应拒绝。
3. 账号 A 不能租赁自己发布的物品。
4. 账号 C 不能申请账号 B 的归还。
5. 账号 C 不能确认账号 A 发布物品的归还。
6. 金额不足不能租赁。
7. 已出租物品不能再次出租。
8. 已出租物品不能下架。
