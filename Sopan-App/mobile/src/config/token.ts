// Sopan Token Configuration

export interface TokenConfig {
  code: string;
  issuer: string;
  decimals: number;
  name: string;
  description: string;
}

// TODO: Replace with your actual issuer public key after creating the token
export const Sopan_TOKEN: TokenConfig = {
  code: 'Sopan',
  issuer: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // Replace with actual issuer
  decimals: 7,
  name: 'Sopan Token',
  description: 'Offline-first payment token for emerging markets'
};

// Use native XLM by default until token is created
export const USE_CUSTOM_TOKEN = false; // Set to true after creating Sopan token

export const getPaymentAsset = () => {
  if (USE_CUSTOM_TOKEN && Sopan_TOKEN.issuer !== 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') {
    return {
      code: Sopan_TOKEN.code,
      issuer: Sopan_TOKEN.issuer
    };
  }
  return null; // null = native XLM
};
