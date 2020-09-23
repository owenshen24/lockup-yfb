const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const Fortmatic = window.Fortmatic;

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

  staker.methods.getRewardsList(account).call({from: account}).then(async function(tokenIds) {
    let gemsList = [];
    for (let i of tokenIds) {
      let attributes = await staker.methods.rewardRecords(i).call();
      gemsList.push(attributes);
    }
    console.log(gemsList);
    displayGems(gemsList);
  });

  $(".displayed-gem").click(function() {

  });
}

function displayGems(gemsList) {
  window.gemsList = gemsList;
  for (let i = 0; i < gemsList.length; i++) {
    let gem = $('<div><div id="' + i + '" class="displayed-gem tooltip"><span class="tooltiptext"' + 'id=text' + i + '>t</span></div></div>');
    let amt = web3.utils.fromWei(gemsList[i][1], "ether");
    let color = getColor(Math.sqrt(amt), Math.sqrt(1000));
    let size = Math.sqrt(gemsList[i][2]).toFixed(5);
    let displaySize = size*4;
    $("#gem-display").append(gem);
    $("#" + i).width(displaySize);
    $("#" + i).height(displaySize);
    $("#" + i).css("background-color", color);
    let attrString = "Color: " + color + " " + "Size: " + size;
    $("#text" + i).text(attrString);
  }
}

function getColor(length, maxLength) {
  let i = (length * 255 / maxLength);
  let r = Math.round(Math.sin(0.024 * i + 0) * 127 + 128);
  let g = Math.round(Math.sin(0.024 * i + 2) * 127 + 128);
  let b = Math.round(Math.sin(0.024 * i + 4) * 127 + 128);
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}