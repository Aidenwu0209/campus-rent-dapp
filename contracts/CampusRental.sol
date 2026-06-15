// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title 校园共享物品租赁平台合约
/// @notice 支持校园物品发布、租赁、归还申请、发布者确认归还、押金退回和租金结算。
/// @dev 本合约用于课程选题一演示，资金由合约在租赁期间托管，确认归还后分别退回押金并结算租金。
contract CampusRental {
    // ============ Enums ============

    /// @notice 物品状态，用于表示一件物品在租赁流程中的当前位置。
    enum ItemStatus {
        // 可租赁，允许租赁者发起租赁。
        Available,
        // 已租赁，押金和租金已进入合约托管。
        Rented,
        // 租赁者已申请归还，等待发布者确认。
        ReturnRequested,
        // 已下架，不再展示为可租赁物品。
        Unlisted
    }

    /// @notice 租赁记录状态，用于跟踪单次租赁交易的完整生命周期。
    enum RentalStatus {
        // 租赁进行中。
        Active,
        // 租赁者已申请归还。
        ReturnRequested,
        // 发布者已确认归还，资金已结算。
        Completed
    }

    // ============ Structs ============

    /// @notice 校园共享物品信息。
    /// @dev rentPerDay 和 deposit 均以 wei 为单位存储，前端提交 ETH 后会换算为 wei。
    struct Item {
        // 物品编号，从 1 开始递增。
        uint256 id;
        // 发布者地址，也是归还确认和租金接收方。
        address payable owner;
        // 物品名称。
        string name;
        // 物品描述。
        string description;
        // 每日租金，单位 wei。
        uint256 rentPerDay;
        // 押金，单位 wei。
        uint256 deposit;
        // 最长可租赁天数。
        uint256 maxRentalDays;
        // 当前物品状态。
        ItemStatus status;
        // 发布时间戳。
        uint256 createdAt;
    }

    /// @notice 单次租赁记录。
    /// @dev 记录租赁者、租赁天数、租金、押金以及归还确认时间，便于前端展示“我的租赁”。
    struct RentalRecord {
        // 租赁记录编号，从 1 开始递增。
        uint256 id;
        // 对应物品编号。
        uint256 itemId;
        // 租赁者地址，也是押金退款接收方。
        address payable renter;
        // 实际租赁天数。
        uint256 rentDays;
        // 本次租赁应结算给发布者的租金，单位 wei。
        uint256 rentAmount;
        // 本次租赁托管的押金，单位 wei。
        uint256 depositAmount;
        // 租赁开始时间戳。
        uint256 startTime;
        // 租赁者申请归还时间戳，未申请时为 0。
        uint256 returnRequestedAt;
        // 发布者确认归还时间戳，未完成时为 0。
        uint256 completedAt;
        // 当前租赁记录状态。
        RentalStatus status;
    }

    // ============ State ============

    uint256 private nextItemId = 1;
    uint256 private nextRentalId = 1;

    // itemId => Item
    mapping(uint256 => Item) private items;
    // rentalId => RentalRecord
    mapping(uint256 => RentalRecord) private rentals;
    // itemId => active rentalId，值为 0 表示当前无活跃租赁。
    mapping(uint256 => uint256) private activeRentalByItem;
    // user => published item ids，用于“我的发布”查询。
    mapping(address => uint256[]) private userPublishedItems;
    // user => rental record ids，用于“我的租赁”查询。
    mapping(address => uint256[]) private userRentalRecords;

    // ============ Events ============

    /// @notice 发布者成功发布物品时触发。
    /// @param itemId 新物品编号。
    /// @param owner 发布者地址。
    /// @param name 物品名称。
    /// @param rentPerDay 每日租金，单位 wei。
    /// @param deposit 押金，单位 wei。
    event ItemCreated(
        uint256 indexed itemId,
        address indexed owner,
        string name,
        uint256 rentPerDay,
        uint256 deposit
    );

    /// @notice 发布者下架可租赁物品时触发。
    /// @param itemId 被下架的物品编号。
    /// @param owner 发布者地址。
    event ItemUnlisted(uint256 indexed itemId, address indexed owner);

    /// @notice 发布者重新上架已下架物品时触发。
    /// @param itemId 被重新上架的物品编号。
    /// @param owner 发布者地址。
    event ItemRelisted(uint256 indexed itemId, address indexed owner);

    /// @notice 租赁者成功租赁物品并支付租金与押金时触发。
    /// @param rentalId 新租赁记录编号。
    /// @param itemId 被租赁的物品编号。
    /// @param renter 租赁者地址。
    /// @param rentDays 租赁天数。
    /// @param paidAmount 本次支付总额，等于租金加押金，单位 wei。
    event ItemRented(
        uint256 indexed rentalId,
        uint256 indexed itemId,
        address indexed renter,
        uint256 rentDays,
        uint256 paidAmount
    );

    /// @notice 租赁者申请归还物品时触发。
    /// @param rentalId 租赁记录编号。
    /// @param itemId 归还申请对应的物品编号。
    /// @param renter 发起归还申请的租赁者地址。
    event ReturnRequested(
        uint256 indexed rentalId,
        uint256 indexed itemId,
        address indexed renter
    );

    /// @notice 发布者确认归还并完成押金退款、租金结算时触发。
    /// @param rentalId 租赁记录编号。
    /// @param itemId 归还确认对应的物品编号。
    /// @param owner 发布者地址，接收租金。
    /// @param renter 租赁者地址，接收押金退款。
    /// @param rentAmount 结算给发布者的租金，单位 wei。
    /// @param depositAmount 退回给租赁者的押金，单位 wei。
    event ReturnConfirmed(
        uint256 indexed rentalId,
        uint256 indexed itemId,
        address indexed owner,
        address renter,
        uint256 rentAmount,
        uint256 depositAmount
    );

    // ============ Modifiers ============

    /// @notice 限制物品必须存在。
    /// @param itemId 待检查的物品编号。
    modifier itemExists(uint256 itemId) {
        require(items[itemId].id != 0, "Item does not exist");
        _;
    }

    /// @notice 限制租赁记录必须存在。
    /// @param rentalId 待检查的租赁记录编号。
    modifier rentalExists(uint256 rentalId) {
        require(rentals[rentalId].id != 0, "Rental does not exist");
        _;
    }

    /// @notice 限制只有物品发布者可以执行。
    /// @param itemId 待操作的物品编号。
    modifier onlyItemOwner(uint256 itemId) {
        require(msg.sender == items[itemId].owner, "Only item owner can operate");
        _;
    }

    /// @notice 限制只有对应租赁者可以执行。
    /// @param rentalId 待操作的租赁记录编号。
    modifier onlyRentalRenter(uint256 rentalId) {
        require(msg.sender == rentals[rentalId].renter, "Only renter can operate");
        _;
    }

    // ============ Write Functions ============

    /// @notice 发布一件新的校园共享物品。
    /// @dev 发布成功后物品状态为 Available，并加入发布者的“我的发布”列表。
    /// @param name 物品名称，不能为空。
    /// @param description 物品描述，不能为空。
    /// @param rentPerDay 每日租金，单位 wei，必须大于 0。
    /// @param deposit 押金，单位 wei，必须大于 0。
    /// @param maxRentalDays 最长租赁天数，必须大于 0。
    /// @return itemId 新创建的物品编号。
    function createItem(
        string memory name,
        string memory description,
        uint256 rentPerDay,
        uint256 deposit,
        uint256 maxRentalDays
    ) external returns (uint256 itemId) {
        require(bytes(name).length > 0, "Name is required");
        require(bytes(description).length > 0, "Description is required");
        require(rentPerDay > 0, "Rent per day must be greater than zero");
        require(deposit > 0, "Deposit must be greater than zero");
        require(maxRentalDays > 0, "Max rental days must be greater than zero");

        itemId = nextItemId;
        nextItemId += 1;

        items[itemId] = Item({
            id: itemId,
            owner: payable(msg.sender),
            name: name,
            description: description,
            rentPerDay: rentPerDay,
            deposit: deposit,
            maxRentalDays: maxRentalDays,
            status: ItemStatus.Available,
            createdAt: block.timestamp
        });
        userPublishedItems[msg.sender].push(itemId);

        emit ItemCreated(itemId, msg.sender, name, rentPerDay, deposit);
    }

    /// @notice 租赁一件当前可租赁的物品。
    /// @dev 调用者必须不是发布者，支付金额必须等于 rentPerDay * rentDays + deposit；成功后资金由合约托管。
    /// @param itemId 待租赁的物品编号。
    /// @param rentDays 租赁天数，必须大于 0 且不超过物品设置的最大租赁天数。
    /// @return rentalId 新创建的租赁记录编号。
    function rentItem(uint256 itemId, uint256 rentDays)
        external
        payable
        itemExists(itemId)
        returns (uint256 rentalId)
    {
        Item storage item = items[itemId];

        require(item.status == ItemStatus.Available, "Item is not available");
        require(msg.sender != item.owner, "Item owner cannot rent own item");
        require(rentDays > 0, "Rental days must be greater than zero");
        require(rentDays <= item.maxRentalDays, "Rental days exceed max");
        require(activeRentalByItem[itemId] == 0, "Item already has active rental");

        uint256 rentAmount = item.rentPerDay * rentDays;
        uint256 totalPayment = rentAmount + item.deposit;
        require(msg.value == totalPayment, "Incorrect payment amount");

        rentalId = nextRentalId;
        nextRentalId += 1;

        rentals[rentalId] = RentalRecord({
            id: rentalId,
            itemId: itemId,
            renter: payable(msg.sender),
            rentDays: rentDays,
            rentAmount: rentAmount,
            depositAmount: item.deposit,
            startTime: block.timestamp,
            returnRequestedAt: 0,
            completedAt: 0,
            status: RentalStatus.Active
        });

        item.status = ItemStatus.Rented;
        activeRentalByItem[itemId] = rentalId;
        userRentalRecords[msg.sender].push(rentalId);

        emit ItemRented(rentalId, itemId, msg.sender, rentDays, msg.value);
    }

    /// @notice 租赁者申请归还物品。
    /// @dev 只有租赁记录中的租赁者可以申请；申请后物品和租赁记录都会进入待确认归还状态。
    /// @param rentalId 待申请归还的租赁记录编号。
    function requestReturn(uint256 rentalId)
        external
        rentalExists(rentalId)
        onlyRentalRenter(rentalId)
    {
        RentalRecord storage rental = rentals[rentalId];
        Item storage item = items[rental.itemId];

        require(rental.status == RentalStatus.Active, "Rental is not active");
        require(item.status == ItemStatus.Rented, "Item is not rented");

        rental.status = RentalStatus.ReturnRequested;
        rental.returnRequestedAt = block.timestamp;
        item.status = ItemStatus.ReturnRequested;

        emit ReturnRequested(rentalId, rental.itemId, msg.sender);
    }

    /// @notice 发布者确认租赁者已归还物品。
    /// @dev 只有物品发布者可以确认；确认后退回押金给租赁者，并将租金结算给发布者。
    /// @param rentalId 待确认归还的租赁记录编号。
    function confirmReturn(uint256 rentalId)
        external
        rentalExists(rentalId)
    {
        RentalRecord storage rental = rentals[rentalId];
        Item storage item = items[rental.itemId];

        require(msg.sender == item.owner, "Only item owner can operate");
        require(rental.status == RentalStatus.ReturnRequested, "Rental return not requested");
        require(item.status == ItemStatus.ReturnRequested, "Item return not requested");

        address payable renter = rental.renter;
        address payable owner = item.owner;
        uint256 rentAmount = rental.rentAmount;
        uint256 depositAmount = rental.depositAmount;

        rental.status = RentalStatus.Completed;
        rental.completedAt = block.timestamp;
        item.status = ItemStatus.Available;
        activeRentalByItem[rental.itemId] = 0;

        (bool depositSent, ) = renter.call{value: depositAmount}("");
        require(depositSent, "Deposit refund failed");

        (bool rentSent, ) = owner.call{value: rentAmount}("");
        require(rentSent, "Rent transfer failed");

        emit ReturnConfirmed(rentalId, rental.itemId, owner, renter, rentAmount, depositAmount);
    }

    /// @notice 下架一件未被租赁的物品。
    /// @dev 只有发布者可以下架，且物品必须处于 Available 状态；下架后不会出现在可租赁列表中。
    /// @param itemId 待下架的物品编号。
    function unlistItem(uint256 itemId)
        external
        itemExists(itemId)
        onlyItemOwner(itemId)
    {
        Item storage item = items[itemId];
        require(item.status == ItemStatus.Available, "Item is not available");

        item.status = ItemStatus.Unlisted;

        emit ItemUnlisted(itemId, msg.sender);
    }

    /// @notice 重新上架已下架的物品。
    /// @dev 只有发布者可以重新上架，且物品必须处于 Unlisted 状态。
    /// @param itemId 待重新上架的物品编号。
    function relistItem(uint256 itemId)
        external
        itemExists(itemId)
        onlyItemOwner(itemId)
    {
        Item storage item = items[itemId];
        require(item.status == ItemStatus.Unlisted, "Item is not unlisted");

        item.status = ItemStatus.Available;

        emit ItemRelisted(itemId, msg.sender);
    }

    // ============ Read Functions ============

    /// @notice 查询单个物品详情。
    /// @param itemId 待查询的物品编号。
    /// @return 指定物品的完整信息。
    function getItem(uint256 itemId) external view itemExists(itemId) returns (Item memory) {
        return items[itemId];
    }

    /// @notice 查询单条租赁记录详情。
    /// @param rentalId 待查询的租赁记录编号。
    /// @return 指定租赁记录的完整信息。
    function getRental(uint256 rentalId)
        external
        view
        rentalExists(rentalId)
        returns (RentalRecord memory)
    {
        return rentals[rentalId];
    }

    /// @notice 查询平台中所有已发布过的物品。
    /// @dev 返回结果包含可租赁、已租赁、待确认归还和已下架物品，用于物品大厅或管理页展示完整状态。
    /// @return result 所有物品数组，按物品编号从小到大排列。
    function getAllItems() external view returns (Item[] memory) {
        uint256 totalItems = nextItemId - 1;
        Item[] memory result = new Item[](totalItems);

        for (uint256 i = 1; i < nextItemId; i += 1) {
            result[i - 1] = items[i];
        }

        return result;
    }

    /// @notice 查询当前可租赁物品列表。
    /// @dev 只返回状态为 Available 的物品，前端物品大厅用它判断哪些物品可被租赁。
    /// @return result 可租赁物品数组。
    function getAvailableItems() external view returns (Item[] memory) {
        uint256 availableCount = 0;

        for (uint256 i = 1; i < nextItemId; i += 1) {
            if (items[i].status == ItemStatus.Available) {
                availableCount += 1;
            }
        }

        Item[] memory result = new Item[](availableCount);
        uint256 cursor = 0;

        for (uint256 i = 1; i < nextItemId; i += 1) {
            if (items[i].status == ItemStatus.Available) {
                result[cursor] = items[i];
                cursor += 1;
            }
        }

        return result;
    }

    /// @notice 查询指定用户发布过的物品。
    /// @dev 用于“我的发布”页面，发布者可据此管理上下架并确认归还。
    /// @param user 待查询的发布者地址。
    /// @return result 该地址发布过的物品数组。
    function getMyPublishedItems(address user) external view returns (Item[] memory) {
        uint256[] storage itemIds = userPublishedItems[user];
        Item[] memory result = new Item[](itemIds.length);

        for (uint256 i = 0; i < itemIds.length; i += 1) {
            result[i] = items[itemIds[i]];
        }

        return result;
    }

    /// @notice 查询指定用户的租赁记录。
    /// @dev 用于“我的租赁”页面，租赁者可查看状态并在租赁中发起归还申请。
    /// @param user 待查询的租赁者地址。
    /// @return result 该地址产生过的租赁记录数组。
    function getMyRentalRecords(address user) external view returns (RentalRecord[] memory) {
        uint256[] storage rentalIds = userRentalRecords[user];
        RentalRecord[] memory result = new RentalRecord[](rentalIds.length);

        for (uint256 i = 0; i < rentalIds.length; i += 1) {
            result[i] = rentals[rentalIds[i]];
        }

        return result;
    }

    /// @notice 查询某个物品当前关联的活跃租赁记录编号。
    /// @dev 返回 0 表示该物品当前没有活跃租赁，用于防止重复租赁和前端状态展示。
    /// @param itemId 待查询的物品编号。
    /// @return 当前活跃租赁记录编号；没有活跃租赁时返回 0。
    function getActiveRentalByItem(uint256 itemId)
        external
        view
        itemExists(itemId)
        returns (uint256)
    {
        return activeRentalByItem[itemId];
    }
}
