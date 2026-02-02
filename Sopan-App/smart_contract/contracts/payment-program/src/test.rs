#[cfg(test)]
mod test {
    use crate::{PaymentContract, PaymentContractClient};
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::{token, Address, Env};

    #[test]
    fn test_payment_with_fee() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let user_a = Address::generate(&env);
        let user_b = Address::generate(&env);
        
        // 1. Register and setup the Payment Contract
        let contract_id = env.register(PaymentContract, ());
        let client = PaymentContractClient::new(&env, &contract_id);
        client.initialize(&admin);

        // 2. Setup a mock Stellar Asset (XLM/Token)
        let token_identifier = env.register_stellar_asset_contract_v2(admin.clone());
        let token_id = token_identifier.address(); // Get the actual Address
        
        let token_admin = token::StellarAssetClient::new(&env, &token_id);
        let token_client = token::Client::new(&env, &token_id);

        // 3. Mint initial balance to User A (1 Million units)
        token_admin.mint(&user_a, &1_000_000);
        assert_eq!(token_client.balance(&user_a), 1_000_000);

        // 4. User A pays User B 100,000 units
        // Service fee (0.01%): 100,000 / 10,000 = 10 units
        // Total from A: 100,000 + 10 = 100,010 units (Fee-on-top)
        // User B receives: exactly 100,000 units
        let payment_amount = 100_000;
        client.pay(&user_a, &user_b, &token_id, &payment_amount);

        // Verify balances after payment
        // User A should have 1,000,000 - 100,010 = 899,990
        assert_eq!(token_client.balance(&user_a), 899_990);
        // User B should have exactly 100,000
        assert_eq!(token_client.balance(&user_b), 100_000); 
        // Contract should have collected the 10 units fee
        assert_eq!(token_client.balance(&contract_id), 10);

        // 5. Admin withdraws fees
        client.withdraw_fees(&token_id, &admin);

        // Verify final state
        assert_eq!(token_client.balance(&contract_id), 0);
        assert_eq!(token_client.balance(&admin), 10);
    }

    #[test]
    #[should_panic(expected = "Contract is already initialized")]
    fn test_double_initialization() {
        let env = Env::default();
        let admin = Address::generate(&env);
        let contract_id = env.register(PaymentContract, ());
        let client = PaymentContractClient::new(&env, &contract_id);

        client.initialize(&admin);
        client.initialize(&admin); // Should panic
    }
}
