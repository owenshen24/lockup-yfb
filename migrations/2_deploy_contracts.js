let FakeToken = artifacts.require("FakeToken");
let TokenStaker = artifacts.require("TokenStaker");

// TODO: change this for the actual migration
module.exports = async function(deployer) {
  await deployer.deploy(FakeToken, 100);
  await deployer.deploy(TokenStaker, FakeToken.address, "Test", "T");
}