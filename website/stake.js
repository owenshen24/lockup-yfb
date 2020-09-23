const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const Fortmatic = window.Fortmatic;
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
const tokenAddr = "0x57236d2f34df352a8b7c358e17e6f1040df1cae8";
const stakerAddr = "0xc1c12ef86471140e2158a645b218c322261acd4c";
let web3Modal, provider, account;

$(document).ready(async function() {
    $('#connect-wallet').on('click', async() => {
        initWeb3Modal();
        let didConnect = await onConnect();
        if (didConnect) {
          window.web3 = new Web3(provider);
          console.log("Web3 instance is", web3);
          await connectWallet();
          await initApp();
        }
    });
});

const initWeb3Modal = () => {
    const providerOptions = {
        walletconnect: {
            package: WalletConnectProvider,
            options: {
                infuraId: "eb5ba991ba924ec5b80fd85423fd901f"
            }
        },
        fortmatic: {
            package: Fortmatic,
            options: {
              key: "pk_live_5DFF7F46E1DE0704"
            }
        }
    };
    web3Modal = new Web3Modal({
        cacheProvider: false, 
        providerOptions, 
        disableInjectedProvider: false, 
        theme: "dark"
    });
}

async function onConnect() {
    try {
        provider = await web3Modal.connect();
        return true;
    }
    catch(e) {
        alert("No web3 provider found");
        return false;
    }
}

async function connectWallet() {
    try {
        await window.ethereum.enable();
        web3.eth.getAccounts().then(e => {
            account = e[0];
            web3.eth.defaultAccount = account;
            let truncAcc = account.substring(0, 11) + "...";
            $("#connect-wallet").text(truncAcc);
            $("#connect-wallet").attr('disabled','disabled');
        });
    } catch (err) {
        console.log(err);
    }
}

async function initApp() {
  let stakerJSON = await $.getJSON("./TokenStaker.json");
  staker = await new web3.eth.Contract(stakerJSON["abi"], stakerAddr);
  token = await new web3.eth.Contract(abiERC20, tokenAddr);

  showTokenAmt();
  showGem();

  token.methods.allowance(account, stakerAddr).call({from:account}).then(function(r) {
    console.log("allowance: ", r);
    if (r == 0) {
      $("#approve").show();
      $("#approve").click(async function() {
        let allowedBalance = web3.utils.toWei("1000000", 'ether');
        token.methods.approve(stakerAddr, allowedBalance).send({from: account})
        .on('transactionHash', function(hash){
            console.log(hash);
        })
        .on('confirmation', function(confirmationNumber, receipt){
            console.log("confirmed!");
        })
        .on('error', function(error){
            console.log(error);
        })
        .then(function() {
          $("stake").prop("disabled", false);
        });
      });
    }
    // otherwise, show if people have no stake
    else if (r > 0) {
      staker.methods.getStake(account).call({from:account}).then(function(arr) {
        // If the user is staked 0
        if (web3.utils.toBN(arr[0]) == 0) {
          $("stake").prop("disabled", false);
        }
      });
    }
  });

  showStakedAmt();

  $("#available-holder").click(function() {
    $("#stake-amount").val($("#available").text());
  });

  $("#stake").click(async function() {
    let stakeAmt = $("#stake-amount").val();
    let stakeAmtBN =  web3.utils.toWei(stakeAmt, 'ether');
    staker.methods.stake(stakeAmtBN).send({from:account})
      .on('transactionHash', function(hash){
        $("stake").prop("disabled", true);
        console.log(hash);
      })
      .on('confirmation', function(confirmationNumber, receipt){
        console.log("confirmed!");
        showStakedAmt();
        showTokenAmt();
        $("#stake-amount-holder").hide();
      })
      .on('error', function(error){
        console.log(error);
      });
    });

  $("#withdraw").click(async function() {
    staker.methods.removeStake().send({from:account})
    .on('transactionHash', function(hash){
      $("stake").prop("disabled", false);
      console.log(hash);
    })
    .on('confirmation', function(confirmationNumber, receipt){
      console.log("confirmed!");
      showStakedAmt();
      showTokenAmt();
      showGem();
    })
    .on('error', function(error){
      console.log(error);
    });
  });
}

// add get rewards button

function showStakedAmt() {
  staker.methods.getStake(account).call({from:account}).then(function(arr) {
    // update front-end to show number of staked tokens
    $("#staked-num").text(web3.utils.fromWei(arr[0], "ether"));
    // allow 
    if (web3.utils.toBN(arr[0]) == 0) {
      $("#stake-amount-holder").show();
    }
  });
}

function showTokenAmt() {
  token.methods.balanceOf(account).call({from:account}).then(function(tokenBalance) {
    window.tokenBalance = tokenBalance;
    let truncBalance = Number.parseFloat(web3.utils.fromWei(tokenBalance, 'ether')).toFixed(7);
    $("#available").text(truncBalance);
  });
}

function showGem() {
  staker.methods.getStake(account).call({from:account}).then(async function(arr) {
    let amt = web3.utils.fromWei(arr[0], "ether");
    if (amt > 0) {
      let currBlock = await web3.eth.getBlockNumber();
      let diff = currBlock-Number(arr[1]);
      let color = getColor(Math.sqrt(amt), Math.sqrt(1000));
      let size = Math.sqrt(diff);
      $("#gem").attr("width", size);
      $("#gem").attr("height", size);
      $("#gem").attr("fill", color);

      $("#color").text(color);
      $("#size").text(size.toFixed(3));
    }
    else {
      $("#gem").hide();
      $("#mine").hide();
      $(".gem-attributes").hide();
    }
  });
}

function getColor(length, maxLength) {
  let i = (length * 255 / maxLength);
  let r = Math.round(Math.sin(0.024 * i + 0) * 127 + 128);
  let g = Math.round(Math.sin(0.024 * i + 2) * 127 + 128);
  let b = Math.round(Math.sin(0.024 * i + 4) * 127 + 128);
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}