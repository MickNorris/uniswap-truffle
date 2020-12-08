require("dotenv").config();
import { ChainId, Token, WETH } from "@uniswap/sdk";
import { ethers } from "ethers";
import  Utils from "./utils";

enum AlertType {
    CrossOver,
    CrossUnder
}

interface AlertData{
    name: string,
    token: Token,
    target: number,
    type: AlertType,
    callback: void
    active: boolean
}

// doesn't work if declared inside of class >:(
let interval;

export default class Alerts{

    // class vars
    alerts: {};
    WETH: Token;
    USDC: Token;
    POLING_TIME: number;
    provider: ethers.providers.InfuraProvider;
    quiet: boolean;
    utils: Utils;
    

    // constructor for new trade
    constructor(_provider, _utils: Utils, _quiet?: boolean) {

        // set quiet flag (don't print anything to console)
        if (_quiet)
            this.quiet = true;
        else 
            this.quiet = false;

        this.utils = _utils;

        this.provider = _provider;

        this.WETH = WETH[ChainId.MAINNET];

        this.USDC = this.utils.getUSDC();

        this.POLING_TIME = 3000;

        // create blank alerts object
        this.alerts = {};

        // start polling prices
        // this.interval = this.polling(); 

        // start polling
        this.resetPolling();

    }


    // setup price polling var

    resetPolling() {

        // get rid of old interval
        clearInterval(interval);
        

        // don't create a new interval if one already exists
        if (interval === undefined)
            // create new interval
            interval = setInterval(() => {
                this.checkAlerts();
            }, this.POLING_TIME);

    }


    newAlert(name: string, token: Token, target: number, type: AlertType, callback) {

        // setup new trade object
        let alert:AlertData = {
           name: name.toUpperCase(),
           token,
           target,
           type,
           callback,
           active: true,
        }

        // add alert 
        this.alerts[name] = alert; 

    }

    // return the list of trades
    getAlerts() {
        return this.alerts; 
    }

    // get trade by name
    getAlert(name: string) {
        return(this.alerts[name]);
    }

    // close alert by name
    deleteAlert(name: string) {

        // set alert to innactive 
        if (this.alerts[name] !== undefined)
            this.alerts[name].active = false;

        // delete entry
        delete this.alerts[name];

        // create new interval
        this.resetPolling();

        return(this.alerts[name] === undefined);

    }

    // check alert by name
    async checkAlert(name: string) {

        // get the alert 
        const alert = this.alerts[name];

        // ignore inactive alerts
        if (alert === undefined || !alert.active)
            return;

        // get the token price
        const tokenPrice = await this.utils.getTokenPrice(alert.token);

        // send alert flag
        let sendAlert = false;

        // what kind of alert is set
        if (alert.type === AlertType.CrossOver) {
            sendAlert = (parseFloat(tokenPrice) > parseFloat(alert.target))
        } else {
            sendAlert = (parseFloat(tokenPrice) < parseFloat(alert.target))
        }
        
        // trigger callback if target is achieved 
        if (sendAlert) {

            // close the alert
            this.deleteAlert(alert.name);

            // send callback 
            alert.callback(parseFloat(tokenPrice));

        }

        // print if not quiet
        if (!this.quiet)
            console.log(`${alert.name}: \$${tokenPrice} (${alert.target})`);



    }

    // check all trades
    checkAlerts() {
        for (const alert in this.alerts) {
            if (alert !== undefined)
                this.checkAlert(alert);
        }
    }

}
    