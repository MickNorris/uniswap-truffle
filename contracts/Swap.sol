pragma solidity >=0.4.25 <0.7.0;

// import '@uniswap/v2-core/contracts/UniswapV2Factory.sol';
import './IERC20.sol';

interface IUniswap {

    function swapExactTokensForETH(
    uint amountIn,
    uint amountOutMin,
    address[] calldata path,
    address to,
    uint deadline)
    external
    returns (uint[] memory amounts);

    function swapExactETHForTokens(
    uint amountOutMin,
    address[] calldata path,
    address to,
    uint deadline)
    external
    payable
    returns (uint[] memory amounts);

    function WETH() external pure returns (address);

}

contract Swap {

    IUniswap uniswap;

    // setup uniswap exchange address when a
    // new contract is created
    constructor(address _uniswap) public {
        uniswap = IUniswap(_uniswap);

    }

    // swap ETH -> Tokens
    function swapExactETHForTokens(
    address _token,
    uint _amountOutMin,
    uint _deadline)
    external
    payable {

        // IERC20(token).transferFrom(msg.sender, address(this), amountOutMin);
        IERC20 token = IERC20(_token);

        // create exchange path
        address[] memory path = new address[](2);
        path[0] = uniswap.WETH();
        path[1] = address(token);

        // execute swap
        uniswap.swapExactETHForTokens.value(msg.value)(
            _amountOutMin,
            path,
            msg.sender,
            _deadline
        );

    }

    // swap Tokens -> ETH
    function swapExactTokensForETH(
    address _token,
    uint _amountIn,
    uint _amountOutMin,
    uint _deadline)
    external
    {

        IERC20 token = IERC20(_token);

        // approval is called outside of contract
        // require(token.approve(address(this), _amountIn), "contract approve() failed");

        // transfer tokens to smart contract
        require(token.transferFrom(msg.sender, address(this), _amountIn), 'transferFrom failed.');

        // construct path
        address[] memory path = new address[](2);
        path[0] = address(token);
        path[1] = uniswap.WETH();

        // approve tokens
        require(token.approve(address(uniswap), _amountIn), "uniswap approve() failed");

        // execute swap through uniswap
        uniswap.swapExactTokensForETH(
            _amountIn,
            _amountOutMin,
            path,
            msg.sender,
            _deadline
        );

    }

}