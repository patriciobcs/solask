import React from 'react';
import { BsFillArrowUpCircleFill, BsFillArrowDownCircleFill } from "react-icons/bs";

const Card = (props) => {
  return(
        <div key={props.item.index} className="card" onClick={() => {
          if (props.item.hasOwnProperty("answers")) props.set(props.item.orderIndex);}}>
          <div className="img-container">
            <img alt={props.item.link} src={props.item.link} />
            <svg width="0" height="0">
              <linearGradient id="main-gradient" x1="0%" y1="0%" x2="1000%" y2="100%">
                <stop stopColor="#4e44ce" offset="0%" />
                <stop stopColor="#35aee2" offset="100%" />
              </linearGradient>
            </svg>
            <button className="vote-button upvote-button" onClick={(e) => {e.stopPropagation();!props.questionIndex ? props.vote(true, props.item.index) : props.vote(true, props.questionIndex, props.item.index)}}>
            <BsFillArrowUpCircleFill/>
            </button>
            <button className="vote-button downvote-button" onClick={(e) => {e.stopPropagation();!props.questionIndex ? props.vote(false, props.item.index) : props.vote(false, props.questionIndex, props.item.index)}}>
            <BsFillArrowDownCircleFill/>
            </button>
          </div>
          <div className="card-body">
            <h2>{props.item.title}</h2>
            <h5>{props.item.userAddress.toString()}</h5>
          </div>
        </div>
    )
}

export default Card;