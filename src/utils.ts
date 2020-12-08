require("dotenv").config();
import axios from "axios";
import { ChainId, Fetcher, Token, Route, WETH, Trade, TokenAmount, TradeType, Percent, Pair } from "@uniswap/sdk";
import { ethers, Contract } from "ethers";
const Discord = require('discord.js');

// this doesn't work if it isn't global :(
let discord;

export default class Utils {

    provider: ethers.providers.InfuraProvider | ethers.providers.JsonRpcProvider; 
    trades: {}
    // discord: any;
    WALLET_ADDR: string;
    PRIVATE_KEY: string;
    ETHERSCAN_LINK: string;
    WETH: Token;
    USDC: Token;
    ACCOUNT: ethers.Wallet; 
    CONTRACT: ethers.Contract;
    slippage: string;
    
    // init utils
    constructor(chainName: string) {

        // create empty trades object
        this.trades = {};


        // set chain name
        let chain = chainName;

        if (chainName !== "dev") {

            this.provider = new ethers.providers.InfuraProvider("mainnet", {
                projectId: process.env.INFURA_ID,
                projectSecret:process.env.INFURA_SECRET 
            });

        }

        // get contract
        let myContract = require("./../build/contracts/Swap.json");

        this.WALLET_ADDR = process.env.DEPLOYMENT_ACCOUNT_ADDRESS;
        this.PRIVATE_KEY = process.env.DEPLOYMENT_ACCOUNT_KEY;
        this.ETHERSCAN_LINK = "https://etherscan.io/";

        // 3% slippage by default
        this.slippage = "3";

        let deployedNetwork = myContract.networks[ChainId.MAINNET];

        if (chain === "dev") {

            // chainId = 5777;
            let chainId = ChainId.MAINNET;

            // override provider
            this.provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:7545');

            // override network
            // deployedNetwork = MyContract.networks[5777];

            // override keys and addr
            this.WALLET_ADDR = process.env.DEV_ACCOUNT_ADDRESS;
            this.PRIVATE_KEY = process.env.DEV_ACCOUNT_KEY;

        }

        // get chain WETH
        this.WETH= WETH[ChainId.MAINNET];
        this.USDC = new Token(ChainId.MAINNET, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 6);

        // setup account
        const signer = new ethers.Wallet(Buffer.from(this.PRIVATE_KEY, "hex"));
        this.ACCOUNT = signer.connect(this.provider);

        // construct contract
        this.CONTRACT = new Contract(
            deployedNetwork.address,
            myContract.abi,
            this.ACCOUNT,
        );

    }

    getSlippage() {
        return this.slippage;
    }

    setSlippage(_slippage: string) {
        this.slippage = _slippage;
    }

    // returns discord instance
    getDiscord() {
        return discord;
    }

    // returns USDC token
    getUSDC() {
        return this.USDC;
    }

    // initialize discord client
    async initDiscord() {

        // setup discord
        discord = await new Discord.Client();

        // login
        await discord.login(process.env.DISCORD_TOKEN);

    }


    // returns my custom contract
    getContract() {
        return this.CONTRACT;
    }

    // returns provider
    getProvider() {
        return this.provider;
    }


    async approveTokens(inputToken: Token | string) {

        let token:Token;

        // convert string address to token if needed
        if (typeof inputToken === "string")
            token = await Fetcher.fetchTokenData(ChainId.MAINNET, inputToken);
        else
            token = token = inputToken;

        // let abi = ["function approve(address _spender, uint256 _value) public returns (bool success)"];

        // get the token/eth pair
        const pair = await Fetcher.fetchPairData(this.WETH, token);
        // const pairAddress = Pair.getAddress(token, weth)

        // construct pair contract
        // const pairContract = new ethers.Contract(pair.liquidityToken.address, process.env.GENERIC_CONTRACT, account);
        const tokenContract = new ethers.Contract(token.address, process.env.GENERIC_CONTRACT, this.ACCOUNT);

        // get the token balance
        const balance = await tokenContract.balanceOf(this.WALLET_ADDR);
        console.log(`Token Balance: ${ethers.utils.formatEther(balance.toString())}`);

        // get current gas price
        const gasPrice = await this.getGasPrice("fastest");
        const gas = ethers.utils.parseUnits(gasPrice.toString(), "gwei");
        console.log(`Current Gas Price: ${gasPrice} \n`);

        
        // approve all tokens by passing in UNIv2 router as spender
        const tx = await tokenContract.approve('0x7a250d5630b4cf539739df2c5dacb4c659f2488d', balance, {
            gasPrice: gasPrice * 1e9,
            gasLimit: '4000000'
        });

        console.log(`Transaction: ${this.ETHERSCAN_LINK}tx/${tx.hash}`);

        // wait for transaction to finish 
        try{
            await tx.wait();
        } catch(e) {
            console.log(`Transaction Failed: ${this.ETHERSCAN_LINK}tx/${tx.hash}`);
            return;
        }

        console.log(`Transaction Success: ${this.ETHERSCAN_LINK}tx/${tx.hash}`);

    }


    async getTokenBalance(inputToken: Token | string) {

        let token:Token;
        
        // convert string address to token if needed
        if (typeof inputToken === "string")
            token = await Fetcher.fetchTokenData(ChainId.MAINNET, inputToken);
        else
            token = inputToken

        // construct contract and get token bal
        const contract = new ethers.Contract(token.address, process.env.GENERIC_CONTRACT, this.provider);

        // get the token balance
        const balance = await contract.balanceOf(this.WALLET_ADDR);

        return balance;

    }

    // swap token for eth 
    async swapToken(inputToken: Token | string, attempt?: number) {

        // if has gone terribly wrong
        // TODO: alert me
        if (attempt && attempt >= 5){ 
            console.log("Too many attemps!");
            return;
        }

        let token:Token;

        // convert string address to token if needed
        if (typeof inputToken === "string")
            token = await Fetcher.fetchTokenData(ChainId.MAINNET, inputToken);
        else
            token = inputToken;

        // construct contract and get token bal
        const contract = new ethers.Contract(token.address, process.env.GENERIC_CONTRACT, this.provider);
        // const tokenBal = await contract.balanceOf(Config.WALLET_ADDRESS);

        // get pair data
        const pair = await Fetcher.fetchPairData(token, this.WETH);

        // get the token balance
        const balance = await contract.balanceOf(this.WALLET_ADDR);

        console.log(`Token Balance: ${ethers.utils.formatEther(balance.toString())}`);

        // get route
        const route = new Route([pair], token);

        // get trade for execution price
        const trade = new Trade(route, new TokenAmount(token, balance.toString()), TradeType.EXACT_INPUT);


        // smart contract parameters 
        const slippageTolerance = new Percent(this.slippage, '100');
        let amountIn = trade.inputAmount.raw.toString();
        let amountOutMin = trade.minimumAmountOut(slippageTolerance).raw.toString();
        // const path = [token.address, weth.address];
        // const to = process.env.DEPLOYMENT_ACCOUNT_ADDRESS;
        const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

        // get contract
        const tokenContract = new ethers.Contract(token.address, process.env.GENERIC_CONTRACT, this.ACCOUNT);

        // execute approval
        const approve = await tokenContract.approve(this.CONTRACT.address, amountIn);

        // wait for contract approval
        await approve.wait();

        // get current gas price
        const gasPrice = await this.getGasPrice("fastest");

        // const gas = ethers.utils.parseUnits(gasPrice.toString(), "gwei");
        console.log(`Current Gas Price: ${gasPrice} \n`);

        // execute swap
        const tx = await this.CONTRACT.swapExactTokensForETH(token.address, amountIn, amountOutMin, deadline, { 
        gasPrice: gasPrice * 1e9,
        gasLimit: '4000000' 
        });

        console.log(`Transaction: ${this.ETHERSCAN_LINK}tx/${tx.hash}`);

        // wait for transaction to finish 
        try{
            await tx.wait();
        } catch(e) {
            // console.log(e);
            console.log(`Transaction Failed: ${this.ETHERSCAN_LINK}tx/${tx.hash}`);
            return;
        }

        console.log(`Transaction Success: ${this.ETHERSCAN_LINK}tx/${tx.hash}`);

        return tx;

    }

    // swap amountETH ETH for Token
    async swapETH(inputToken: Token | string, amountETH: string) {

        let token:Token;
        
        // convert string address to token if needed
        if (typeof inputToken === "string")
            token = await Fetcher.fetchTokenData(ChainId.MAINNET, inputToken);
        else
            token = inputToken

        // get pair data
        const pair = await Fetcher.fetchPairData(token, this.WETH);

        // get route
        const route = new Route([pair], this.WETH);

        // get trade for execution price
        const trade = new Trade(route, new TokenAmount(this.WETH, ethers.utils.parseEther(amountETH).toString()), TradeType.EXACT_INPUT);

        // smart contract parameters 
        const slippageTolerance = new Percent(this.slippage, '100');
        const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw.toString();
        const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
        const value = trade.inputAmount.raw.toString();

        // get current gas price
        const gasPrice = await this.getGasPrice("fastest");

        // const gas = ethers.utils.parseUnits(gasPrice.toString(), "gwei");
        console.log(`Current Gas Price: ${gasPrice} \n`);

        // execute swap
        const tx = await this.CONTRACT.swapExactETHForTokens(token.address, amountOutMin, deadline, {
            value: value, 
            gasPrice: gasPrice * 1e9,
            gasLimit: '4000000'
        });

        console.log(`Transaction: ${this.ETHERSCAN_LINK}tx/${tx.hash}`);

        // wait for transaction to finish 
        try{
            await tx.wait();
        } catch(e) {
            console.log(`Transaction Failed: ${this.ETHERSCAN_LINK}tx/${tx.hash}`);
            return;
        }

        console.log(`Transaction Success: ${this.ETHERSCAN_LINK}tx/${tx.hash}`);

    }

    // get the current wallet balance
    async getWalletBalance() {

        try {

            const balanace = await this.ACCOUNT.getBalance();
            return balanace;

        } catch (err) {
            console.log("Failed to load balance: " + err);
            return null;
        }
        
    }

    // log output and error message in a discord server
    async log(message: string, mention?: boolean | null) {

        let channelId:string = process.env.DISCORD_OUTPUT_ID;

        // console.log(this.discord.channels);

        // mention me if there is an error
        if (mention)
            discord.channels.cache.get(channelId).send("<@" + process.env.DISCORD_MENTION + ">\n" + message);
        else 
            discord.channels.cache.get(channelId).send(message);

    }

    // get the price of a token in usdc
    async getTokenPrice(token: Token) {
    
        // get pair data
        const pairUSD = await Fetcher.fetchPairData(this.WETH, this.USDC, this.provider);
        const pair = await Fetcher.fetchPairData(token, this.WETH, this.provider);

        // get route
        const route = new Route([pair, pairUSD], token);

        // get trade for execution price
        const trade = new Trade(route, new TokenAmount(token, `1${"".padEnd(token.decimals, '0')}`), TradeType.EXACT_INPUT);

        // get TOKEN/ETH price 
        const price = trade.executionPrice.toSignificant(6);

        return price;

    }

    // get the best gas price from eth gas
    async getGasPrice(speed?: string) {
        
        // make request w/ axios
        const price = await axios.get('https://ethgasstation.info/api/ethgasAPI.json?api-key=' + process.env.DEFI_PULSE_KEY)

        if (speed === "fastest")
            return(parseInt(price.data.fastest)/10);
        else if (speed === "fast")
            return(parseInt(price.data.fast)/10);
        else 
            return(parseInt(price.data.average)/10);

    }
}
