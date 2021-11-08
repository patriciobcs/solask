use anchor_lang::prelude::*;

declare_id!("Fy9oEdoCQDzcDq9nMc2DfiCjVC7tkDfS6R4wrY42bT3M");

#[program]
pub mod solask {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        base_account.questions_amount = 0;
        Ok(())
    }

    pub fn create_question(
        ctx: Context<CreateQuestion>,
        title: String,
        link: String,
        multiple_answers: bool,
    ) -> Result<()> {
        let base_account = &mut ctx.accounts.base_account;
        let question = Question {
            title,
            link,
            multiple_answers,
            answers_amount: 0,
            answers: vec![],
        };
        base_account.questions.push(question);
        Ok(())
    }

    pub fn add_answer(
        ctx: Context<AddAnswer>,
        title: String,
        link: String,
        question_index: u64,
    ) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        let answer = Answer {
            title,
            link,
            votes: vec![],
            downvotes: 0,
            upvotes: 0,
            user_address: *base_account.to_account_info().key,
        };
        if let Some(question) = base_account.questions.get_mut(question_index as usize) {
            question.answers.push(answer);
            question.answers_amount += 1;
        } else {
            return Err(ErrorCode::QuestionNotFound.into());
        }
        Ok(())
    }

    pub fn vote_answer(
        ctx: Context<VoteAnswer>,
        side: bool,
        question_index: u64,
        answer_index: u64,
    ) -> ProgramResult {
        let user_address = *ctx.accounts.user.to_account_info().key;
        let base_account = &mut ctx.accounts.base_account;

        if let Some(question) = base_account.questions.get_mut(question_index as usize) {
            let answers = &mut question.answers;
            if let Some(answer) = answers.get_mut(answer_index as usize) {
                if let Some(_) = answer
                    .votes
                    .iter()
                    .position(|vote| (*vote).user_address == user_address)
                {
                    return Err(ErrorCode::UnauthorizedToVote.into());
                }

                let vote = Vote { side, user_address };
                answer.votes.push(vote);

                if side {
                    answer.upvotes += 1;
                } else {
                    answer.downvotes += 1;
                }
            } else {
                return Err(ErrorCode::AnswerNotFound.into());
            }
        } else {
            return Err(ErrorCode::QuestionNotFound.into());
        }
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 9000)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateQuestion<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct AddAnswer<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct VoteAnswer<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct Vote {
    pub side: bool,
    pub user_address: Pubkey,
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct Answer {
    pub title: String,
    pub link: String,
    pub votes: Vec<Vote>,
    pub upvotes: u64,
    pub downvotes: u64,
    pub user_address: Pubkey,
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct Question {
    pub title: String,
    pub link: String,
    pub multiple_answers: bool,
    pub answers_amount: u64,
    pub answers: Vec<Answer>,
}

#[account]
pub struct BaseAccount {
    pub questions_amount: u64,
    pub questions: Vec<Question>,
}

#[error]
pub enum ErrorCode {
    #[msg("Question not found")]
    QuestionNotFound,
    #[msg("Answer not found")]
    AnswerNotFound,
    #[msg("You have already add answer.")]
    UnauthorizedToAddAnswer,
    #[msg("You have already voted.")]
    UnauthorizedToVote,
}
