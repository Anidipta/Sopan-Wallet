use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program::invoke,
    program_error::ProgramError,
    pubkey::Pubkey,
    system_instruction,
};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct OfflinePayment {
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
    pub nonce: [u8; 32],
    pub signature: [u8; 64],
}

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let payment = OfflinePayment::try_from_slice(instruction_data)?;
    
    msg!("Processing offline payment");
    msg!("Amount: {}", payment.amount);
    
    let accounts_iter = &mut accounts.iter();
    let sender_account = next_account_info(accounts_iter)?;
    let recipient_account = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    if !sender_account.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    invoke(
        &system_instruction::transfer(
            sender_account.key,
            recipient_account.key,
            payment.amount,
        ),
        &[
            sender_account.clone(),
            recipient_account.clone(),
            system_program.clone(),
        ],
    )?;

    msg!("Payment processed successfully");
    Ok(())
}
