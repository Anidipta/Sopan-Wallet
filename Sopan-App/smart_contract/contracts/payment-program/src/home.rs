use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, token};

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Admin,
}

#[contract]
pub struct PaymentContract;

#[contractimpl]
impl PaymentContract {
    /// Initialize the contract with an admin (owner)
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Contract is already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Perform a transaction with 0.01% service fee
    /// The fee is kept in the contract address
    pub fn pay(env: Env, from: Address, to: Address, token: Address, amount: i128) {
        from.require_auth();
        
        if amount <= 0 {
            panic!("Amount must be positive");
        }

        // Calculate 0.01% service fee on top of the amount
        // 0.01% = 1/10000.
        let fee = amount / 10000;

        let client = token::Client::new(&env, &token);
        
        // Collect fee from sender to contract
        if fee > 0 {
            client.transfer(&from, &env.current_contract_address(), &fee);
        }

        // Transfer the full original amount to the recipient
        client.transfer(&from, &to, &amount);
    }

    /// Withdraw accumulated service fees from the contract
    /// Only the admin can call this
    pub fn withdraw_fees(env: Env, token: Address, to: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).expect("Contract mapping not initialized");
        admin.require_auth();

        let client = token::Client::new(&env, &token);
        let balance = client.balance(&env.current_contract_address());
        
        if balance > 0 {
            client.transfer(&env.current_contract_address(), &to, &balance);
        }
    }

    /// Helper to check the current admin
    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).expect("Admin not set")
    }
}
