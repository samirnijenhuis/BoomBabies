// test/CreativeFriendz-3.test.js
// Load dependencies
const { expect } = require('chai');
const { parseEther } = require('ethers/lib/utils');
const { ethers } = require('hardhat');


// Start test block
describe('CreativeFriendzClub3', function () {
  before(async function () {
    this.Token = await ethers.getContractFactory('CreativeFriendzClub3');
    // await ethers.provider.send('evm_setNextBlockTimestamp', [Date.now()]);
    // await ethers.provider.send('evm_mine');

  });


  this.beforeEach(async function() {
    const signers = await ethers.getSigners();
    this.token = await this.Token.deploy("ipfs://some-test-uri", [signers[10].address, signers[11].address]);
    await this.token.deployed();
  })

  // /** @all */
  // it('respects max supply', async function () {
  //   const signers = await ethers.getSigners();
  //   this.token = await this.Token.deploy("ipfs://some-test-uri", []);
  //
  //   await this.token.connect(signers[0]).togglePublicSale();
  //   for(var i = 1; i < 1000; i++) {
  //     await this.token.connect(signers[i]).mint(1, {value: parseEther('0.5').toString()});
  //   }
  //
  //   await expect(
  //       this.token.connect(signers[1001]).mint(1, {value: parseEther('0.5').toString()})
  //   ).to.be.revertedWith("Quantity exceeds supply");
  // });

  /** @all */
  it("has a mint price of .5 eth", async function() {
    expect(
      ethers.utils.formatEther( (await this.token.MINT_PRICE()).toString())
      ).to.equal('0.5');
  })

  /** @all */
  it("only allows team to call withdraw", async function(){
      const signers = await ethers.getSigners();

      await expect(
        this.token.connect(signers[9]).withdraw()
      ).to.be.revertedWith("Withdraw must be initiated by a team member");

      await this.token.connect(signers[10]).withdraw();
  })

  /** @all */
  it("splits the funds equally between all team members", async function(){

    const signers = await ethers.getSigners();

    // Put some money in the contract
    await this.token.connect(signers[0]).togglePublicSale();
    await this.token.connect(signers[1]).mint(1, {value: parseEther('0.5').toString()});

    await expect(() => this.token.connect(signers[10]).withdraw()).to.changeEtherBalances([signers[10], signers[11]], [parseEther('0.25').toString(), parseEther('0.25').toString()]);
  })

  /** @all */
  it("only allows owner to change mint price", async function(){
    const signers = await ethers.getSigners();

    await expect(
      this.token.connect(signers[1]).setMintPrice(parseEther('0.6').toString())
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await this.token.connect(signers[0]).setMintPrice(parseEther('0.6').toString());
  });

  /** @all */
  it("changes the mint price", async function(){
    const signers = await ethers.getSigners();

    expect((await this.token.MINT_PRICE()).toString()).to.equal(parseEther('0.5').toString());

    await this.token.connect(signers[0]).setMintPrice(parseEther('0.6'));

    expect((await this.token.MINT_PRICE()).toString()).to.equal(parseEther('0.6').toString());
  });

  /** @all */
  it("only allows 1 token per address", async function(){
    const signers = await ethers.getSigners();


    await this.token.connect(signers[0]).togglePublicSale();
    await this.token.connect(signers[1]).mint(1, {value: parseEther('0.5').toString()});

    await expect(
      this.token.connect(signers[1]).mint(1, {value: parseEther('0.5').toString()})
    ).to.be.revertedWith("Address exceeds quantity limit.");
  });

  /** @all */
  it("doesnt allow URI on unminted token IDs ", async function(){
    await expect(
        this.token.tokenURI(2) // 0 and 1 are team mints.
    ).to.be.revertedWith("ERC721: token not found");
  });

  /** @all */
  it("bases token URI on tokenID", async function(){
    const signers = await ethers.getSigners();

    await this.token.connect(signers[0]).togglePublicSale();
    await this.token.connect(signers[1]).mint(1, {value: parseEther('0.5').toString()});
    await this.token.connect(signers[2]).mint(1, {value: parseEther('0.5').toString()});
    await this.token.connect(signers[0]).toggleReveal();

    expect((await this.token.tokenURI(2)).toString()).to.contain('2');
    expect((await this.token.tokenURI(3)).toString()).to.contain('3');
  });

  /** @all */
  it("bases revealed token URI on baseURI", async function(){
    const signers = await ethers.getSigners();

    await this.token.connect(signers[0]).toggleReveal();

    expect((await this.token.tokenURI(0)).toString()).to.contain('ipfs://some-test-uri');
  });

  /** @all */
  it("bases not reaveled token URI on notRevealedURI", async function() {
    const signers = await ethers.getSigners();

    await this.token.connect(signers[0]).setNotRevealedURI("some-funny-string");

    expect((await this.token.tokenURI(0)).toString()).to.contain('some-funny-string');
  })

  /** @all */
  it("allows only the owner to reveal", async function() {
    const signers = await ethers.getSigners();

    await expect(
        this.token.connect(signers[1]).toggleReveal()
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await this.token.connect(signers[0]).toggleReveal();
  });

  /** @all */
  it("allows only the owner to set the notRevealedURI", async function(){
    const signers = await ethers.getSigners();

    await expect(
        this.token.connect(signers[1]).setNotRevealedURI("some-funny-url")
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await this.token.connect(signers[0]).setNotRevealedURI("some-funny-url");
  });

  /** @all */
  it("allows only the owner to set the baseURI", async function(){
    const signers = await ethers.getSigners();

    await expect(
        this.token.connect(signers[1]).setBaseURI("ipfs://something")
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await this.token.connect(signers[0]).setBaseURI("ipfs://something");
  });

  /** @all */
  it("pre-mints to the team", async function() {
    const signers = await ethers.getSigners();
    const nft = await this.Token.deploy("ipfs://some-test-uri", [signers[0].address, signers[2].address, signers[3].address], []);
    await nft.deployed();

    expect((await nft.balanceOf(signers[0].address)).toString()).to.be.equal('1');
    expect((await nft.balanceOf(signers[1].address)).toString()).to.be.equal('0');
    expect((await nft.balanceOf(signers[2].address)).toString()).to.be.equal('1');
    expect((await nft.balanceOf(signers[3].address)).toString()).to.be.equal('1');
  });

  /** @all */
  it("mints to the right owner", async function() {
    const signers = await ethers.getSigners();

    await this.token.connect(signers[0]).togglePublicSale();
    expect((await this.token.balanceOf(signers[1].address)).toString()).to.be.equal('0');

    await this.token.connect(signers[1]).mint(1, {value: parseEther('0.5').toString()});
    expect((await this.token.balanceOf(signers[1].address)).toString()).to.be.equal('1');
  });

  /** @all */
  it("can only be minted for the mint price", async function() {
    const signers = await ethers.getSigners();
    await this.token.connect(signers[0]).togglePublicSale();

    await expect(
        this.token.connect(signers[3]).mint(1, {value: parseEther('0.4999999').toString()})
    ).to.be.revertedWith("Amount of ether sent does not match total mint amount");

    this.token.connect(signers[3]).mint(1, {value: parseEther('0.5').toString()})
  })

  /** @all */
  it("only allows 1 token per mint", async function() {
    const signers = await ethers.getSigners();
    await this.token.connect(signers[0]).togglePublicSale();

    await expect(
        this.token.connect(signers[3]).mint(2, {value: parseEther('0.5').toString()})
    ).to.be.revertedWith("Quantity exceeds per-transaction limit");

    this.token.connect(signers[3]).mint(1, {value: parseEther('0.5').toString()})
  })

  /** @contract-3 */
  it("allows the public to buy after sale opens", async function() {
    const signers = await ethers.getSigners();


    await expect(
        this.token.connect(signers[3]).mint(1, {value: parseEther('0.5').toString()})
    ).to.be.revertedWith("Mint not started yet");

    await this.token.connect(signers[0]).togglePublicSale();

    await this.token.connect(signers[3]).mint(1, {value: parseEther('0.5').toString()})

  })

  /** @contract-2 */
  /** @contract-3 */
  it("only allows owner to toggle the sale", async function() {
    const signers = await ethers.getSigners();

    await expect(
        this.token.connect(signers[1]).togglePublicSale()
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await this.token.connect(signers[0]).togglePublicSale();
  })

});
