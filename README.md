# Uniswap Functions

This project serves as a person "command center" for performing various actions across the DeFi space. With Truffle & Typescript I can communicate with smart contracts on the Ethereum network. As of 12/09/20, through the use of this project I am able to:
  - Setup price alerts for any ERC20 pair traded on Uniswap.
    - As of the price alerts alert me in a personal Discord server but I have plans on making the alert types more flexible (Telegram, Twitter, etc)
  - Execute swaps through Uniswap.
    - ETH -> Token
    - Token -> ETH
  - Using the price alerts functionality I can create trade setups similar to what's offered on centralized exchanges (stoplosses and limit orders)
  
  
Moving forward, I plan on adding more support for different DeFi protocols, specifically:
  - AAVE flashloan support
  - Uniswap flashswap support
  - Opening leveraged positions with Compound Finance
