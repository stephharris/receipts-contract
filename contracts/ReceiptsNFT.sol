// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import { ERC721Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract ReceiptsNFT is ERC721Upgradeable, OwnableUpgradeable {
  uint256 public lastTokenId;
  uint256 public mintPrice;
  address public treasuryAddr;
  mapping(uint256 => string) public customTokenUri;

  function initialize(string memory _name, string memory _symbol) external initializer {
    __ERC721_init(_name, _symbol);
    __Ownable_init_unchained();
    lastTokenId = 1;
  }

  function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
      internal
      override(ERC721Upgradeable)
  {
      if(to != address(0)) {
        require(from == address(0), "Token not transferable");
      } 
      super._beforeTokenTransfer(from, to, tokenId, batchSize);
  }

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    _requireMinted(tokenId);

    if(bytes(customTokenUri[tokenId]).length != 0) {
      return customTokenUri[tokenId];
    } else {
      super.tokenURI(tokenId);
    }
  }

  function mint(address to, string calldata uri) external payable {
    require(msg.value == mintPrice, "Not enough funds sent"); 
    (bool success, ) = treasuryAddr.call{value: mintPrice}("");
    require(success, "Mint price transfer failed");

    _mint(to, lastTokenId);
    customTokenUri[lastTokenId] = uri;
    lastTokenId += 1;
  }

  function burn(uint256 tokenId) external {
    _requireMinted(tokenId);
    require(super._isApprovedOrOwner(_msgSender(), tokenId), "not approved");
    _burn(tokenId);
  }

  function setPrice(uint256 newPrice, address treasury) external onlyOwner {
    mintPrice = newPrice;
    treasuryAddr = treasury;
  }
}