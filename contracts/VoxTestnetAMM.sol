// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IVoxToken { function transfer(address,uint256) external returns(bool); function transferFrom(address,address,uint256) external returns(bool); function balanceOf(address) external view returns(uint256); }

/// @notice Hackathon-only constant-product AMM for real, explicitly labelled testnet execution.
contract VoxTestnetAMM {
    address public immutable token0; address public immutable token1;
    constructor(address a,address b){require(a!=b&&a!=address(0)&&b!=address(0));token0=a;token1=b;}
    function reserves() public view returns(uint256,uint256){return(IVoxToken(token0).balanceOf(address(this)),IVoxToken(token1).balanceOf(address(this)));}
    function quote(address tokenIn,uint256 amountIn) public view returns(uint256 amountOut){
        (uint256 r0,uint256 r1)=reserves(); require(amountIn>0&&r0>0&&r1>0,"no liquidity");
        (uint256 rin,uint256 rout)=tokenIn==token0?(r0,r1):tokenIn==token1?(r1,r0):(uint256(0),uint256(0)); require(rin>0,"token");
        uint256 withFee=amountIn*997; amountOut=(withFee*rout)/(rin*1000+withFee);
    }
    function swapExact(address tokenIn,uint256 amountIn,uint256 minOut,address recipient) external returns(uint256 amountOut){
        amountOut=quote(tokenIn,amountIn); require(amountOut>=minOut,"slippage"); address out=tokenIn==token0?token1:token0;
        require(IVoxToken(tokenIn).transferFrom(msg.sender,address(this),amountIn),"in"); require(IVoxToken(out).transfer(recipient,amountOut),"out");
    }
}
