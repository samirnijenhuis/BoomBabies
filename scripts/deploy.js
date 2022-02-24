// scripts/deploy.js
async function main () {
    // We get the contract to deploy
    const Token = await ethers.getContractFactory('CreativeFriendzClub2');
    console.log('Deploying NFT...');
    const token = await Token.deploy("https://empty-url.com/", [
        '0x24e51Dd5bA52E50713cc121cC5F17C0B097A3423', // brian
        '0xf86e8671cc14f5c38f1344fa00aa4729c1a7fb6f', // pedro
        '0xf410450167fE9D00B084bb9DaB4112cF2A188972', // Owner
        '0x656B15205BC23c880D86c9A2Ff9143Da67ae6CAC', // Samir Metamask Test acc
    ], [
        '0xf410450167fE9D00B084bb9DaB4112cF2A188972' // Owner
    ]);
    await token.deployed();
    console.log('NFT deployed to:', token.address);
  }

  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
