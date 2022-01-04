// scripts/deploy.js
async function main () {
    // We get the contract to deploy
    const Token = await ethers.getContractFactory('CreativeFriendzClub1');
    console.log('Deploying NFT...');
    const token = await Token.deploy("https://google.com/missing.json", [], []);
    await token.deployed();
    console.log('NFT deployed to:', token.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });