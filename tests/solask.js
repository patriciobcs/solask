const anchor = require('@project-serum/anchor');

// Need the system program, will talk about this soon.
const { SystemProgram } = anchor.web3;

const main = async() => {
  console.log("🚀 Starting test...")

  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Solask;
	
	// Create an account keypair for our program to use.
  const baseAccount = anchor.web3.Keypair.generate();

  // Call start_stuff_off, pass it the params it needs!
  let tx = await program.rpc.initialize({
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [baseAccount],
  });

  console.log("📝 Your transaction signature", tx);


  // Create a QUESTION
  await program.rpc.createQuestion("What is the the meaning of life?", true, {
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
    },
  });

  // Fetch data from the account.
  let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log('👀 First Question Answers Count', account.questions[0].answersAmount.toString())

  // Add a first GIF
  await program.rpc.addAnswer(new anchor.BN(0), "https://media.giphy.com/media/ef61oIGVyckY8/giphy.answer",{
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
    },
  });

  // Add a second GIF
  await program.rpc.addAnswer(new anchor.BN(0), "https://media.giphy.com/media/3o72F4nTnhd0fxsVhK/giphy.answer",{
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
    },
  });

  // Get the account again to see what changed.
  account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log('👀 First Question Answers Count', account.questions[0].answersAmount.toString());

  // Upvote the first GIF
  await program.rpc.voteAnswer(new anchor.BN(0), new anchor.BN(0), true, {
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
    },
  });

  // Downvote the second GIF
  await program.rpc.voteAnswer(new anchor.BN(0), new anchor.BN(1), false, {
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
    },
  });

  // Get the account again to see what changed.
  account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log('👀 Questions List', account.questions);
  console.log('👀 First Question Answers List', account.questions[0].answers);
}

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

runMain();