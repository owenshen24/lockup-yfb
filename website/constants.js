const tokenAddr = "0x57236d2f34df352a8b7c358e17e6f1040df1cae8";
const stakerAddr = "0xc1c12ef86471140e2158a645b218c322261acd4c";
const abiERC20 = [
  {
      "constant":true,
      "inputs":[{"name":"_owner","type":"address"}],
      "name":"balanceOf",
      "outputs":[{"name":"balance","type":"uint256"}],
      "type":"function"
  },
  {
      "constant":true,
      "inputs":[{"name":"_owner","type":"address"}, {"name":"_spender","type":"address"}],
      "name":"allowance",
      "outputs":[{"name":"remaining","type":"uint256"}],
      "type":"function"
  },
  {
      "constant":true,
      "inputs":[{"name":"_spender","type":"address"}, {"name":"_value","type":"uint256"}],
      "name":"approve",
      "outputs":[],
      "type":"function"
  }
];