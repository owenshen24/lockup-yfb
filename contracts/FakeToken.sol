// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.6.1;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FakeToken is ERC20 {
  constructor(uint256 supply) ERC20("FakeToken", "FAKE") public {
    _mint(msg.sender, supply);
  }
}