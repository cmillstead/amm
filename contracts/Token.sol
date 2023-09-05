//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Token is ReentrancyGuard {
    using SafeMath for uint256;

    string public name;
    string public symbol;
    uint256 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(
        address indexed from,
        address indexed to,
        uint256 value
    );

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply
    ) {
        name = _name;
        symbol = _symbol;
        totalSupply = SafeMath.mul(_totalSupply, (10**decimals));
        balanceOf[msg.sender] = totalSupply;
    }

    function transfer(address _to, uint256 _value)
        public
        nonReentrant
        returns (bool success)
    {
        require(
            balanceOf[msg.sender] >= _value,
            "cannot transfer more than balance"
        );

        _transfer(msg.sender, _to, _value);

        return true;
    }

    function _transfer(
        address _from,
        address _to,
        uint256 _value
    ) internal {
        require(
            _to != address(0),
            "cannot transfer to the zero address"
        );

        balanceOf[_from] = balanceOf[_from].sub(_value);
        balanceOf[_to] = balanceOf[_to].add(_value);

        emit Transfer(_from, _to, _value);
    }

    function approve(address _spender, uint256 _value)
        public
        nonReentrant
        returns(bool success)
    {
        require(
            _spender != address(0),
            "cannot approve the zero address"
        );

        allowance[msg.sender][_spender] = _value;

        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    )
        public
        nonReentrant
        returns (bool success)
    {
        require(
            _value <= balanceOf[_from],
            "cannot transfer more than balance"
        );
        require(
            _value <= allowance[_from][msg.sender],
            "cannot transfer more than allowance"
        );

        allowance[_from][msg.sender] = allowance[_from][msg.sender].sub(_value);

        _transfer(_from, _to, _value);

        return true;
    }

}
