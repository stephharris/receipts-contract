import { ethers, upgrades } from "hardhat";

async function main() {
  const Challanges = await ethers.getContractFactory("Challanges");
  const instance = await Challanges.deploy();

  console.log("Challanges deployed to:", await instance.getAddress())
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
