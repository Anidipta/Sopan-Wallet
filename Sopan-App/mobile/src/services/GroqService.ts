import Groq from 'groq-sdk';

export interface SolidityFunction {
    id: string;
    name: string;
    description: string;
    signature: string;
    selected: boolean;
}

export class GroqService {
    private groq: Groq | null = null;
    private apiKey: string | null = null;

    constructor() {
        // API key will be set from environment or user input
        this.initializeGroq();
    }

    private async initializeGroq() {
        try {
            // In React Native, we'll need to get the API key from AsyncStorage or user input
            // For now, we'll initialize it when needed
            this.apiKey = process.env.GROQ_API_KEY || null;
            if (this.apiKey) {
                this.groq = new Groq({ apiKey: this.apiKey });
            }
        } catch (error) {
            console.error('Failed to initialize Groq:', error);
        }
    }

    setApiKey(apiKey: string) {
        this.apiKey = apiKey;
        this.groq = new Groq({ apiKey });
    }

    async analyzeSolidityFile(fileContent: string): Promise<SolidityFunction[]> {
        if (!this.groq) {
            throw new Error('Groq API not initialized. Please set API key first.');
        }

        try {
            const prompt = `Analyze this Solidity smart contract and extract all functions. For each function, provide:
1. Function name
2. One-line description of what it does
3. Full function signature

Return the response as a JSON array with this structure:
[
  {
    "name": "functionName",
    "description": "One line description",
    "signature": "full function signature"
  }
]

Solidity code:
\`\`\`solidity
${fileContent}
\`\`\`

Return ONLY the JSON array, no additional text.`;

            const completion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.3,
                max_tokens: 2048,
            });

            const response = completion.choices[0]?.message?.content || '[]';

            // Parse the JSON response
            const functions = JSON.parse(response.trim());

            // Add IDs and selected flag
            return functions.map((fn: any, index: number) => ({
                id: `fn-${index}`,
                name: fn.name,
                description: fn.description,
                signature: fn.signature,
                selected: true, // All functions selected by default
            }));
        } catch (error) {
            console.error('Error analyzing Solidity file:', error);
            throw error;
        }
    }

    async convertToRust(
        solidityCode: string,
        selectedFunctions: SolidityFunction[]
    ): Promise<string> {
        if (!this.groq) {
            throw new Error('Groq API not initialized. Please set API key first.');
        }

        try {
            const functionList = selectedFunctions
                .map((fn) => `- ${fn.name}: ${fn.description}`)
                .join('\n');

            const prompt = `Convert this Solidity smart contract to Rust (Solana program).

Original Solidity code:
\`\`\`solidity
${solidityCode}
\`\`\`

Convert ONLY these functions:
${functionList}

Requirements:
1. Use Solana's Anchor framework
2. Maintain the same logic and functionality
3. Include proper error handling
4. Add comments explaining the conversion
5. Use Rust best practices

Return ONLY the Rust code, properly formatted.`;

            const completion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.5,
                max_tokens: 4096,
            });

            const rustCode = completion.choices[0]?.message?.content || '';
            return rustCode.trim();
        } catch (error) {
            console.error('Error converting to Rust:', error);
            throw error;
        }
    }
}

export const groqService = new GroqService();
