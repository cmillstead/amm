//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract AMM is ReentrancyGuard {
    using SafeMath for uint256;

    Token public token1;
    Token public token2;

    uint256 public token1Balance;
    uint256 public token2Balance;
    uint256 public K; // the Invariant
    uint256 constant PRECISION = 10**18; // 1e18
    uint256 constant ROUNDING = 10**3; // rounding to 3 decimal places

    event Swap(
        address user,
        address tokenGive,
        uint256 tokenGiveAmount,
        address tokenGet,
        uint256 tokenGetAmount,
        uint256 token1Balance,
        uint256 token2Balance,
        uint256 timestamp
    );

    uint256 public totalShares;
    mapping(address => uint256) public shares;

    constructor(Token _token1, Token _token2) {
        token1 = _token1;
        token2 = _token2;
    }


    function addLiquidity(uint256 _token1Amount, uint256 _token2Amount)
        external
        nonReentrant
    {
        //deposit tokens
        require(
            token1.transferFrom(msg.sender, address(this), _token1Amount),
            "failed to transfer token 1"
        );
        require(
            token2.transferFrom(msg.sender, address(this), _token2Amount),
            "failed to transfer token 2"
        );

        // issue shares
        uint256 share;

        // if first time adding, make share 100
        if (totalShares == 0) {
            share = SafeMath.mul(100, PRECISION);
        } else {
            uint256 share1 = SafeMath.div(SafeMath.mul(totalShares, _token1Amount), token1Balance);
            uint256 share2 = SafeMath.div(SafeMath.mul(totalShares, _token2Amount), token2Balance);
            require(
                SafeMath.div(share1, ROUNDING) == SafeMath.div(share2, ROUNDING),
                "must provide equal token amounts"
            );
            share = share1;
        }

        // manage pool
        token1Balance = token1Balance.add(_token1Amount);
        token2Balance = token2Balance.add(_token2Amount);
        K = SafeMath.mul(token1Balance, token2Balance);

        // update shares
        totalShares = totalShares.add(share);
        shares[msg.sender] = shares[msg.sender].add(share);
    }


    // determine how many token2 token must be deposited when depositing liquiditiy for token1
    function calculateToken2Deposit(uint256 _token1Amount)
         public
         view
         returns (uint256 token2Amount)
    {
        token2Amount =  SafeMath.div(SafeMath.mul(token2Balance, _token1Amount), token1Balance);
    }


    // determine how many token1 token must be deposited when depositing liquiditiy for token2
    function calculateToken1Deposit(uint256 _token2Amount)
         public
         view
         returns (uint256 token1Amount)
    {
        token1Amount = SafeMath.div(SafeMath.mul(token1Balance, _token2Amount), token2Balance);
    }


    // returns amount of token2 received when swapping token1
    function calculateToken1Swap(uint256 _token1Amount)
         public
         view
         returns (uint256 token2Amount)
    {
        uint256 token1After = token1Balance.add(_token1Amount);
        uint256 token2After = SafeMath.div(K, token1After);
        token2Amount = SafeMath.sub(token2Balance, token2After);

        // don't let pool go to zero
        if (token2Amount == token2Balance) {
            token2Amount = token2Amount.sub(1);
        }

        require(
            token2Amount < token2Balance,
            "swap cannot exceed pool balance"
        );
    }


    // returns amount of token1 received when swapping token2
    function calculateToken2Swap(uint256 _token2Amount)
         public
         view
         returns (uint256 token1Amount)
    {
        uint256 token2After = token2Balance.add(_token2Amount);
        uint256 token1After = SafeMath.div(K, token2After);
        token1Amount = SafeMath.sub(token1Balance, token1After);

        // don't let pool go to zero
        if (token1Amount == token1Balance) {
            token1Amount = token1Amount.sub(1);
        }

        require(
            token1Amount < token1Balance,
            "swap cannot exceed pool balance"
        );
    }


    function swapToken1(uint256 _token1Amount)
        external
        nonReentrant
        returns (uint256 token2Amount)
    {
        // calculate token2 amount
        token2Amount = calculateToken1Swap(_token1Amount);

        // do swap
        // 1. transfer token1 tokens out of user wallet to the contract
        token1.transferFrom(msg.sender, address(this), _token1Amount);
        // 2. transfer token2 tokens from the contract into user wallet
        token2.transfer(msg.sender, token2Amount);
        // 3. update the token1 & token2 balances in the contract
        token1Balance = token1Balance.add(_token1Amount);
        token2Balance = token2Balance.sub(token2Amount);

        emit Swap(
            msg.sender,
            address(token1),
            _token1Amount,
            address(token2),
            token2Amount,
            token1Balance,
            token2Balance,
            block.timestamp
        );
    }


    function swapToken2(uint256 _token2Amount)
        external
        nonReentrant
        returns (uint256 token1Amount)
    {
        // calculate token1 amount
        token1Amount = calculateToken2Swap(_token2Amount);

        // do swap
        // 1. transfer token2 tokens out of user wallet to the contract
        token2.transferFrom(msg.sender, address(this), _token2Amount);
        // 2. transfer token1 tokens from the contract into user wallet
        token1.transfer(msg.sender, token1Amount);
        // 3. update the token1 & token2 balance in the contract
        token2Balance = token2Balance.add(_token2Amount);
        token1Balance = token1Balance.sub(token1Amount);

        emit Swap(
            msg.sender,
            address(token2),
            _token2Amount,
            address(token1),
            token1Amount,
            token2Balance,
            token1Balance,
            block.timestamp
        );
    }


    // determine how many tokens will be withdrawn
    function calculateWithdrawAmount(uint256 _share)
        public
        view
        returns (uint256 token1Amount, uint256 token2Amount)
    {
        require(
            _share <= totalShares,
            "must be less than total shares"
        );
        token1Amount = SafeMath.div(SafeMath.mul(token1Balance, _share), totalShares);
        token2Amount = SafeMath.div(SafeMath.mul(token2Balance, _share), totalShares);
    }


    function removeLiquidity(uint256 _share)
        external
        returns (uint256 token1Amount, uint256 token2Amount)
    {
        require(
            _share <= shares[msg.sender],
            "cannot withdraw more than you have"
        );
        (token1Amount, token2Amount) = calculateWithdrawAmount(_share);

        token1.transfer(msg.sender, token1Amount);
        token2.transfer(msg.sender, token2Amount);

        token1Balance = token1Balance.sub(token1Amount);
        token2Balance = token2Balance.sub(token2Amount);
        K = SafeMath.mul(token1Balance, token2Balance);

        shares[msg.sender] = shares[msg.sender].sub(_share);
        totalShares = totalShares.sub(_share);
    }
}
