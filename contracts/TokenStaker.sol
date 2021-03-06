// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.6.1;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TokenStaker is ERC721Burnable {
  
  using SafeERC20 for IERC20;
  using Counters for Counters.Counter;

  Counters.Counter private _rewardIds;

  struct Stake {
    uint256 amount;
    uint256 startBlock;
  }

  struct Reward {
    address owner;
    uint256 amount;
    uint256 blockDuration;
  }

  IERC20 public token;

  mapping(address => Stake) public stakeRecords;
  mapping(uint256 => Reward) public rewardRecords;
  uint256 public totalStaked;

  event AddStakedTokens(address user, uint256 amount);
  event RemoveStakedTokens(address user, uint256 amount);
  event MintedReward(address user, uint256 amount, uint256 duration);

  constructor(address tokenAddress, string memory name, string memory symbol) ERC721(name, symbol) public {
    token = IERC20(tokenAddress);
  }

  // Adds staked tokens
  // requires user to have called approve first on the token contract for TokenStaker
  function stake(uint256 numTokens) public {
    require(token.balanceOf(msg.sender) >= numTokens, "Can't stake more than you have");
    require(stakeRecords[msg.sender].amount == 0, "Can't already be staked with balance");
    require(stakeRecords[msg.sender].startBlock == 0, "Can't already be staked with starting block");

    // Update the mapping
    stakeRecords[msg.sender] = Stake(
      numTokens,
      block.number
    );
    // Update the totalStaked count
    totalStaked = totalStaked + numTokens;

    // Transfer tokens to contract
    token.safeTransferFrom(msg.sender, address(this), numTokens);
    emit AddStakedTokens(msg.sender, numTokens);
  }

  // Removes all staked tokens
  function removeStake() public {
    require(stakeRecords[msg.sender].amount > 0, "Need to have nonzero balance");
    require(stakeRecords[msg.sender].startBlock > 0, "Need to have nonzero start nlock");

    uint256 numTokens = stakeRecords[msg.sender].amount;
    
    // Reduce the totalStaked count
    totalStaked = totalStaked - numTokens;
    
    // Remove the mapping
    delete stakeRecords[msg.sender];

    // Transfer the staked tokens back
    token.safeTransfer(msg.sender, numTokens);
    emit RemoveStakedTokens(msg.sender, numTokens);
  }
  
  function getReward() public {
    require(stakeRecords[msg.sender].amount > 0, "Need to have nonzero tokens staked");
    require(stakeRecords[msg.sender].startBlock < block.number, "Can't claim rewards in the same block as you stake");
    uint256 numTokens = stakeRecords[msg.sender].amount;
    uint256 startBlock = stakeRecords[msg.sender].startBlock;

    // Reset start block to be current block number but keep the same number of tokens
    stakeRecords[msg.sender] = Stake(
      numTokens,
      block.number
    );

    // Get new reward id
    _rewardIds.increment();
    uint256 newRewardId = _rewardIds.current();

    // Set the new NFT's data
    uint256 blockDuration = block.number-startBlock;
    rewardRecords[newRewardId] = Reward(
      msg.sender,
      numTokens,
      blockDuration
    );

    // Mint the new NFT
    _safeMint(msg.sender, newRewardId);
    emit MintedReward(msg.sender, numTokens, blockDuration);
  }


  // returns ids of all rewards held by user
  function getRewardsList(address user) public view returns(uint256[] memory) {
    uint256 numRewards = balanceOf(user);
    uint256[] memory rewardsList = new uint[](numRewards);
    for (uint256 i = 0; i < numRewards; i++) {
      rewardsList[i] = tokenOfOwnerByIndex(user, i);
    }
    return rewardsList;
  }

  function getStake(address staker) public view returns(uint256[2] memory) {
    uint256[2] memory s = [stakeRecords[staker].amount, stakeRecords[staker].startBlock];
    return s;
  }

}