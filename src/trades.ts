require("dotenv").config();
import { ChainId, Fetcher, Token, Route, WETH, Trade, TokenAmount, TradeType, Percent, Pair } from "@uniswap/sdk";
import { ethers, Contract } from "ethers";
import  Utils from "./utils";
import Alerts from "./alerts";



interface TradeData{
    entry: number,
    target: number,
    stoploss: number,
    name: string,
    token: Token,
    size: number
    active: boolean
}

export default class Trades{

    // class vars
    trades: {};
    alerts: Alerts;
    WETH: Token;
    provider: ethers.providers.InfuraProvider | ethers.providers.JsonRpcProvider;
    WALLET_ADDR: string;
    PRIVATE_KEY: string;
    ETHERSCAN_LINK: string;
    ACCOUNT: ethers.Wallet;
    CONTRACT: Contract;
    discord: any;
    utils: Utils;
    SLIPPAGE: number;


    // constructor for new trade
    constructor(_provider, _utils: Utils) {

        // create empty trades object
        this.trades = {};

        // set provider
        this.provider = _provider;

        // set utils
        this.utils = _utils;

        // setup new alerts
        this.alerts = new Alerts(this.provider, _utils);

    }

    // get the current account balance
    async getWalletBalance() {

        try {

            const balanace = await this.ACCOUNT.getBalance();
            return balanace;

        } catch (err) {
            console.log("Failed to load balance: " + err);
            return null;
        }
        
    }

    // add the 'limit' orders (stoploss and take-profit)
    async addOrders(token, target, stoploss) {


        // setup stoploss
        this.alerts.newAlert(name, token, stoploss, 1, async (price: number) => {

            // swap tokens back to eth
            // await this.swapToken(token);

            this.utils.log(`stopped out of ${name} @ ${price}`);

        });

        // setup take-profit
        this.alerts.newAlert(name, token, target, 1, async (price: number) => {

            // swap tokens back to eth
            // await this.swapToken(token);

            this.utils.log(`target price reached for ${name} @ ${price}`);

        });

    }

    // create a new trade setup
    async newTrade(name: string, token: Token, entry: number, target: number, stoploss: number, size: number) {

        // setup new trade object
        let trade:TradeData = {
            name,
            token,
            entry,
            target,
            stoploss,
            size,
            active: false 
        }

        // add alert 
        this.trades[name] = trade; 

        // get token price
        let currentPrice = await this.utils.getTokenPrice(token);

        // check price to determine entry 
        if (parseFloat(currentPrice) <= entry) {

            // setup entry (price fell to entry)
            this.alerts.newAlert(name, token, target, 0, async (price: number) => {

                // swap eth to tokens
                // await this.swapETH(token, size.toString());

                // add target and stoploss
                this.addOrders(token, target, stoploss);

                // set trade to active
                this.trades[name].active = true;

                this.utils.log(`entered ${name} @ ${price} w/ ${size} ETH`);

            })

        } else {

            // setup entry (price rose to entry)
            this.alerts.newAlert(name, token, target, 1, async (price: number) => {

                // swap eth to tokens
                // await this.swapETH(token, size.toString());

                // add target and stoploss
                this.addOrders(token, target, stoploss);

                // set trade to active
                this.trades[name].active = true;

                this.utils.log(`entered ${name} @ ${price} w/ ${size} ETH`);

            })

        }

        this.utils.log(
            "```" +
            "Trade setup for " + name + ": (" + size + " " + ethers.constants.EtherSymbol + ")" + 
            "\nentry: $" + entry  + 
            "\ntarget: $" + target +
            "\nstop: $" + stoploss+
            "```");

    }

    // returns the trade provider
    getProvider() {
        return this.provider;
    }


}
    