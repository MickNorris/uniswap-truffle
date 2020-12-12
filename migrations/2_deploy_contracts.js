const Swap = artifacts.require('Swap.sol');
const Leverage = artifacts.require('Leverage.sol');

// set timeout
Leverage.synchronization_timeout = 60 * 50;
Swap.synchronization_timeout = 60 * 5;


module.exports = async function(deployer, _, accounts) {
    await deployer.deploy(Swap,"0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");
    await deployer.deploy(Leverage,
        '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b', //comptroller
        '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643', //cDai
        '0x6b175474e89094c44da98b954eedeac495271d0f'  //dai)
        ); 
}