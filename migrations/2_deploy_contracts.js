let TokenStaker = artifacts.require("TokenStaker");

// TODO: change this for the actual migration
module.exports = async function(deployer) {
  deployer.deploy(TokenStaker, "0x89ee58af4871b474c30001982c3d7439c933c838", "Gems", "GEM");
}