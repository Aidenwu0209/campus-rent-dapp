const CampusRental = artifacts.require("CampusRental");

contract("CampusRental", (accounts) => {
  const publisher = accounts[1];
  const renter = accounts[2];
  const other = accounts[3];

  const rentPerDay = web3.utils.toWei("0.01", "ether");
  const deposit = web3.utils.toWei("0.05", "ether");
  const maxRentalDays = 7;
  const rentDays = 2;

  let rental;

  const toBN = (value) => web3.utils.toBN(value);

  const expectRevert = async (promise, expectedMessage) => {
    try {
      await promise;
      assert.fail("Expected transaction to revert");
    } catch (error) {
      assert(
        error.message.includes("revert"),
        `Expected revert error, got: ${error.message}`
      );
      if (expectedMessage) {
        assert(
          error.message.includes(expectedMessage),
          `Expected "${expectedMessage}", got: ${error.message}`
        );
      }
    }
  };

  const expectEvent = (tx, eventName) => {
    const event = tx.logs.find((log) => log.event === eventName);
    assert(event, `Expected ${eventName} event`);
    return event;
  };

  const createDefaultItem = async (from = publisher) => rental.createItem(
    "校园充电宝",
    "适合图书馆和教学楼临时使用",
    rentPerDay,
    deposit,
    maxRentalDays,
    { from }
  );

  const rentDefaultItem = async (itemId = 1, from = renter) => {
    const totalPayment = toBN(rentPerDay).mul(toBN(rentDays)).add(toBN(deposit));
    return rental.rentItem(itemId, rentDays, { from, value: totalPayment });
  };

  beforeEach(async () => {
    rental = await CampusRental.new();
  });

  it("TC01 publishes an item successfully", async () => {
    const tx = await createDefaultItem();
    const event = expectEvent(tx, "ItemCreated");

    assert.equal(event.args.itemId.toString(), "1");
    assert.equal(event.args.owner, publisher);

    const item = await rental.getItem(1);
    assert.equal(item.id.toString(), "1");
    assert.equal(item.owner, publisher);
    assert.equal(item.name, "校园充电宝");
    assert.equal(item.status.toString(), "0");
  });

  it("TC02 rejects invalid item parameters", async () => {
    await expectRevert(
      rental.createItem("", "描述", rentPerDay, deposit, maxRentalDays, { from: publisher }),
      "Name is required"
    );
    await expectRevert(
      rental.createItem("教材", "", rentPerDay, deposit, maxRentalDays, { from: publisher }),
      "Description is required"
    );
    await expectRevert(
      rental.createItem("教材", "描述", 0, deposit, maxRentalDays, { from: publisher }),
      "Rent per day must be greater than zero"
    );
    await expectRevert(
      rental.createItem("教材", "描述", rentPerDay, 0, maxRentalDays, { from: publisher }),
      "Deposit must be greater than zero"
    );
    await expectRevert(
      rental.createItem("教材", "描述", rentPerDay, deposit, 0, { from: publisher }),
      "Max rental days must be greater than zero"
    );
  });

  it("TC03 returns all and available item lists", async () => {
    await createDefaultItem();

    const allItems = await rental.getAllItems();
    const availableItems = await rental.getAvailableItems();
    const publishedItems = await rental.getMyPublishedItems(publisher);

    assert.equal(allItems.length, 1);
    assert.equal(availableItems.length, 1);
    assert.equal(publishedItems.length, 1);
    assert.equal(allItems[0].name, "校园充电宝");
  });

  it("TC04 rents an item with the correct payment", async () => {
    await createDefaultItem();

    const tx = await rentDefaultItem();
    const event = expectEvent(tx, "ItemRented");

    assert.equal(event.args.rentalId.toString(), "1");
    assert.equal(event.args.itemId.toString(), "1");
    assert.equal(event.args.renter, renter);

    const item = await rental.getItem(1);
    const record = await rental.getRental(1);
    const activeRentalId = await rental.getActiveRentalByItem(1);
    const renterRecords = await rental.getMyRentalRecords(renter);

    assert.equal(item.status.toString(), "1");
    assert.equal(record.status.toString(), "0");
    assert.equal(activeRentalId.toString(), "1");
    assert.equal(renterRecords.length, 1);
    assert.equal(await web3.eth.getBalance(rental.address), web3.utils.toWei("0.07", "ether"));
  });

  it("TC05 rejects insufficient or incorrect payment", async () => {
    await createDefaultItem();

    await expectRevert(
      rental.rentItem(1, rentDays, {
        from: renter,
        value: web3.utils.toWei("0.01", "ether")
      }),
      "Incorrect payment amount"
    );
  });

  it("TC06 rejects renting an already rented item", async () => {
    await createDefaultItem();
    await rentDefaultItem();

    await expectRevert(rentDefaultItem(1, other), "Item is not available");
  });

  it("TC07 rejects item owner renting their own item", async () => {
    await createDefaultItem();

    await expectRevert(rentDefaultItem(1, publisher), "Item owner cannot rent own item");
  });

  it("rejects invalid rental days", async () => {
    await createDefaultItem();

    await expectRevert(
      rental.rentItem(1, 0, { from: renter, value: deposit }),
      "Rental days must be greater than zero"
    );
    await expectRevert(
      rental.rentItem(1, 8, {
        from: renter,
        value: toBN(rentPerDay).mul(toBN(8)).add(toBN(deposit))
      }),
      "Rental days exceed max"
    );
  });

  it("TC08 rejects return requests from non-renters", async () => {
    await createDefaultItem();
    await rentDefaultItem();

    await expectRevert(
      rental.requestReturn(1, { from: other }),
      "Only renter can operate"
    );
  });

  it("TC09 allows renter to request return", async () => {
    await createDefaultItem();
    await rentDefaultItem();

    const tx = await rental.requestReturn(1, { from: renter });
    expectEvent(tx, "ReturnRequested");

    const item = await rental.getItem(1);
    const record = await rental.getRental(1);

    assert.equal(item.status.toString(), "2");
    assert.equal(record.status.toString(), "1");
    assert.notEqual(record.returnRequestedAt.toString(), "0");
  });

  it("TC10 rejects return confirmation from non-owners", async () => {
    await createDefaultItem();
    await rentDefaultItem();
    await rental.requestReturn(1, { from: renter });

    await expectRevert(
      rental.confirmReturn(1, { from: other }),
      "Only item owner can operate"
    );
  });

  it("TC11 lets owner confirm return, refund deposit, and receive rent", async () => {
    await createDefaultItem();
    await rentDefaultItem();
    await rental.requestReturn(1, { from: renter });

    const renterBefore = toBN(await web3.eth.getBalance(renter));
    const publisherBefore = toBN(await web3.eth.getBalance(publisher));

    const tx = await rental.confirmReturn(1, { from: publisher });
    const event = expectEvent(tx, "ReturnConfirmed");

    const receipt = await web3.eth.getTransactionReceipt(tx.tx);
    const gasCost = toBN(receipt.gasUsed).mul(toBN(tx.receipt.effectiveGasPrice));

    const renterAfter = toBN(await web3.eth.getBalance(renter));
    const publisherAfter = toBN(await web3.eth.getBalance(publisher));
    const expectedRent = toBN(rentPerDay).mul(toBN(rentDays));

    assert.equal(event.args.rentAmount.toString(), expectedRent.toString());
    assert.equal(event.args.depositAmount.toString(), deposit);
    assert.equal(renterAfter.sub(renterBefore).toString(), deposit);
    assert.equal(publisherAfter.sub(publisherBefore).add(gasCost).toString(), expectedRent.toString());
    assert.equal(await web3.eth.getBalance(rental.address), "0");

    const item = await rental.getItem(1);
    const record = await rental.getRental(1);
    const activeRentalId = await rental.getActiveRentalByItem(1);

    assert.equal(item.status.toString(), "0");
    assert.equal(record.status.toString(), "2");
    assert.notEqual(record.completedAt.toString(), "0");
    assert.equal(activeRentalId.toString(), "0");
  });

  it("TC12 unlists an available item", async () => {
    await createDefaultItem();

    const tx = await rental.unlistItem(1, { from: publisher });
    expectEvent(tx, "ItemUnlisted");

    const item = await rental.getItem(1);
    const availableItems = await rental.getAvailableItems();

    assert.equal(item.status.toString(), "3");
    assert.equal(availableItems.length, 0);
  });

  it("TC13 relists an unlisted item", async () => {
    await createDefaultItem();
    await rental.unlistItem(1, { from: publisher });

    const tx = await rental.relistItem(1, { from: publisher });
    expectEvent(tx, "ItemRelisted");

    const item = await rental.getItem(1);
    const availableItems = await rental.getAvailableItems();

    assert.equal(item.status.toString(), "0");
    assert.equal(availableItems.length, 1);
  });

  it("TC14 rejects invalid relist operations", async () => {
    await createDefaultItem();

    await expectRevert(
      rental.relistItem(1, { from: other }),
      "Only item owner can operate"
    );

    await expectRevert(
      rental.relistItem(1, { from: publisher }),
      "Item is not unlisted"
    );
  });

  it("TC15 rejects unlisting a rented item", async () => {
    await createDefaultItem();
    await rentDefaultItem();

    await expectRevert(
      rental.unlistItem(1, { from: publisher }),
      "Item is not available"
    );
  });

  it("TC16 rejects renting an unlisted item and owner-only unlisting violations", async () => {
    await createDefaultItem();

    await expectRevert(
      rental.unlistItem(1, { from: other }),
      "Only item owner can operate"
    );

    await rental.unlistItem(1, { from: publisher });
    await expectRevert(
      rentDefaultItem(1, renter),
      "Item is not available"
    );
  });
});
