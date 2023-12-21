import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

const deployChallanges = async (deployer) => {
  const Challanges = await ethers.getContractFactory("Challanges", deployer);
  const instance = await Challanges.deploy();

  return instance;
}

describe("ReceiptsNFT", function() {
  describe("initialize()", () => {
    it('deploys new contract', async () => {
      const [minter] = await ethers.getSigners();
      const challanges = await deployChallanges(minter);
    });
  })

  describe("addFundsToWallet()", () => {
    it('adds funds to caller wallet', async () => {
      const [minter, joe] = await ethers.getSigners();
      const challanges = await deployChallanges(minter);
      const deposit = 10000;

      await challanges.connect(joe).addFundsToWallet({value: deposit});
      const balance = await challanges.getFundsByWallet(joe.address);
      expect(balance).to.equal(deposit);
    })
  });

  describe("transferFundsFromWallet()", () => {
    it('transfers funds from caller wallet to another wallet', async () => {
      const [minter, joe, jane] = await ethers.getSigners();
      const challanges = await deployChallanges(minter);
      const deposit = 10000;

      await challanges.connect(joe).addFundsToWallet({value: deposit});
      const prevJaneWalletBalance = await ethers.provider.getBalance(jane.address);
      await challanges.connect(joe).transferFundsFromWallet(jane.address, deposit);
      const currentJaneWalletBalance = await ethers.provider.getBalance(jane.address);
      const janeBalance = await challanges.getFundsByWallet(jane.address);
      const joeBalance = await challanges.getFundsByWallet(joe.address);
      expect(janeBalance).to.equal(0);
      expect(joeBalance).to.equal(0);
      expect(currentJaneWalletBalance).to.gt(prevJaneWalletBalance);
    });

    it("reverts when insufficient funds", async () => {
      const [minter, joe, jane] = await ethers.getSigners();
      const challanges = await deployChallanges(minter);
      const deposit = 10000;

      await challanges.connect(joe).addFundsToWallet({value: deposit});
      await expect(challanges.connect(joe).transferFundsFromWallet(jane.address, deposit + 1)).to.be.revertedWith("Not enough funds");
    });
  })

  describe("createChallange()", () => {
    it('creates a challange with entry fee provided', async () => {
      const [minter] = await ethers.getSigners();
      const challanges = await deployChallanges(minter);

      const block = await ethers.provider.getBlock('latest');
      const currentTime = block.timestamp;

      await challanges.createChallange(
        "test", 
        1000, 
        currentTime,
        currentTime + 10000000,
        [],
        {
          value: 1000
        }
      );

      const challange = await challanges.getChallange(0);
      expect(challange[0]).to.equal("test");
    });

    it('creates a challange with fee from inner wallet', async () => {
      const [minter] = await ethers.getSigners();
      const challanges = await deployChallanges(minter);

      const block = await ethers.provider.getBlock('latest');
      const currentTime = block.timestamp;
      await challanges.connect(minter).addFundsToWallet({value: 1000});
      await challanges.createChallange(
        "test", 
        1000, 
        currentTime,
        currentTime + 10000000,
        [],
      );

      const challange = await challanges.getChallange(0);
      expect(challange[0]).to.equal("test");
    });    

    it("reverts when no entry fee is provided", async () => {
      const [minter] = await ethers.getSigners();
      const challanges = await deployChallanges(minter);

      const block = await ethers.provider.getBlock('latest');
      const currentTime = block.timestamp;

      await expect(challanges.createChallange(
        "test", 
        0, 
        currentTime,
        currentTime + 10000000,
        [],
        {
          value: 0
        }
      )).to.be.revertedWith("Entry fee must be greater than 0");
    });
  });

  describe("joinChallange()", () => {
    it('joins a open challange', async () => {
      const [minter, joe, jane] = await ethers.getSigners();
      const challanges = await deployChallanges(minter);

      const block = await ethers.provider.getBlock('latest');
      const currentTime = block.timestamp;
      await challanges.connect(minter).addFundsToWallet({value: 1000});
      await challanges.connect(minter).createChallange(
        "test", 
        1000, 
        currentTime + 10000,
        currentTime + 100000000000,
        [],
      );

      await challanges.connect(joe).addFundsToWallet({value: 1000});
      await challanges.connect(joe).joinChallange(0);
      const challange = await challanges.getChallange(0);
      expect(challange[8][0]).to.equal(joe.address);
      expect(challange[3]).to.equal(2000);
    });

    it("reverts when no entry fee is provided in open challange", async () => {
      const [minter, joe] = await ethers.getSigners();
      const challanges = await deployChallanges(minter);

      const block = await ethers.provider.getBlock('latest');
      const currentTime = block.timestamp;
      await challanges.connect(minter).addFundsToWallet({value: 1000});
      await challanges.createChallange(
        "test", 
        1000, 
        currentTime + 10000,
        currentTime + 10000000,
        [],
      );

      await expect(challanges.connect(joe).joinChallange(0)).to.be.revertedWith("Insufficient funds for entry fee");
    });

    it("allows to join whitelisted people", async () => {
      const [minter, joe] = await ethers.getSigners();
      const challanges = await deployChallanges(minter);

      const block = await ethers.provider.getBlock('latest');
      const currentTime = block.timestamp;
      await challanges.connect(minter).addFundsToWallet({value: 1000});
      await challanges.connect(minter).createChallange(
        "test", 
        1000, 
        currentTime + 10000,
        currentTime + 100000000000,
        [joe.address],
      );

      await challanges.connect(joe).addFundsToWallet({value: 1000});
      await challanges.connect(joe).joinChallange(0);
      const challange = await challanges.getChallange(0);
      expect(challange[8][0]).to.equal(joe.address);
      expect(challange[3]).to.equal(2000);
    });

    it("reverts when not whitelisted", async () => {
      const [minter, joe, jane] = await ethers.getSigners();
      const challanges = await deployChallanges(minter);

      const block = await ethers.provider.getBlock('latest');
      const currentTime = block.timestamp;
      await challanges.connect(minter).addFundsToWallet({value: 1000});
      await challanges.connect(minter).createChallange(
        "test", 
        1000, 
        currentTime + 10000,
        currentTime + 100000000000,
        [joe.address],
      );

      await challanges.connect(jane).addFundsToWallet({value: 1000});
      await expect(challanges.connect(jane).joinChallange(0)).to.be.revertedWith("Not whitelisted");
    });
  });

  describe("settleChallange()", () => {
    it('settles a challange for one winner', async () => {
      const [minter, joe, jane] = await ethers.getSigners();
      const challanges = await deployChallanges(minter);

      const block = await ethers.provider.getBlock('latest');
      const currentTime = block.timestamp;
      await challanges.connect(minter).addFundsToWallet({value: 1000});
      await challanges.connect(minter).createChallange(
        "test", 
        1000, 
        currentTime + 10000,
        currentTime + 100000000000,
        [],
      );
      const prevJoeBalance = await challanges.getFundsByWallet(joe.address);
      await challanges.connect(joe).addFundsToWallet({value: 1000});
      await challanges.connect(joe).joinChallange(0);
      await challanges.connect(jane).addFundsToWallet({value: 1000});
      await challanges.connect(jane).joinChallange(0);
      await ethers.provider.send("evm_mine", [currentTime + 200000000000]);
      await challanges.connect(minter).settleChallange(0, [joe.address]);
      const challange = await challanges.getChallange(0);
      expect(challange[9][0]).to.equal(joe.address);
      const currentJoeBalance = await challanges.getFundsByWallet(joe.address);

      expect(currentJoeBalance).to.gt(prevJoeBalance);
    })
  });
});