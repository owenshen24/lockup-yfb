let TokenStaker = artifacts.require("TokenStaker");

// TODO: change this for the actual migration
module.exports = async function(deployer) {
  await deployer.deploy(TokenStaker, "0x02363a2F1B2c2C5815cb6893Aa27861BE0c4F760", "Test", "T");
}