const FakeToken = artifacts.require("FakeToken");
const TokenStaker = artifacts.require("TokenStaker");
const truffleAssert = require('truffle-assertions');

contract("FakeToken tests", async accounts => {
  it("correctly gives 100 tokens to the first address", async () => {
    let instance = await FakeToken.deployed();
    let balance = await instance.balanceOf.call(accounts[0]);
    assert.equal(balance.toNumber(), 100);
  });
  it("correctly gives 20 tokens to the second address", async() => {
    let instance = await FakeToken.deployed();
    await instance.transfer(accounts[1], 20);
    let b0 = await instance.balanceOf.call(accounts[0]);
    let b1 = await instance.balanceOf.call(accounts[1]);
    assert.equal(b0.toNumber(), 80);
    assert.equal(b1.toNumber(), 20);
  });
});

contract("TokenStaker tests", async accounts => {

  it ("allows staking/unstaking of 10 tokens", async() => {
    let tokenInst = await FakeToken.deployed();
    let stakerInst = await TokenStaker.deployed();

    // staking should change state correctly
    await tokenInst.approve(stakerInst.address, 10);
    await stakerInst.stake(10, {from: accounts[0]});
    let b0 = await tokenInst.balanceOf.call(accounts[0]);
    assert.equal(b0.toNumber(), 90);
    let stake0 = await stakerInst.getStake(accounts[0]);
    assert.equal(stake0[0], 10);
    let totalStaked = await stakerInst.totalStaked.call();
    assert.equal(totalStaked.toNumber(), 10);

    await stakerInst.removeStake({from: accounts[0]});

    // unstaking should revert to original state
    b0 = await tokenInst.balanceOf.call(accounts[0]);
    assert.equal(b0.toNumber(), 100);
    stake0 = await stakerInst.getStake(accounts[0]);
    assert.equal(stake0[0], 0);
  });
});

contract("TokenStaker tests 2", async accounts => {

  it ("correctly reverts on bad inputs", async() => {
    let tokenInst = await FakeToken.deployed();
    let stakerInst = await TokenStaker.deployed();

    await tokenInst.approve(stakerInst.address, 10);
    // Can't overstake
    await truffleAssert.reverts(
      stakerInst.stake(100, {from: accounts[0]})
    );
    await stakerInst.stake(1, {from: accounts[0]});
    // Can't double stake
    await truffleAssert.reverts(
      stakerInst.stake(1, {from: accounts[0]})
    );
  });
});

contract("TokenStaker tests 3", async accounts => {

  it ("allows minting of the NFT", async() => {
    let tokenInst = await FakeToken.deployed();
    let stakerInst = await TokenStaker.deployed();

    await tokenInst.approve(stakerInst.address, 10);
    await stakerInst.stake(10, {from: accounts[0]});
    let s0 = await stakerInst.stakeRecords.call(accounts[0]);

    await stakerInst.getReward({from: accounts[0]});
    let nft0 = await stakerInst.balanceOf.call(accounts[0]);
    assert.equal(nft0, 1);
    let a0 = await stakerInst.ownerOf.call(1);
    assert.equal(a0, accounts[0]);
    let nftAmt0 = await stakerInst.rewardRecords.call(1);
    assert.equal(nftAmt0["amount"].toNumber(), 10);

    let s1 = await stakerInst.stakeRecords.call(accounts[0]);

    assert(s1["startBlock"].toNumber() > s0["startBlock"].toNumber());
  });
});