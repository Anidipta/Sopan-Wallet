/**
 * Deployment Service for connecting mobile app to backend server
 * Handles Rust to WASM compilation and Stellar deployment
 */

// Production server URL - Update this after deploying to Railway
const API_URL = 'https://sopan-wallet-production.up.railway.app';

// Helper to remove trailing slash
const normalizedUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

export interface DeploymentJob {
    id: string;
    status: 'processing' | 'compiling' | 'deploying' | 'deployed' | 'failed';
    stage: string;
    filename?: string;
    network?: string;
    contractId?: string;
    wasmHash?: string;
    deployer?: string;
    error?: string;
    startTime: number;
    endTime?: number;
}

export class DeploymentService {
    constructor() {
        console.log(`🚀 DeploymentService initialized with URL: ${normalizedUrl}`);
    }
    /**
     * Deploy a Rust contract file to Stellar
     * @param rustContent - The Rust file content as a string
     * @param filename - Original filename
     * @param network - Target network (testnet or mainnet)
     * @param privateKey - Stellar private key for deployment
     * @returns Deployed contract information
     */
    async deployContract(
        rustContent: string,
        filename: string,
        network: 'testnet' | 'mainnet',
        privateKey: string
    ): Promise<DeploymentJob> {
        let tempUri = '';
        try {
            const FileSystem = require('expo-file-system/legacy');

            // Create a temporary file
            tempUri = FileSystem.cacheDirectory + filename;
            await FileSystem.writeAsStringAsync(tempUri, rustContent);

            // Create FormData
            const formData = new FormData();

            // React Native specific file object
            formData.append('file', {
                uri: tempUri,
                name: filename,
                type: 'text/plain',
            } as any);

            formData.append('network', network);
            formData.append('privateKey', privateKey);

            // Start deployment
            console.log(`📤 Sending deployment request to: ${normalizedUrl}/api/deploy-contract`);
            const response = await fetch(`${normalizedUrl}/api/deploy-contract`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `Deployment request failed with status ${response.status}`);
            }

            const { jobId } = await response.json();
            console.log(`✅ Deployment job created: ${jobId}`);

            // Poll for completion
            return await this.pollJobStatus(jobId);
        } catch (error: any) {
            console.error('Deployment error:', error);
            throw new Error(error.message || 'Failed to deploy contract');
        } finally {
            // Clean up temp file
            if (tempUri) {
                try {
                    const FileSystem = require('expo-file-system/legacy');
                    await FileSystem.deleteAsync(tempUri, { idempotent: true });
                } catch (e) {
                    console.warn('Failed to delete temp file:', e);
                }
            }
        }
    }

    /**
     * Poll job status until completion or failure
     * @param jobId - The job ID to monitor
     * @returns Final job status
     */
    async pollJobStatus(jobId: string): Promise<DeploymentJob> {
        const maxAttempts = 60; // 60 attempts x 2 seconds = 2 minutes max
        let attempts = 0;

        while (attempts < maxAttempts) {
            try {
                const response = await fetch(`${normalizedUrl}/api/job/${jobId}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch job status');
                }

                const job: DeploymentJob = await response.json();

                // Check if job is complete (success or failure)
                if (job.status === 'deployed') {
                    return job;
                } else if (job.status === 'failed') {
                    throw new Error(job.error || 'Deployment failed');
                }

                // Wait 2 seconds before next poll
                await new Promise(resolve => setTimeout(resolve, 2000));
                attempts++;
            } catch (error) {
                if (attempts >= maxAttempts - 1) {
                    throw error;
                }
                // Continue polling on transient errors
                await new Promise(resolve => setTimeout(resolve, 2000));
                attempts++;
            }
        }

        throw new Error('Deployment timeout - please check job status manually');
    }

    /**
     * Get current status of a deployment job
     * @param jobId - The job ID to check
     * @returns Current job status
     */
    async getJobStatus(jobId: string): Promise<DeploymentJob> {
        try {
            const response = await fetch(`${normalizedUrl}/api/job/${jobId}`);

            if (!response.ok) {
                throw new Error('Job not found');
            }

            return await response.json();
        } catch (error: any) {
            console.error('Get job status error:', error);
            throw new Error(error.message || 'Failed to get job status');
        }
    }

    /**
     * Check if the deployment server is reachable
     * @returns true if server is healthy
     */
    async checkHealth(): Promise<boolean> {
        console.log(`🔍 Checking health at: ${normalizedUrl}/health`);
        try {
            const response = await fetch(`${normalizedUrl}/health`, {
                method: 'GET',
            });

            console.log(`📡 Health check response: ${response.status} ${response.ok}`);
            return response.ok;
        } catch (error: any) {
            console.error(`❌ Health check failed at ${API_URL}/health:`, error);
            // Additional check: maybe it's a DNS issue or SSL issue
            return false;
        }
    }
}
