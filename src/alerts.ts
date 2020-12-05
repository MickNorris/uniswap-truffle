import { ChainId, Fetcher, Token, Route, WETH, Trade, TokenAmount, TradeType, Percent, Pair } from "@uniswap/sdk";

enum AlertType {
    CrossOver,
    CrossUnder
}

interface AlertData{
    // entry: number,
    // target: number,
    // stop: number,
    name: string,
    token: Token,
    target: number,
    type: AlertType,
    callback: void
    active: boolean
}

export default class Alerts{

    // class vars
    alerts: {}
    WETH: Token
    USDC: Token

    // constructor for new trade
    constructor() {

        this.WETH = WETH[ChainId.MAINNET];

        this.USDC = new Token(ChainId.MAINNET, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 6);

        // create blank alerts object
        this.alerts = {};

        // start polling prices
        setInterval(() => {
            this.checkAlerts();
        }, 3000);

    }

    // get the price of a token in usdc
    async getTokenPrice(token: Token) {
    
        // get pair data
        const pairUSD = await Fetcher.fetchPairData(this.WETH, this.USDC);
        const pair = await Fetcher.fetchPairData(token, this.WETH);

        // get route
        const route = new Route([pair, pairUSD], token);

        // get trade for execution price
        const trade = new Trade(route, new TokenAmount(token, `1${"".padEnd(token.decimals, '0')}`), TradeType.EXACT_INPUT);

        // get TOKEN/ETH price 
        const price = trade.executionPrice.toSignificant(6);

        return price;

    }

    // create a new trade
    newAlert(name: string, token: Token, target: number, type: AlertType, callback) {

        // setup new trade object
        let alert:AlertData = {
           name: name.toUpperCase(),
           token,
           target,
           type,
           callback,
           active: true 
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
    closeAlert(name: string) {
        delete this.alerts[name];
    }

    // check alert by name
    async checkAlert(name: string) {

        // get the alert 
        const alert = this.alerts[name];

        // get the token price
        const tokenPrice = await this.getTokenPrice(alert.token);

        // send alert flag
        let sendAlert = false;

        // what kind of alert is set
        if (alert.type === AlertType.CrossOver) {
            sendAlert = (parseFloat(tokenPrice) > parseFloat(alert.target))
        } else {
            sendAlert = (parseFloat(tokenPrice) < parseFloat(alert.target))
        }
        
        // trigger callback if target is achieved 
        if (sendAlert && alert.active)
            alert.callback();

        console.log(`${alert.name} : \$${tokenPrice}`);

    }

    // check all trades
    checkAlerts() {
        for (const alert in this.alerts) {
            this.checkAlert(alert);
        }
    }

}
    