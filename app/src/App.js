/*
 * We are going to be using the useEffect hook!
 */
import { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import Card from './components/Card';
import { Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';
import {
  Program, Provider, web3, BN
} from '@project-serum/anchor';
import ReactGiphySearchbox from 'react-giphy-searchbox'

import idl from './idl.json';
import kp from './keypair.json';

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram } = web3;

const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

// Get our program's id form the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devent.
const network = clusterApiUrl('devnet');

// Control's how we want to acknowledge when a trasnaction is "done".
const opts = {
  preflightCommitment: "processed"
}

const DEFAULT_DATA = [
	['What is the meaning of life','https://media.giphy.com/media/3oz8xIg91ZOMwYvSus/giphy.gif'],
	['Why we are here?', 'https://media.giphy.com/media/3o72F4nTnhd0fxsVhK/giphy.gif'],
	['Why this gif are cute','https://media.giphy.com/media/ic1cehERgA9gY/giphy.gif'],
	['Who are you?', 'https://media.giphy.com/media/huPNDBxnw2SCA/giphy.gif']
];

// Change this up to be your Twitter if you want.
const TWITTER_HANDLE = 'patriciobcs';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const cleanLink = (link) => {
  return link.slice(0, link.indexOf('?cid='));
}

const giphy = (value) => {
  var element = document.querySelector('.reactGiphySearchbox-searchForm-input');
  if (element) {
    var nativeInputValueSetter = Object.getOwnPropertyDescriptor
    (window.HTMLInputElement.prototype, "value").set;
    nativeInputValueSetter.call(element, value);
    var ev = new Event('input', { bubbles: true});
    element.dispatchEvent(ev);
    var giphyContainer = document.querySelector('.reactGiphySearchbox-componentWrapper');
    if (giphyContainer) {
      if (value.length > 0) giphyContainer.style.visibility = "visible";
      else giphyContainer.style.visibility = "hidden";
    }
  }
}

const App = () => {
  // State
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputQuestionValue, setInputQuestionValue] = useState('');
  const [inputQuestionLinkValue, setInputQuestionLinkValue] = useState('');
  const [inputAnswerValue, setInputAnswerValue] = useState('');
  const [inputAnswerLinkValue, setInputAnswerLinkValue] = useState('');
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(-1);
  const [questions, setQuestions] = useState([]);

  /*
   * This function holds the logic for deciding if a Phantom Wallet is
   * connected or not
   */
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!');
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            'Connected with Public Key:',
            response.publicKey.toString()
          );

          /*
          * Set the user's publicKey in state to be used later!
          */
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  };

  /*
   * When our component first mounts, let's check to see if we have a connected
   * Phantom Wallet
   */
  useEffect(() => {
    window.addEventListener('load', async (event) => {
      await checkIfWalletIsConnected();
    });
  }, []);

  const createQuestionAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping")
      await program.rpc.initialize({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await getQuestions();

    } catch(error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  const getQuestions = async() => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      
      console.log("Got the account", account)
      if (account.questions.length > 0) {
        let sortedQuestions = account.questions.map((question, questionIndex) => {
            question.votes = question.upvotes.toNumber() - question.downvotes.toNumber();
            question.index = questionIndex;
            if (question.answers.length > 0) {
              question.answers = question.answers.map((answer, answerIndex) => {
                answer.votes = answer.upvotes.toNumber() - answer.downvotes.toNumber();
                answer.index = answerIndex;
                return answer;
              }).sort(function(a, b) {return b.votes - a.votes;});
            }
            return question;
        }).sort(function(a, b) {return b.votes - a.votes;}).map((item, orderIndex) => ({orderIndex, ...item}));
        console.log(sortedQuestions);
        setQuestions(sortedQuestions);
      } 
    } catch (error) {
      console.log("Error in getQuestions: ", error)
      setQuestions(null);
    }
  }

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching Question list...');
      getQuestions()
    }
  }, [walletAddress]);

  /*
   * Let's define this method so our code doesn't break.
   * We will write the logic for this next!
   */
  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  /* Send a Question to the Program
   */
  const sendQuestion = async () => {
    if (inputQuestionLinkValue.length === 0) {
      console.log("No link given!")
      return
    }
    console.log('Link:', inputQuestionLinkValue);
    if (inputQuestionValue.length === 0) {
      console.log("No question given!")
      return
    }
    console.log('Question:', inputQuestionValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.createQuestion(inputQuestionValue, inputQuestionLinkValue, true, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("Question sucesfully sent to program", inputQuestionValue)

      await getQuestions();
    } catch (error) {
      console.log("Error sending Question:", error)
    }
  };

  const onInputQuestionChange = (event) => {
    const { value } = event.target;
    setInputQuestionValue(value);
  };

  const onInputQuestionLinkChange = (event) => {
    const { value } = event.target;
    setInputQuestionLinkValue(value);
    giphy(value);
  };

  /* Send a Answer to the Program
   */
  const sendAnswer = async () => {
    if (selectedQuestionIndex < 0) {
      console.log("No question selected!");
      return;
    }
    console.log('Question:', selectedQuestionIndex);
    if (inputAnswerLinkValue.length === 0) {
      console.log("No link given!");
      return
    }
    console.log('Link:', inputAnswerLinkValue);
    if (inputAnswerValue.length === 0) {
      console.log("No answer given!");
      return;
    }
    console.log('Answer:', inputAnswerValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.addAnswer(inputAnswerValue, inputAnswerLinkValue, new BN(questions[selectedQuestionIndex].index), {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("Answer sucesfully sent to program", inputAnswerValue)

      await getQuestions();
    } catch (error) {
      console.log("Error sending Answer:", error)
    }
  };

   const onInputAnswerChange = (event) => {
    const { value } = event.target;
    setInputAnswerValue(value);
  };

  const onInputAnswerLinkChange = (event) => {
    const { value } = event.target;
    setInputAnswerLinkValue(value);
    giphy(value);
  };

  /* Vote Question or Answer
   */
  const Vote = async (side, index) => {
    console.log('Vote:', (side ? "Up" : "Down"), "Index: ", index);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      if (selectedQuestionIndex < 0) {
        await program.rpc.voteQuestion(side, new BN(index), {
          accounts: {
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey,
          },
        });
      } else {
        await program.rpc.voteAnswer(side, new BN(questions[selectedQuestionIndex].index), new BN(index), {
          accounts: {
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey,
          },
        });
      }
      console.log("Vote sucesfully sent to program");
      await getQuestions();
    } catch (error) {
      console.log("Error sending Question:", error)
    }
  };

  /*
   * We want to render this UI when the user hasn't connected
   * their wallet to our app yet.
   */
  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  const renderConnectedContainer = () => {
    // If we hit this, it means the program account hasn't be initialized.
    if (questions === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createQuestionAccount}>
            Do One-Time Initialization For Question Program Account
          </button>
        </div>
      )
    } 
    // Otherwise, we're good! Account exists. User can submit Questions.
    else {
      return(
        <div className="connected-container">
          <div className="form-container">
          <input
            type="text"
            placeholder={"Enter a " + (selectedQuestionIndex < 0 ? "Question" : "Answer")}
            value={selectedQuestionIndex < 0 ? inputQuestionValue : inputAnswerValue}
            onChange={selectedQuestionIndex < 0 ? onInputQuestionChange : onInputAnswerChange}
            className="form-item"
          />
          <div className="input-link form-item">
          <input
            type="text"
            placeholder="Enter a GIF URL"
            className="input-link-write"
            value={selectedQuestionIndex < 0 ? inputQuestionLinkValue : inputAnswerLinkValue}
            onChange={selectedQuestionIndex < 0 ? onInputQuestionLinkChange : onInputAnswerLinkChange}
          />
          <ReactGiphySearchbox
            apiKey="mDnrs8mJ6lKAIt5QTo9tgzAcA6lVRXQf"
            onSelect={item => {
              console.log(item);
              let link = cleanLink(item.images.original.url);
              giphy(link);
              if (selectedQuestionIndex < 0) setInputQuestionLinkValue(link); else setInputAnswerLinkValue(link);}}
            onSearch={text => {
              console.log(text); 
              if (['png','gif','jpg'].indexOf(text.split('.').pop()) > -1) {
              if (selectedQuestionIndex < 0) setInputQuestionLinkValue(text); 
              else setInputAnswerLinkValue(text);}}}
            searchPlaceholder="Search a GIF"
            autoFocus={false}
            messageError=""
            messageNoMatches=""
            gifListHeight="200px"
          />
          </div>
          <button className="cta-button submit-gif-button form-item" onClick={selectedQuestionIndex < 0 ? sendQuestion : sendAnswer}>
            {selectedQuestionIndex < 0 ? "Ask!" : "Answer!"}
          </button>
          </div>
          <div className="cards">
            {selectedQuestionIndex < 0 ? 
            questions.map((question, index) => 
            <Card item={question} vote={Vote} set={setSelectedQuestionIndex}/>) : 
            questions[selectedQuestionIndex].answers.map(answers => 
            <Card item={answers} vote={Vote}/>)}
          </div>
        </div>
      )
    }
  }

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  return (
    <div className="App" onClick={(e) => {if (e.target.localName == 'div' ) setSelectedQuestionIndex(-1)}}>
			<div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="container">
          <div className="header-container">
            <p className="header gradient-text">SOLASK 🗣</p>
            <p className="sub-text">
              {selectedQuestionIndex < 0 ? "Don't know something? Ask it here, in the Solana Q&A metaverse ✨" : questions[selectedQuestionIndex].title}
            </p>
            {!walletAddress && renderNotConnectedContainer()}
            {walletAddress && renderConnectedContainer()}
          </div>
          <div className="footer-container">
            <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
            <a
              className="footer-text"
              href={TWITTER_LINK}
              target="_blank"
              rel="noreferrer"
            >{`built by @${TWITTER_HANDLE}`}</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;