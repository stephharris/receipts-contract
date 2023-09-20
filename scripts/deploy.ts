import { ethers, upgrades } from "hardhat";

async function main() {
  const ReceiptsNFT = await ethers.getContractFactory("ReceiptsNFT");
  const instance = await upgrades.deployProxy(ReceiptsNFT, ["Name", "Symbol"]);
  await instance.waitForDeployment();

  console.log("ReceiptsNFT deployed to:", await instance.getAddress())
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
