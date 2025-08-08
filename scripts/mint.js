const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const Ticket = await hre.ethers.getContractFactory("EventTicket");

  const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const ticket = await Ticket.attach(contractAddress);

  const txn = await ticket.mintTicket("ipfs://your-token-uri", {
    value: hre.ethers.parseEther("0.01")
  });

  await txn.wait();
  console.log("✅ Ticket minted successfully!");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});