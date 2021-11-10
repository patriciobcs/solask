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
  await program.rpc.createQuestion("What is the the meaning of life?", "https://media.giphy.com/media/3oz8xIg91ZOMwYvSus/giphy.gif", true, {
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
    },
  });

  // Upvote the first QUESTION
  await program.rpc.voteQuestion(true, new anchor.BN(0), {
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
    },
  });

  // Fetch data from the account
  let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log('👀 First Question Answers Count', account.questions[0].answersAmount.toString())

  // Add a first ANSWER
  await program.rpc.addAnswer("42", "https://media.giphy.com/media/ef61oIGVyckY8/giphy.answer", new anchor.BN(0), {
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
    },
  });

  // Add a second ANSWER
  await program.rpc.addAnswer("GM", "https://media.giphy.com/media/3o72F4nTnhd0fxsVhK/giphy.answer", new anchor.BN(0), {
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
    },
  });

  // Get the account again to see what changed
  account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log('👀 First Question Answers Count', account.questions[0].answersAmount.toString());

  // Upvote the first ANSWER
  await program.rpc.voteAnswer(true, new anchor.BN(0), new anchor.BN(0), {
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
    },
  });

  // Downvote the second ANSWER
  await program.rpc.voteAnswer(false, new anchor.BN(0), new anchor.BN(1), {
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