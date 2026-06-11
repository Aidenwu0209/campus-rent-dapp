// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CampusRental {
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

    uint256 private nextItemId = 1;
    uint256 private nextRentalId = 1;

    mapping(uint256 => Item) private items;
    mapping(uint256 => RentalRecord) private rentals;
    mapping(uint256 => uint256) private activeRentalByItem;
    mapping(address => uint256[]) private userPublishedItems;
    mapping(address => uint256[]) private userRentalRecords;

    event ItemCreated(
        uint256 indexed itemId,
        address indexed owner,
        string name,
        uint256 rentPerDay,
        uint256 deposit
    );
    event ItemUnlisted(uint256 indexed itemId, address indexed owner);
    event ItemRented(
        uint256 indexed rentalId,
        uint256 indexed itemId,
        address indexed renter,
        uint256 rentDays,
        uint256 paidAmount
    );
    event ReturnRequested(uint256 indexed rentalId, uint256 indexed itemId, address indexed renter);
    event ReturnConfirmed(
        uint256 indexed rentalId,
        uint256 indexed itemId,
        address indexed owner,
        address renter,
        uint256 rentAmount,
        uint256 depositAmount
    );

    modifier itemExists(uint256 itemId) {
        require(items[itemId].id != 0, "Item does not exist");
        _;
    }

    modifier rentalExists(uint256 rentalId) {
        require(rentals[rentalId].id != 0, "Rental does not exist");
        _;
    }

    modifier onlyItemOwner(uint256 itemId) {
        require(msg.sender == items[itemId].owner, "Only item owner can operate");
        _;
    }

    modifier onlyRentalRenter(uint256 rentalId) {
        require(msg.sender == rentals[rentalId].renter, "Only renter can operate");
        _;
    }

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

    function getItem(uint256 itemId) external view itemExists(itemId) returns (Item memory) {
        return items[itemId];
    }

    function getRental(uint256 rentalId)
        external
        view
        rentalExists(rentalId)
        returns (RentalRecord memory)
    {
        return rentals[rentalId];
    }

    function getAllItems() external view returns (Item[] memory) {
        uint256 totalItems = nextItemId - 1;
        Item[] memory result = new Item[](totalItems);

        for (uint256 i = 1; i < nextItemId; i += 1) {
            result[i - 1] = items[i];
        }

        return result;
    }

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

    function getMyPublishedItems(address user) external view returns (Item[] memory) {
        uint256[] storage itemIds = userPublishedItems[user];
        Item[] memory result = new Item[](itemIds.length);

        for (uint256 i = 0; i < itemIds.length; i += 1) {
            result[i] = items[itemIds[i]];
        }

        return result;
    }

    function getMyRentalRecords(address user) external view returns (RentalRecord[] memory) {
        uint256[] storage rentalIds = userRentalRecords[user];
        RentalRecord[] memory result = new RentalRecord[](rentalIds.length);

        for (uint256 i = 0; i < rentalIds.length; i += 1) {
            result[i] = rentals[rentalIds[i]];
        }

        return result;
    }

    function getActiveRentalByItem(uint256 itemId)
        external
        view
        itemExists(itemId)
        returns (uint256)
    {
        return activeRentalByItem[itemId];
    }
}
