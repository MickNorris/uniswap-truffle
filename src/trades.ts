require("dotenv").config();
import { Token } from "@uniswap/sdk";
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
    dry: boolean;


    // constructor for new trade
    constructor(_provider, _utils: Utils, _alerts: Alerts, _dry?: boolean) {

        // create empty trades object
        this.trades = {};

        // set provider
        this.provider = _provider;

        // actually send money or not
        if (_dry !== undefined) {
            this.dry = true;
            console.log("===== dry run =====")
        } else {
            this.dry = _dry;
        }

        // set utils
        this.utils = _utils;

        // setup new alerts
        this.alerts = _alerts;

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
    async addOrders(token, _name, target, stoploss) {

        const takeProfitName = _name + "-take-profit" ;
        console.log(target);

        // setup take-profit
        this.alerts.newAlert(takeProfitName, token, target, 0, async (price: number) => {

            // swap tokens back to eth
            if (!this.dry)
                await this.utils.swapToken(token);

            this.utils.log(`target price reached for ${takeProfitName} @ \$${price}`, true);

        });

        const stopName = _name + "-stoploss" ;

        // setup stoploss
        this.alerts.newAlert(stopName, token, stoploss, 1, async (price: number) => {

            // swap tokens back to eth
            if (!this.dry)
                await this.utils.swapToken(token);

            this.utils.log(`stopped out of ${stopName} @ \$${price}`, true);

        });

    }

    validateOrders(currentPrice: string, entry: number, target:number , stoploss: number) {

        // validate stoploss
        if (stoploss >= parseFloat(currentPrice)) { 
            this.utils.log(`stoploss must be below price @ \$${currentPrice}`, true);
            return false;
        }

        // validate take-profit
        if (target <= parseFloat(currentPrice)) {
            this.utils.log(`take-profit must be above price @ \$${currentPrice}`, true);
            return false;
        }

        return true;

    }

    // create a new trade setup
    async newSetup(name: string, token: Token, entry: number, target: number, stoploss: number, size: number) {


        // get token price
        let currentPrice = await this.utils.getTokenPrice(token);

        if (!this.validateOrders(currentPrice, entry, target, stoploss))
            return;

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

        // check price to determine entry 
        if (parseFloat(currentPrice) <= entry) {

            // setup entry (price fell to entry)
            this.alerts.newAlert(name, token, entry, 0, async (price: number) => {

                // swap eth to tokens
                if (!this.dry)
                    await this.utils.swapETH(token, size.toString()); 

                // add target and stoploss
                this.addOrders(token, name, target, stoploss);

                // set trade to active
                this.trades[name].active = true;

                this.utils.log(`entered ${name} @ \$${price} w/ ${size} ${ethers.constants.EtherSymbol}`, true);

            })

        } else {

            // setup entry (price rose to entry)
            this.alerts.newAlert(name, token, entry, 1, async (price: number) => {

                // swap eth to tokens
                if (!this.dry)
                    await this.utils.swapETH(token, size.toString()); 

                // add target and stoploss
                this.addOrders(token, name, target, stoploss);

                // set trade to active
                this.trades[name].active = true;

                this.utils.log(`entered ${name} @ \$${price} w/ ${size} ${ethers.constants.EtherSymbol}`, true);

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

    // create a new trade setup but enter immediately
    async newTrade(name: string, token: Token, target: number, stoploss: number, size: number) {

        // get token price
        let currentPrice = await this.utils.getTokenPrice(token);

        if (!this.validateOrders(currentPrice, parseFloat(currentPrice), target, stoploss))
            return;

        // setup new trade object
        let trade:TradeData = {
            name,
            token,
            entry: parseFloat(currentPrice),
            target,
            stoploss,
            size,
            active: false 
        }

        // enter trade
        if (!this.dry)
            await this.utils.swapETH(token, size.toString()); 


        // add alert 
        this.trades[name] = trade; 
        this.trades[name].active = true;

        // add target and stoploss
        this.addOrders(token, name, target, stoploss);

        this.utils.log(
            "```" +
            "Trade setup for " + name + ": (" + size + " " + ethers.constants.EtherSymbol + ")" + 
            "\nentry: $" + currentPrice + 
            "\ntarget: $" + target +
            "\nstop: $" + stoploss+
            "```");

    }

    // save alerts to file
    saveTrades() {
        this.utils.saveObject(this.trades, "trades");
    }



    // returns the trade provider
    getProvider() {
        return this.provider;
    }


}
    