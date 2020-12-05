// import { legos } from "@studydefi/money-legos";
import { ChainId, Fetcher, Token, Route, WETH, Trade, TokenAmount, TradeType, Percent, Pair } from "@uniswap/sdk";
import { ethers, Wallet, Contract } from "ethers";
// import kovan from './kovanConfig';
import { networks } from "../truffle-config.js";
import axios from "axios";
const BN = require('bn.js');
require("dotenv").config()



let MyContract;
let wallet;
let swap;
let chain;
let provider;
let chainId;
let weth;
let signer;
let account;

export async function setup(chainName: string) {

    // set chain name
    chain = chainName;

    // setup provider
    /*
    provider = ethers.getDefaultProvider(chain, {
        infura: process.env.INFURA_ID
    })
    */

    // match chain with ChainId Enum
    if (chain === "mainnet") {

        chainId = ChainId.MAINNET;

    } else if (chain === "ropsten"){ 

        chainId = ChainId.ROPSTEN;

    } else if (chain === "dev") {

        // chainId = 5777;
        chainId = ChainId.MAINNET;

        // override provider
        provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:7545');

    }


    // get chain WETH
    weth = WETH[ChainId.MAINNET];

    // get contract
    MyContract = require("./../build/contracts/Swap.json");

    // const contractFlashloanMoneyLegoAddress = FlashloanMoneyLego.networks[kovan.networkID].address;

    // setup account
    signer = new ethers.Wallet(Buffer.from(process.env.DEV_ACCOUNT_KEY, "hex"));
    account = signer.connect(provider);

    // let walletPK = `0x${process.env.DEV_ACCOUNT_KEY}`

    // wallet = new Wallet(walletPK, provider);

    const deployedNetwork = MyContract.networks[5777];

    // construct contract
    swap = new Contract(
        deployedNetwork.address,
        MyContract.abi,
        account,
    );


    await account.getBalance().then((res: any) => {
        console.log(`\nWallet balance: ${ethers.utils.formatEther(res.toString())} ETH`);
    })


}

// get the best gas price from eth gas
async function getGasPrice(speed?: string) {
    
    // make request w/ axios
    const price = await axios.get('https://ethgasstation.info/api/ethgasAPI.json?api-key=' + process.env.DEFI_PULSE_KEY)

    if (speed === "fastest")
        return(parseInt(price.data.fastest)/10);
    else if (speed === "fast")
        return(parseInt(price.data.fast)/10);
    else 
        return(parseInt(price.data.average)/10);

}


async function getContractAllowance(contract: ethers.Contract, owner: string, spender: string) {

    // get allowance
    const allowance = await contract.allowance(owner, spender);

    return allowance;

}


export async function approveTokens(inputToken: Token | string) {

    let token:Token;

    // convert string address to token if needed
    if (typeof inputToken === "string")
        token = await Fetcher.fetchTokenData(ChainId.MAINNET, inputToken);
    else
        token = token = inputToken;

    // let abi = ["function approve(address _spender, uint256 _value) public returns (bool success)"];

    // get the token/eth pair
    const pair = await Fetcher.fetchPairData(weth, token);
    // const pairAddress = Pair.getAddress(token, weth)

    // construct pair contract
    // const pairContract = new ethers.Contract(pair.liquidityToken.address, process.env.GENERIC_CONTRACT, account);
    const tokenContract = new ethers.Contract(token.address, process.env.GENERIC_CONTRACT, account);

    // get the token balance
    const balance = await tokenContract.balanceOf(process.env.DEV_ACCOUNT_ADDRESS);
    console.log(`Token Balance: ${ethers.utils.formatEther(balance.toString())}`);

    // get current gas price
    const gasPrice = await getGasPrice("fastest");
    const gas = ethers.utils.parseUnits(gasPrice.toString(), "gwei");
    console.log(`Current Gas Price: ${gasPrice} \n`);

    
    // approve all tokens by passing in UNIv2 router as spender
    const tx = await tokenContract.approve('0x7a250d5630b4cf539739df2c5dacb4c659f2488d', balance, {
        gasPrice: gasPrice * 1e9,
        gasLimit: '4000000'
    });

    console.log(`Transaction Hash https://${chain}.etherscan.io/tx/${tx.hash}`);

    // wait for transaction to finish 
    try{
        await tx.wait();
    } catch(e) {
        console.log(`Transaction Failed: https://${chain}.etherscan.io/tx/${tx.hash}`);
        return;
    }

    console.log(`Transaction Success: https://${chain}.etherscan.io/tx/${tx.hash}`);

}


export async function getTokenBalance(inputToken: Token | string) {

     let token:Token;
    
    // convert string address to token if needed
    if (typeof inputToken === "string")
        token = await Fetcher.fetchTokenData(ChainId.MAINNET, inputToken);
    else
        token = inputToken


    // construct contract and get token bal
    const contract = new ethers.Contract(token.address, process.env.GENERIC_CONTRACT, provider);

    // get the token balance
    const balance = await contract.balanceOf(process.env.DEV_ACCOUNT_ADDRESS);

    return balance;


}


export async function swapETH(inputToken: Token | string, amountETH: string) {

    let token:Token;
    
    // convert string address to token if needed
    if (typeof inputToken === "string")
        token = await Fetcher.fetchTokenData(ChainId.MAINNET, inputToken);
    else
        token = inputToken

    // get pair data
    const pair = await Fetcher.fetchPairData(token, weth);

    // get route
    const route = new Route([pair], weth);

    // get trade for execution price
    const trade = new Trade(route, new TokenAmount(weth, ethers.utils.parseEther(amountETH).toString()), TradeType.EXACT_INPUT);

    // smart contract parameters 
    const slippageTolerance = new Percent('2', '100');
    const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw.toString();
    // const path = [weth.address, token.address];
    // const to = Config.WALLET_ADDRESS;
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
    const value = trade.inputAmount.raw.toString();


    // get current gas price
    const gasPrice = await getGasPrice("fastest");

    // const gas = ethers.utils.parseUnits(gasPrice.toString(), "gwei");
    console.log(`Current Gas Price: ${gasPrice} \n`);

    // execute swap
    const tx = await swap.swapExactETHForTokens(token.address, amountOutMin, deadline, {
        value: value, 
        gasPrice: gasPrice * 1e9,
        gasLimit: '4000000'
    });

    console.log(`Transaction Hash https://${chain}.etherscan.io/tx/${tx.hash}`);

    // wait for transaction to finish 
    try{
        await tx.wait();
    } catch(e) {
        console.log(`Transaction Failed: https://${chain}.etherscan.io/tx/${tx.hash}`);
        return;
    }

    console.log(`Transaction Success: https://${chain}.etherscan.io/tx/${tx.hash}`);

}

// swap token for eth 
export async function swapToken(inputToken: Token | string) {

    let token:Token;

    // convert string address to token if needed
    if (typeof inputToken === "string")
        token = await Fetcher.fetchTokenData(ChainId.ROPSTEN, inputToken);
    else
        token = inputToken;

    // construct contract and get token bal
    const contract = new ethers.Contract(token.address, process.env.GENERIC_CONTRACT, provider);
    // const tokenBal = await contract.balanceOf(Config.WALLET_ADDRESS);

    // get pair data
    const pair = await Fetcher.fetchPairData(token, weth);

    // get the token balance
    const balance = await contract.balanceOf(process.env.DEV_ACCOUNT_ADDRESS);

    console.log(`Token Balance: ${ethers.utils.formatEther(balance.toString())}`);

    // get route
    const route = new Route([pair], token);

    // get trade for execution price
    const trade = new Trade(route, new TokenAmount(token, balance.toString()), TradeType.EXACT_INPUT);


    // smart contract parameters 
    const slippageTolerance = new Percent('5', '100');
    let amountIn = trade.inputAmount.raw.toString();
    let amountOutMin = trade.minimumAmountOut(slippageTolerance).raw.toString();
    // const path = [token.address, weth.address];
    // const to = process.env.DEPLOYMENT_ACCOUNT_ADDRESS;
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

    // amountIn = ethers.utils.parseUnits(amountIn).toString();
    // amountOutMin = ethers.utils.parseUnits(amountOutMin).toString();
    // console.log(`${amountIn} / ${amountOutMin}`);

    // get contract
    const tokenContract = new ethers.Contract(token.address, process.env.GENERIC_CONTRACT, account);

    // execute approval
    const approve = await tokenContract.approve(swap.address, amountIn);

    // wait for contract approval
    await approve.wait();

    // get current gas price
    const gasPrice = await getGasPrice("fastest");

    // const gas = ethers.utils.parseUnits(gasPrice.toString(), "gwei");
    console.log(`Current Gas Price: ${gasPrice} \n`);

    // execute swap
    const tx = await swap.swapExactTokensForETH(token.address, amountIn, amountOutMin, deadline, { 
       gasPrice: gasPrice * 1e9,
       gasLimit: '4000000' 
    });

    console.log(`Transaction Hash https://${chain}.etherscan.io/tx/${tx.hash}`);

    // wait for transaction to finish 
    try{
        await tx.wait();
    } catch(e) {
        console.log(e);
        console.log(`Transaction Failed: https://${chain}.etherscan.io/tx/${tx.hash}`);
        return;
    }

    console.log(`Transaction Success: https://${chain}.etherscan.io/tx/${tx.hash}`);

    return tx;

}


const start = async () => {

    /*
    const tx = await swap.swapExactTokensForETH(
        '0xc778417e063141139fce010982780140aa0cd5ab', // We would like to borrow DAI (note override to Kovan address)
        ethers.utils.parseEther("1000"), // We would like to borrow 1000 DAI (in 18 decimals),
        "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
        { gasLimit: '4000000', },
    );

    // Inspect the issued transaction
    console.log(tx);

    // wait for transaction to finish
    let receipt = await tx.wait();

    // Inspect the transaction receipt
    console.log(receipt);

    // Inspect the transaction hash
    console.log("Tx Hash: ", receipt.transactionHash);
    */

    // $UNI 
    const token = await Fetcher.fetchTokenData(ChainId.MAINNET, '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984');

    const contract = new ethers.Contract(token.address, process.env.GENERIC_CONTRACT, account);
    
    try {
        // await swapETH(token, "2");
        // await approveTokens(token);
        await swapToken(token);
        // let allowance = await getContractAllowance(contract, process.env.DEV_ACCOUNT_ADDRESS, "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");
        // console.log(ethers.utils.formatEther(allowance.toString()));

        const bal = await getTokenBalance(token);
        console.log(ethers.utils.formatEther(bal.toString()));

    } catch (e) {
        console.log(e);
    }

}

setup("dev").then(() => start());
