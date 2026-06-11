const fs = require("fs");
const path = require("path");

const CampusRental = artifacts.require("CampusRental");

module.exports = async function (deployer, network) {
  await deployer.deploy(CampusRental);
  const instance = await CampusRental.deployed();
  const networkId = await web3.eth.net.getId();

  const contractsDir = path.join(__dirname, "..", "Front", "src", "contracts");
  fs.mkdirSync(contractsDir, { recursive: true });

  const addressPayload = {
    address: instance.address,
    network,
    networkId: String(networkId),
    updatedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(contractsDir, "campusRentalAddress.json"),
    `${JSON.stringify(addressPayload, null, 2)}\n`
  );

  const artifactPath = path.join(__dirname, "..", "build", "contracts", "CampusRental.json");
  fs.copyFileSync(artifactPath, path.join(contractsDir, "CampusRental.json"));

  console.log(`CampusRental deployed at ${instance.address}`);
};
