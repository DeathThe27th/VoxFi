// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal owner-controlled account with one tightly scoped, revocable session key.
contract VoxSessionAccount {
    address public immutable owner;
    address public sessionKey;
    address public allowedTarget;
    bytes4 public allowedSelector;
    uint48 public expiresAt;
    uint96 public maxValuePerCall;
    uint96 public totalValueLimit;
    uint96 public totalValueUsed;
    uint256 public nonce;
    bool public revoked = true;

    event SessionConfigured(address indexed key, address indexed target, bytes4 selector, uint48 expiry, uint96 perCall, uint96 total);
    event SessionRevoked(address indexed key);
    event Executed(address indexed target, uint256 value, bytes4 selector, uint256 nonce);

    error Unauthorized(); error InvalidPolicy(); error SessionInactive(); error PolicyViolation(); error CallFailed(bytes reason);

    constructor(address owner_) { if (owner_ == address(0)) revert InvalidPolicy(); owner = owner_; }
    modifier onlyOwner() { if (msg.sender != owner) revert Unauthorized(); _; }

    function configureSession(address key, address target, bytes4 selector, uint48 expiry, uint96 perCall, uint96 total) external onlyOwner {
        if (key == address(0) || target == address(0) || expiry <= block.timestamp || perCall > total) revert InvalidPolicy();
        sessionKey = key; allowedTarget = target; allowedSelector = selector; expiresAt = expiry;
        maxValuePerCall = perCall; totalValueLimit = total; totalValueUsed = 0; revoked = false;
        emit SessionConfigured(key, target, selector, expiry, perCall, total);
    }

    function revokeSession() external onlyOwner { revoked = true; emit SessionRevoked(sessionKey); }

    function executeOwner(address target, uint256 value, bytes calldata data) external onlyOwner returns (bytes memory) {
        return _call(target, value, data);
    }

    function executeSession(address target, uint256 value, bytes calldata data, uint8 v, bytes32 r, bytes32 s) external returns (bytes memory) {
        if (revoked || block.timestamp > expiresAt) revert SessionInactive();
        bytes4 selector = data.length >= 4 ? bytes4(data[:4]) : bytes4(0);
        if (target != allowedTarget || selector != allowedSelector || value > maxValuePerCall || totalValueUsed + value > totalValueLimit) revert PolicyViolation();
        bytes32 payload = keccak256(abi.encode(block.chainid, address(this), target, value, keccak256(data), nonce));
        bytes32 signed = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", payload));
        if (ecrecover(signed, v, r, s) != sessionKey) revert Unauthorized();
        nonce++; totalValueUsed += uint96(value);
        emit Executed(target, value, selector, nonce - 1);
        return _call(target, value, data);
    }

    function _call(address target, uint256 value, bytes calldata data) private returns (bytes memory result) {
        (bool ok, bytes memory response) = target.call{value:value}(data);
        if (!ok) revert CallFailed(response);
        return response;
    }

    receive() external payable {}
}
