// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.6.1;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TokenStaker is ERC721 {
  
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
    
    // Remove the mapping
    delete stakeRecords[msg.sender];
    // Reduce the totalStaked count
    totalStaked = totalStaked - numTokens;

    // Transfer the tokens back
    token.safeTransfer(msg.sender, numTokens);
    emit RemoveStakedTokens(msg.sender, numTokens);
  }
  
  function getReward() public returns (uint256) {
    require(stakeRecords[msg.sender].amount > 0, "Need to have nonzero tokens staked");
    uint256 numTokens = stakeRecords[msg.sender].amount;
    uint256 startBlock = stakeRecords[msg.sender].startBlock;
    _rewardIds.increment();

    // Reset start block to be current block number
    stakeRecords[msg.sender] = Stake(
      numTokens,
      block.number
    );

    // Get new reward id
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

  function getStake(address staker) public view returns(uint256[2] memory) {
    uint256[2] memory s = [stakeRecords[staker].amount, stakeRecords[staker].startBlock];
    return s;
  }

}