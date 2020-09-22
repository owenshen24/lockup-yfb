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
const tokenAddr = "0x89ee58af4871b474c30001982c3d7439c933c838";
const stakerAddr = "0xaC6dcFF6E13132f075e36cA3a7F403236f869438";
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
    token = await new web3.eth.Contract(abiERC20, tokenAddr);

    let stakerJSON = await $.getJSON("./TokenStaker.json");
    staker = await new web3.eth.Contract(stakerJSON["abi"], stakerAddr);

    token.methods.balanceOf(account).call({from:account}).then(function(numTokens) {
        $("#balance").text(numTokens);
    });

    staker.methods.totalStaked.call().call().then(function(numStaked) {
        numStaked = web3.utils.fromWei(numStaked, "ether");
        $("#num-staked").text(numStaked);
    });
}