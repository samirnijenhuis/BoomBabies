// test/CreativeFriendz-2.test.js
// Load dependencies
const { expect } = require('chai');
const { parseEther } = require('ethers/lib/utils');
const { ethers,  network, deployments, run} = require('hardhat');


// Start test block
describe('BoomBabies', function () {
  before(async function () {
    this.Token = await ethers.getContractFactory('GreenTeaTeas');
  });


  this.beforeEach(async function() {
    const signers = await ethers.getSigners();
    this.token = await this.Token.deploy(/*team:*/ [signers[10].address, signers[11].address],  /*whitelist:*/ [signers[1].address, signers[2].address]);
    await this.token.deployed();
  })

  //
  // it('respects max supply', async function () {
  //   const signers = await ethers.getSigners();
  //   this.token = await this.Token.deploy("ipfs://some-test-uri", [],   []);
  //
  //   await this.token.connect(signers[0]).togglePublicSale();
  //
  //   for(var i = 1; i < 1000; i++) {
  //     await this.token.connect(signers[i]).mint(1, {value: parseEther('0.5').toString()});
  //   }
  //
  //   await expect(
  //       this.token.connect(signers[1001]).mint(1, {value: parseEther('0.5').toString()})
  //   ).to.be.revertedWith("Quantity exceeds supply");
  // });


  it("has a mint price of .066 eth", async function() {
    expect(
      ethers.utils.formatEther( (await this.token.MINT_PRICE()).toString())
      ).to.equal('0.066');
  })



  it("only allows owner to change mint price", async function(){
    const signers = await ethers.getSigners();

    await expect(
        this.token.connect(signers[1]).setMintPrice(parseEther('0.6').toString())
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await this.token.connect(signers[0]).setMintPrice(parseEther('0.6').toString());
  });

  it("changes the mint price", async function(){
    const signers = await ethers.getSigners();

    expect((await this.token.MINT_PRICE()).toString()).to.equal(parseEther('0.066').toString());

    await this.token.connect(signers[0]).setMintPrice(parseEther('0.6'));

    expect((await this.token.MINT_PRICE()).toString()).to.equal(parseEther('0.6').toString());
  });


  it("only allows team to call emergencyWithdraw", async function(){
      const signers = await ethers.getSigners();

      await expect(
        this.token.connect(signers[9]).emergencyWithdraw()
      ).to.be.revertedWith("Withdraw must be initiated by a team member");

      await this.token.connect(signers[10]).emergencyWithdraw();
  })


  it("splits the funds from emergencyWithdraw equally between all team members", async function(){

    const signers = await ethers.getSigners();

    // Put some money in the contract
    await this.token.connect(signers[1]).mint(1, {value: parseEther('0.5').toString()});

    await expect(() => this.token.connect(signers[10]).emergencyWithdraw()).to.changeEtherBalances([signers[10], signers[11]], [parseEther('0.25').toString(), parseEther('0.25').toString()]);
  })



  it("doesnt allow URI on unminted token IDs ", async function(){
    await expect(
        this.token.tokenURI(2) // 0 and 1 are team mints.
    ).to.be.revertedWith("ERC721: token not found");
  });


  it("bases token URI on tokenID", async function(){
    const signers = await ethers.getSigners();

    await this.token.connect(signers[1]).mint(1, {value: parseEther('0.5').toString()});
    await this.token.connect(signers[2]).mint(1, {value: parseEther('0.5').toString()});
    await this.token.connect(signers[0]).toggleReveal();

    expect((await this.token.tokenURI(2)).toString()).to.contain('2');
    expect((await this.token.tokenURI(3)).toString()).to.contain('3');
  });


  it("bases revealed token URI on baseURI", async function(){
    const signers = await ethers.getSigners();

    await this.token.connect(signers[0]).setBaseURI('ipfs://some-test-uri/');
    await this.token.connect(signers[0]).toggleReveal();

    expect((await this.token.tokenURI(0)).toString()).to.contain('ipfs://some-test-uri/0.json');
  });


  it("bases not reaveled token URI on notRevealedURI", async function() {
    expect((await this.token.tokenURI(0)).toString()).to.contain('some-funny-string');
  })


  it("allows only the owner to reveal", async function() {
    const signers = await ethers.getSigners();

    await expect(
        this.token.connect(signers[1]).toggleReveal()
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await this.token.connect(signers[0]).toggleReveal();
  });

  it("allows only the owner to set the baseURI", async function(){
    const signers = await ethers.getSigners();

    await expect(
        this.token.connect(signers[1]).setBaseURI("ipfs://something")
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await this.token.connect(signers[0]).setBaseURI("ipfs://something");
  });


  it("pre-mints to the team", async function() {
    const signers = await ethers.getSigners();
    const nft = await this.Token.deploy([signers[0].address, signers[2].address, signers[3].address], []);
    await nft.deployed();

    expect((await nft.balanceOf(signers[0].address)).toString()).to.be.equal('1');
    expect((await nft.balanceOf(signers[1].address)).toString()).to.be.equal('0');
    expect((await nft.balanceOf(signers[2].address)).toString()).to.be.equal('1');
    expect((await nft.balanceOf(signers[3].address)).toString()).to.be.equal('1');
  });


  it("mints to the right owner", async function() {
    const signers = await ethers.getSigners();

    expect((await this.token.balanceOf(signers[1].address)).toString()).to.be.equal('0');

    await this.token.connect(signers[1]).mint(1, {value: parseEther('0.5').toString()});
    expect((await this.token.balanceOf(signers[1].address)).toString()).to.be.equal('1');
  });


  it("can only be minted for the mint price", async function() {
    const signers = await ethers.getSigners();
    await this.token.connect(signers[0]).togglePublicSale();

    await expect(
        this.token.connect(signers[3]).mint(1, {value: parseEther('0.065').toString()})
    ).to.be.revertedWith("Amount of ether sent does not match total mint amount");

    this.token.connect(signers[3]).mint(1, {value: parseEther('0.066').toString()})
  })


  it("only allows 5 tokens per mint", async function() {
    const signers = await ethers.getSigners();
    await this.token.connect(signers[0]).togglePublicSale();

    await expect(
        this.token.connect(signers[3]).mint(6, {value: parseEther('0.5').toString()})
    ).to.be.revertedWith("Quantity exceeds per-transaction limit");

    this.token.connect(signers[3]).mint(5, {value: parseEther('0.5').toString()})
  })


  //
  // it("requires a password to call emergencyWithdraw", async function() {
  //   const signers = await ethers.getSigners();
  //
  //   await expect(
  //       this.token.connect(signers[0]).emergencyWithdraw("secret")
  //   ).to.be.revertedWith("Incorrect password");
  //
  //   await this.token.connect(signers[0]).emergencyWithdraw("JHUhYKw.rJpP8a@jCfGw3poYwfkvqQsW6cR3bgu_6R6HDkgCZ@oBZ.9vEZ69dyzx!DkUFvas*aPYzNxxwuCx3a89cHu.fZvq8Y7M");
  // });



  it("sets whitelist on deploy", async function() {
    const signers = await ethers.getSigners();
    const nft = await this.Token.deploy([], [signers[1].address, signers[9].address]);
    await nft.deployed();

    expect((await nft.whitelist(signers[1].address)).toString()).to.be.equal('true');
    expect((await nft.whitelist(signers[2].address)).toString()).to.be.equal('false');
    expect((await nft.whitelist(signers[9].address)).toString()).to.be.equal('true');
  });


  it("doesnt allow null address on whitelist", async function() {
    const signers = await ethers.getSigners();

    await expect(
        this.Token.deploy([], ['0x0000000000000000000000000000000000000000', signers[9].address])
    ).to.be.revertedWith("Can't add a null address");

    await expect(
        this.token.addToWhitelist(['0x0000000000000000000000000000000000000000'])
    ).to.be.revertedWith("Can't add a null address");
  });


  it("only allows whitelisted people to mint", async function() {
    const signers = await ethers.getSigners();

    await expect(
        this.token.connect(signers[3]).mint(1, {value: parseEther('0.5').toString()})
    ).to.be.revertedWith("Not whitelisted and public mint not started");

    await this.token.connect(signers[2]).mint(1, {value: parseEther('0.5').toString()});
  });


  it("only allows the owner to add to the whitelist", async function() {
    const signers = await ethers.getSigners();

    await expect(
        this.token.connect(signers[1]).addToWhitelist([signers[9].address])
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await this.token.connect(signers[0]).addToWhitelist([signers[9].address]);
  })

  it("allows the non-whitelist to buy after sale opens", async function() {
    const signers = await ethers.getSigners();


    await expect(
        this.token.connect(signers[3]).mint(1, {value: parseEther('0.5').toString()})
    ).to.be.revertedWith("Not whitelisted and public mint not started");

    await this.token.connect(signers[0]).togglePublicSale();

    await this.token.connect(signers[3]).mint(1, {value: parseEther('0.5').toString()})

  })

  it("only allows owner to toggle the sale", async function() {
    const signers = await ethers.getSigners();

    await expect(
        this.token.connect(signers[1]).togglePublicSale()
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await this.token.connect(signers[0]).togglePublicSale();
  })

  it("sets team on init", async function () {
    const signers = await ethers.getSigners();
    const nft = await this.Token.deploy([signers[1].address, signers[9].address], []);
    await nft.deployed();

    expect((await nft.team(0)).toString()).to.be.equal(signers[1].address);
    expect((await nft.team(1)).toString()).to.be.equal(signers[9].address);
  })

  it("shows totalSupply", async function () {
    expect(
        (await this.token.totalSupply()).toString()
    ).to.equal('2');
  })

  it("only allows owner can airdrop", async function () {
    const signers = await ethers.getSigners();

    await expect(
        this.token.connect(signers[1]).airdrop([signers[2].address])
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await this.token.connect(signers[0]).airdrop([signers[2].address]);
  })


  it("airdrop cannot exceed max supply", async function () {
    // hard to do
  })


  it("airdrop transfers to list", async function () {
    const signers = await ethers.getSigners();

    expect((await this.token.balanceOf(signers[4].address)).toString()).to.be.equal('0');
    await this.token.connect(signers[0]).airdrop([signers[4].address]);
    expect((await this.token.balanceOf(signers[4].address)).toString()).to.be.equal('1');
  })




  it("releases after full mint", async function () {
    const signers = await ethers.getSigners();
    const nft = await this.Token.deploy([signers[2].address], []);
    await nft.deployed();

    var addresses = [];
    for(let i = 0; i < 14; i++) {
      addresses.push(signers[3].address);
    }

    await nft.connect(signers[0]).togglePublicSale();
    await nft.connect(signers[5]).mint(5, {value: parseEther('0.5').toString()});

    await expect( nft.connect(signers[0]).airdrop(addresses))
        .to.emit(nft, 'MintComplete')

  })

  it("transfers 40% to the team", async function() {
    const signers = await ethers.getSigners();
    const nft = await this.Token.deploy([signers[2].address, signers[9].address], []);
    await nft.deployed();

    var addresses = [];
    for(let i = 0; i < 13; i++) {
      addresses.push(signers[3].address);
    }

    await nft.connect(signers[0]).togglePublicSale();
    await nft.connect(signers[5]).mint(5, {value: parseEther('0.5').toString()});


    // 0.5E * 0.4 / 2

    await expect(() => nft.connect(signers[0]).airdrop(addresses)).to.changeEtherBalances([signers[2], signers[9]], [parseEther('0.1').toString(), parseEther('0.1').toString()]);

  })

  it("transfers 30% to charity", async function() {
    // TODO: Problem is that we for some reason cant see transfers, even though it is a transparent blockchain.


    // const signers = await ethers.getSigners();
    // const nft = await this.Token.deploy("ipfs://some-test-uri", [signers[2].address], []);
    // await nft.deployed();
    //
    // var addresses = [];
    // for(let i = 0; i < 14; i++) {
    //   addresses.push(signers[3].address);
    // }
    // await nft.connect(signers[0]).togglePublicSale();
    // await nft.connect(signers[5]).mint(5, {value: parseEther('0.5').toString()});

    // const tx = await nft.connect(signers[0]).airdrop(addresses);
    // const receipt = await tx.wait();
    // console.log(receipt);
        // const tx = await expect(() => nft.connect(signers[0]).airdrop(addresses)).to.changeEtherBalances([], [parseEther('0.15').toString()]);


  })

  it("sets raffleAmount", async function() {
    // await deployments.fixture(["mocks", "vrf"])
    // let linkToken = await ethers.getContract("LinkToken")
    // let vrfCoordinatorMock = await ethers.getContract("VRFCoordinatorMock")
    // let linkTokenAddress = linkToken.address
    // let additionalMessage = " --linkaddress " + linkTokenAddress
    //
    // let randomNumberConsumer = await ethers.getContract("RandomNumberConsumer")
    //
    // await run("fund-link", {
    //   contract: randomNumberConsumer.address,
    //   linkaddress: linkTokenAddress,
    // })
    //
    //
    // const transaction = await randomNumberConsumer.getRandomNumber()
    // const transactionReceipt = await transaction.wait(1)
    // const requestId = transactionReceipt.events[0].topics[1]
    // console.log("requestId: ", requestId)
    // expect(requestId).to.not.be.null
  })

  it("requests random number", async function() {

  })

  it("transfers to 30% to 5 random numbers", async function() {

  })

});
