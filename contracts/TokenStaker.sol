// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.6.1;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenStaker {

  struct Stake {
    uint256 amount;
    uint256 startBlock;
  }

  mapping(address => Stake) public stakeRecords;
  uint256 public totalStaked;
  IERC20 public token;

  event AddStakedTokens(address user, uint256 amount);
  event RemoveStakedTokens(address user, uint256 amount);

  constructor(address tokenAddress) public {
    token = IERC20(tokenAddress);
  }

  // Adds staked tokens
  // requires user to have called approve first on the token contract for TokenStaker
  function stake(address staker, uint256 numTokens) public {
    require(staker != address(0), "Can't stake for the zero address");
    require(token.balanceOf(staker) >= numTokens, "Can't stake more than you have");
    // transfer tokens to contract
    bool result = token.transferFrom(staker, address(this), numTokens);
    if (result == true) {
      // update the mapping
      stakeRecords[staker] = Stake(
      numTokens,
      block.number
      );
      // update the totalStaked count
      totalStaked = totalStaked + numTokens;
      emit AddStakedTokens(staker, numTokens);
    }
  }

  // Removes all staked tokens
  function removeStake(address staker) public {
    require(staker != address(0), "Can't stake for the zero address");
    uint256 numTokens = stakeRecords[staker].amount;
    token.approve(address(this), numTokens);
    bool result = token.transferFrom(address(this), staker, numTokens);
    if (result == true) {
      delete stakeRecords[staker];
      totalStaked = totalStaked - numTokens;
      emit RemoveStakedTokens(staker, numTokens);
    }
  }

  function getStake(address staker) public view returns(uint256[2] memory) {
    uint256[2] memory s = [stakeRecords[staker].amount, stakeRecords[staker].startBlock];
    return s;
  }

  function getBlockDiff(address staker) public view returns(uint256) {
    return (block.number-stakeRecords[staker].startBlock);
  }
}