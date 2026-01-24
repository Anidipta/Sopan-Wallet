/**
 * Deployment Service for connecting mobile app to backend server
 * Handles Rust to WASM compilation and Stellar deployment
 */

// Replace with your deployed server URL
const API_URL = process.env.DEPLOYMENT_API_URL || 'http://localhost:3000';

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
        try {
            // Create FormData
            const formData = new FormData();

            // Convert string content to Blob
            const blob = new Blob([rustContent], { type: 'text/plain' });
            formData.append('file', blob, filename);
            formData.append('network', network);
            formData.append('privateKey', privateKey);

            // Start deployment
            const response = await fetch(`${API_URL}/api/deploy-contract`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Deployment request failed');
            }

            const { jobId } = await response.json();

            // Poll for completion
            return await this.pollJobStatus(jobId);
        } catch (error: any) {
            console.error('Deployment error:', error);
            throw new Error(error.message || 'Failed to deploy contract');
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
                const response = await fetch(`${API_URL}/api/job/${jobId}`);

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
            const response = await fetch(`${API_URL}/api/job/${jobId}`);

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
        try {
            const response = await fetch(`${API_URL}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            return response.ok;
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    }
}
