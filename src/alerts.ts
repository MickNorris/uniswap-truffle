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
    callback: any,
    active: boolean,
    orphaned: boolean
}

// doesn't work if declared inside of class >:(
var interval: NodeJS.Timeout | undefined;
var alerts: any;




export default class Alerts{

    // class vars
    WETH: Token;
    POLING_TIME: number;
    provider: ethers.providers.InfuraProvider | ethers.providers.JsonRpcProvider;
    quiet: boolean;
    utils: Utils;
    

    // constructor for new trade
    constructor(_provider: ethers.providers.JsonRpcProvider | ethers.providers.InfuraProvider, 
        _utils: Utils, _quiet?: boolean) {

        // set quiet flag (don't print anything to console)
        if (_quiet)
            this.quiet = true;
        else 
            this.quiet = false;

        this.utils = _utils;

        this.provider = _provider;

        this.WETH = WETH[ChainId.MAINNET];

        // check alerts every 5 seconds
        this.POLING_TIME = 5000;

        // load saved alerts
        this.loadAlerts();

        this.startPolling();

    }


    // setup price polling var
    async startPolling() {

        setInterval(this.checkAlerts.bind(this), this.POLING_TIME);

    }


    async newAlert(_name: string, token: Token, target: number, callback: any) {

        // wait for alerts to be loaded
        while (alerts === undefined) await this.utils.wait(500);

        const name = _name.toUpperCase();

        // get the current price of the token
        const currentPrice = await this.utils.getTokenPrice(token);

        // type of alert (over or under)
        let type;

        if (parseFloat(currentPrice) >= target) {
            // set alert to trigger if price goes under target
            type = AlertType.CrossUnder
        } else {
            // set alert to trigger if price goes over target
            type = AlertType.CrossOver;
        }

        // don't allow duplicate names
        if (alerts[name] !== undefined) {
            
            console.log(`'${name}' already exists!`);
            this.utils.log(`'${name}' already exists!`);
            return;

        }

        // setup new trade object
        let alert:AlertData = {
           name,
           token,
           target,
           type,
           callback,
           active: true,
           orphaned: false
        }

        // add alert 
        alerts[name] = alert;

        this.saveAlerts();


    }


    // save alerts to file
    saveAlerts() {
        this.utils.saveObject(alerts, "alerts");
    }

    // load alerts from file
    async loadAlerts() {

        // load the JSON
        let data = await this.utils.loadObject("alerts.json");

        // turn all Token JSON into Uniswap Tokens
        for (const _alert in data) {

            const alert = _alert.toUpperCase();

            // set JSON Token to Uniswap Token
            const token = await this.utils.getToken(data[alert].token.address);
            data[alert].token = token;

            // set JSON callback to Function
            // const callback = new Function(data[alert].callback);
            // data[alert].callback = callback;

            // callback doesn't work if the node process is killed
            data[alert].orphaned = true;
        }

        // store saved data or start over
        if (data)
            alerts = data;
        else
            alerts = {};

        // console.log(alerts);

    }

    // return the list of trades
    getAlerts() {
        return alerts; 
    }

    // get trade by name
    getAlert(name: string) {
        return(alerts[name.toUpperCase()]);
    }

    // close alert by name
    async deleteAlert(_name: string) {

        while (alerts === undefined) await this.utils.wait(500);

        const name = _name.toUpperCase();

        if (!this.quiet)
            console.log(`deleting ${name}`);

        // set alert to innactive 
        if (alerts[name] !== undefined)
            alerts[name].active = false;
        else
            this.utils.log(`'${name}' not found`);

        // delete entry
        delete alerts[name];

        // create new interval
        // this.resetPolling();

        // save alerts to file        
        this.saveAlerts();

        return(alerts[name] === undefined);

    }

    // check alert by name
    async checkAlert(_name: string) {

        const name = _name.toUpperCase();

        // get the alert 
        const alert:AlertData = alerts[name];

        // ignore inactive alerts
        if (alert === undefined || !alert.active)
            return;

        // get the token price
        const tokenPrice = await this.utils.getTokenPrice(alert.token);

        // send alert flag
        let sendAlert = false;

        // what kind of alert is set
        if (alert.type === AlertType.CrossOver) {
            sendAlert = (parseFloat(tokenPrice) > alert.target)
        } else {
            sendAlert = (parseFloat(tokenPrice) < alert.target)
        }
        
        // trigger callback if target is achieved 
        if (sendAlert) {

            // close the alert
            await this.deleteAlert(alert.name);

            // send alert
            // if a node process was killed the callback no
            // longer works!
            if (!alert.orphaned)
                alert.callback(parseFloat(tokenPrice));
            else
                this.utils.log(`${name} @ ${parseFloat(tokenPrice)} (target: ${alert.target})`, true);

        }

        // print if not quiet
        if (!this.quiet)
            console.log(`${alert.name}: \$${tokenPrice} (${alert.target})`);


    }

    // check all trades
    checkAlerts() {
        for (const alert in alerts) {
            if (alert !== undefined)
                this.checkAlert(alert);
        }
    }

}
    