import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

const deployNft = async (deployer) => {
  const ReceiptsNFT = await ethers.getContractFactory("ReceiptsNFT", deployer);
  const instance = await upgrades.deployProxy(ReceiptsNFT, ["Name", "Symbol"]);

  return instance;
}

describe("ReceiptsNFT", function() {
  describe("initialize()", () => {
    it('deploys a proxy contract', async () => {
      const [minter] = await ethers.getSigners();
      const nft = await deployNft(minter);
      const name = await nft.name();
      const symbol = await nft.symbol();
  
      expect(name.toString()).to.equal('Name');
      expect(symbol.toString()).to.equal('Symbol');
    });
  })

  describe("tokenURI()", () => {
    it("allows to get custom uri", async () => {
      const [minter] = await ethers.getSigners();
      const nft = await deployNft(minter);
      await nft.connect(minter).mint(minter.address, "ipfs://something/12");
      const uri = await nft.tokenURI(1); 
      expect(uri).to.eq("ipfs://something/12")
    })
  })

  describe("setPrice()", () => {
    it("allows to set price for owner", async () => {
      const [minter, treasury] = await ethers.getSigners();
      const nft = await deployNft(minter);
      await nft.connect(minter).setPrice(10000, treasury.address);
    })

    it("reverts when hacker calling", async () => {
      const [minter, hacker] = await ethers.getSigners();
      const nft = await deployNft(minter);
      await expect(
        nft.connect(hacker).setPrice(10000, hacker.address)
      ).to.be.revertedWith("Ownable: caller is not the owner"); 
    })
  })

  describe("mint()", () => {
    it("mints new token for free", async () => {
      const [deployer, minter] = await ethers.getSigners();
      const nft = await deployNft(deployer);
      await nft.connect(minter).mint(minter.address, "ipfs://something/12");
      const ownerOf = await nft.ownerOf(1); 
      expect(ownerOf).to.eq(minter.address);
      const uri = await nft.tokenURI(1); 
      expect(uri).to.eq("ipfs://something/12");
    })

    it("mints new token for when price is set", async () => {
      const [minter, treasury] = await ethers.getSigners();
      const nft = await deployNft(minter);
      await nft.connect(minter).setPrice(10000, treasury.address);
      const balanceBefore = await ethers.provider.getBalance(treasury.address)
      await nft.connect(minter).mint(minter.address, "ipfs://something/12", { value: 10000 })
      const balanceNow = await ethers.provider.getBalance(treasury.address);

      expect(balanceBefore + BigInt(10000)).to.eq(balanceNow);
    })   

    it("reverts when no funds sent", async () => {
      const [minter, treasury] = await ethers.getSigners();
      const nft = await deployNft(minter);
      await nft.connect(minter).setPrice(10000, treasury.address);
      await expect(
        nft.connect(minter).mint(minter.address, "ipfs://something/12")
      ).to.be.revertedWith("Not enough funds sent"); 
    })       
  })

  describe("safeTransferFrom()", () => {
    it("reverts", async () => {
      const tokenId = 1;
      const [minter, buyer] = await ethers.getSigners();
      const nft = await deployNft(minter);
      await nft.connect(minter).mint(minter.address, "ipfs://something");
      await expect(
        nft.connect(minter).safeTransferFrom(minter.address, buyer.address, tokenId)
      ).to.be.revertedWith("Token not transferable"); 
    })  
  })  
  
  describe("transferFrom()", () => {
    it("reverts", async () => {
      const tokenId = 1;
      const [minter, buyer] = await ethers.getSigners();
      const nft = await deployNft(minter);
      await nft.connect(minter).mint(minter.address, "ipfs://something");
      await expect(
        nft.connect(minter).transferFrom(minter.address, buyer.address, tokenId)
      ).to.be.revertedWith("Token not transferable"); 
    })  
  })  

  describe("burn()", () => {
    it("allows owner to burn", async () => {
      const tokenId = 1;
      const [minter] = await ethers.getSigners();
      const nft = await deployNft(minter);
      await nft.connect(minter).mint(minter.address, "ipfs://something");
      let balance = await nft.balanceOf(minter.address)
      expect(balance).to.eq(1)
      await nft.connect(minter).burn(tokenId)
      balance = await nft.balanceOf(minter.address)
      expect(balance).to.eq(0)
    })

    it("reverts when not owner burns", async () => {
      const tokenId = 1;
      const [minter, hacker] = await ethers.getSigners();
      const nft = await deployNft(minter);
      await nft.connect(minter).mint(minter.address, "ipfs://something");
      await expect(
        nft.connect(hacker).burn(tokenId)
      ).to.be.revertedWith("not approved"); 
    })    

    it("reverts when token not exists", async () => {
      const tokenId = 1;
      const [minter] = await ethers.getSigners();
      const nft = await deployNft(minter);
      await expect(
        nft.connect(minter).burn(tokenId)
      ).to.be.revertedWith("ERC721: invalid token ID"); 
    })
  })
});