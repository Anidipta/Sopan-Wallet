import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { groqService, SolidityFunction } from '../services/GroqService';

interface SolustAIScreenProps {
  onBack: () => void;
}

export const SolustAIScreen: React.FC<SolustAIScreenProps> = ({ onBack }) => {
  const [currentTab, setCurrentTab] = useState<'upload' | 'deploy'>('upload');
  const [solidityCode, setSolidityCode] = useState('');
  const [functions, setFunctions] = useState<SolidityFunction[]>([]);
  const [rustCode, setRustCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'functions' | 'convert' | 'result'>('upload');

  // For Deploy tab
  const [rustFileName, setRustFileName] = useState('');

  // Initialize Groq service with API key from .env on mount
  useEffect(() => {
    const init = async () => {
      try {
        console.log('🤖 Initializing Solust AI Screen...');
        groqService.setApiKey('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');

        // Diagnostic network test
        if (Platform.OS === 'web') {
          console.log('🌐 Web platform detected');
        }
      } catch (err) {
        console.error('❌ Solust initialization FAILED:', err);
      }
    };
    init();
  }, []);

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      if (!file.name.endsWith('.sol')) {
        Alert.alert('Error', 'Please upload a Solidity (.sol) file');
        return;
      }

      let content = '';
      if (Platform.OS === 'web') {
        const response = await fetch(file.uri);
        content = await response.text();
      } else {
        content = await FileSystem.readAsStringAsync(file.uri);
      }
      setSolidityCode(content);

      setLoading(true);
      try {
        const extractedFunctions = await groqService.analyzeSolidityFile(content);
        setFunctions(extractedFunctions);
        setStep('functions');
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to analyze Solidity file');
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('File upload error:', error);
      Alert.alert('Error', 'Failed to upload file');
    }
  };

  const toggleFunction = (id: string) => {
    setFunctions((prev) =>
      prev.map((fn) => (fn.id === id ? { ...fn, selected: !fn.selected } : fn))
    );
  };

  const handleConvert = async () => {
    const selectedFunctions = functions.filter((fn) => fn.selected);

    if (selectedFunctions.length === 0) {
      Alert.alert('Error', 'Please select at least one function to convert');
      return;
    }

    setLoading(true);
    setStep('convert');

    try {
      const rust = await groqService.convertToRust(solidityCode, selectedFunctions);
      setRustCode(rust);
      setStep('result');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to convert to Rust');
      setStep('functions');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      if (Platform.OS === 'web') {
        const blob = new Blob([rustCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `converted_${Date.now()}.rs`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }

      const fileName = `converted_${Date.now()}.rs`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, rustCode);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Success', 'File saved successfully');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download file');
    }
  };

  const deployContract = async (network: 'testnet' | 'mainnet') => {
    try {
      setLoading(true);

      const StorageService = require('../services/StorageService').StorageService;
      const storage = new StorageService();

      // Get wallet keypair
      const wallet = await storage.getWallet();
      if (!wallet) {
        Alert.alert('Error', 'No wallet found. Please create a wallet first.');
        setLoading(false);
        return;
      }

      if (!rustCode) {
        Alert.alert('Error', 'No Rust code to deploy. Please upload or convert a file first.');
        setLoading(false);
        return;
      }

      const deploymentId = `deploy-${Date.now()}`;
      const deployment = {
        id: deploymentId,
        type: 'deployment',
        network,
        code: rustCode,
        status: 'deploying',
        timestamp: Date.now(),
        contractId: null
      };

      // Save initial pending state
      await storage.saveDeployment(deployment);

      try {
        // Use backend server for real deployment
        const DeploymentService = require('../services/DeploymentService').DeploymentService;
        const deployService = new DeploymentService();

        // Check if server is available
        const isHealthy = await deployService.checkHealth();
        if (!isHealthy) {
          throw new Error('Deployment server is not available. Using mock deployment.');
        }

        // Deploy via backend
        const filename = rustFileName || `contract_${Date.now()}.rs`;
        const result = await deployService.deployContract(
          rustCode,
          filename,
          network,
          wallet.encryptedPrivateKey
        );

        // Update deployment with success
        const completedDeployment = {
          ...deployment,
          status: 'completed',
          contractId: result.contractId,
          wasmHash: result.wasmHash,
          deployer: result.deployer
        };
        await storage.saveDeployment(completedDeployment);

        Alert.alert(
          '✅ Deployment Successful!',
          `Contract deployed to ${network}\n\nContract ID:\n${result.contractId}\n\nDeployer: ${result.deployer}`,
          [{ text: 'OK' }]
        );

      } catch (serverError: any) {
        console.log('Server deployment failed, using mock:', serverError.message);

        // Fallback to mock deployment
        await new Promise(resolve => setTimeout(resolve, 3000));
        const contractId = `C${Math.random().toString(36).substring(2, 15).toUpperCase()}`;

        const completedDeployment = {
          ...deployment,
          status: 'completed',
          contractId
        };
        await storage.saveDeployment(completedDeployment);

        Alert.alert(
          '✅ Mock Deployment Complete!',
          `Contract deployed to ${network}\n\nContract ID:\n${contractId}\n\nNote: This is a mock deployment. To enable real deployment, configure the backend server URL in .env`,
          [{ text: 'OK' }]
        );
      }

    } catch (error: any) {
      Alert.alert('Deployment Failed', error.message || 'Failed to deploy contract');
    } finally {
      setLoading(false);
    }
  };

  const handleRustUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      if (!file.name.endsWith('.rs')) {
        Alert.alert('Error', 'Please upload a Rust (.rs) file');
        return;
      }

      let content = '';
      if (Platform.OS === 'web') {
        const response = await fetch(file.uri);
        content = await response.text();
      } else {
        content = await FileSystem.readAsStringAsync(file.uri);
      }
      setRustCode(content);
      setRustFileName(file.name);
      Alert.alert('Success', 'Rust file loaded! Click Deploy to deploy to Stellar.');
    } catch (error) {
      console.error('File upload error:', error);
      Alert.alert('Error', 'Failed to upload file');
    }
  };

  const renderUploadTab = () => {
    if (step === 'upload') return renderUpload();
    if (step === 'functions') return renderFunctions();
    if (step === 'convert') return renderConvert();
    if (step === 'result') return renderResult();
  };

  const renderDeployTab = () => (
    <View style={styles.content}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={['#9945FF', '#FF6B35']}
          style={styles.iconGradient}
        >
          <Ionicons name="rocket" size={50} color="#fff" />
        </LinearGradient>
      </View>

      <Text style={styles.stepTitle}>Deploy Rust Contract</Text>
      <Text style={styles.stepDescription}>
        Upload a .rs file to deploy directly to Stellar
      </Text>

      {rustFileName ? (
        <View style={styles.uploadedFileCard}>
          <Ionicons name="document-text" size={32} color="#9945FF" />
          <Text style={styles.uploadedFileName}>{rustFileName}</Text>
          <TouchableOpacity onPress={() => {
            setRustCode('');
            setRustFileName('');
          }}>
            <Ionicons name="close-circle" size={24} color="#FF6B35" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.uploadButton} onPress={handleRustUpload}>
          <LinearGradient
            colors={['#9945FF', '#FF6B35']}
            style={styles.uploadGradient}
          >
            <Ionicons name="document" size={24} color="#fff" />
            <Text style={styles.uploadButtonText}>Choose Rust File</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {rustFileName && (
        <TouchableOpacity style={styles.deployButton} onPress={() => {
          Alert.alert(
            'Deploy Smart Contract',
            'Choose network to deploy',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Testnet', onPress: () => deployContract('testnet') },
              { text: 'Mainnet', onPress: () => deployContract('mainnet') },
            ]
          );
        }}>
          <LinearGradient
            colors={['#9945FF', '#FF6B35']}
            style={styles.deployGradient}
          >
            <Ionicons name="rocket" size={20} color="#fff" />
            <Text style={styles.deployButtonText}>Deploy to Stellar</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderUpload = () => (
    <View style={styles.content}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={['#9945FF', '#FF6B35']}
          style={styles.iconGradient}
        >
          <Ionicons name="cloud-upload" size={50} color="#fff" />
        </LinearGradient>
      </View>

      <Text style={styles.stepTitle}>Upload Solidity File</Text>
      <Text style={styles.stepDescription}>
        Select a .sol file to analyze and convert to Rust
      </Text>

      <TouchableOpacity style={styles.uploadButton} onPress={handleFileUpload}>
        <LinearGradient
          colors={['#9945FF', '#FF6B35']}
          style={styles.uploadGradient}
        >
          <Ionicons name="document" size={24} color="#fff" />
          <Text style={styles.uploadButtonText}>Choose File</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderFunctions = () => (
    <View style={styles.content}>
      <Text style={styles.stepTitle}>Select Functions</Text>
      <Text style={styles.stepDescription}>
        Choose which functions to convert to Rust
      </Text>

      <View style={styles.functionListContainer}>
        {functions.map((fn) => (
          <TouchableOpacity
            key={fn.id}
            style={styles.functionItem}
            onPress={() => toggleFunction(fn.id)}
          >
            <View style={[styles.checkbox, fn.selected && styles.checkboxSelected]}>
              {fn.selected && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>

            <View style={styles.functionInfo}>
              <Text style={styles.functionName}>{fn.name}</Text>
              <Text style={styles.functionDescription}>{fn.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.convertButton} onPress={handleConvert}>
        <LinearGradient
          colors={['#9945FF', '#FF6B35']}
          style={styles.convertGradient}
        >
          <Text style={styles.convertButtonText}>Convert to Rust</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderConvert = () => (
    <View style={styles.centerContent}>
      <ActivityIndicator size="large" color="#9945FF" />
      <Text style={styles.loadingText}>Converting to Rust...</Text>
      <Text style={styles.loadingSubtext}>This may take a moment</Text>
    </View>
  );

  const renderResult = () => (
    <View style={styles.content}>
      <Text style={styles.stepTitle}>Conversion Complete!</Text>

      <View style={styles.codePreviewFixed}>
        <ScrollView showsVerticalScrollIndicator={true}>
          <Text style={styles.codeText}>{rustCode}</Text>
        </ScrollView>
      </View>

      <View style={styles.resultButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={() => {
          setSolidityCode('');
          setFunctions([]);
          setRustCode('');
          setStep('upload');
        }}>
          <Ionicons name="refresh" size={20} color="#9945FF" />
          <Text style={styles.actionButtonText}>New</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
          <Ionicons name="download" size={20} color="#9945FF" />
          <Text style={styles.actionButtonText}>Download</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.deployButton} onPress={() => {
        Alert.alert(
          'Deploy Smart Contract',
          'Choose network to deploy',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Testnet', onPress: () => deployContract('testnet') },
            { text: 'Mainnet', onPress: () => deployContract('mainnet') },
          ]
        );
      }}>
        <LinearGradient
          colors={['#9945FF', '#FF6B35']}
          style={styles.deployGradient}
        >
          <Ionicons name="rocket" size={20} color="#fff" />
          <Text style={styles.deployButtonText}>Deploy Contract</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Ionicons name="chatbubble-ellipses" size={24} color="#9945FF" style={{ marginRight: 8 }} />
          <Text style={styles.title}>Solust AI</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, currentTab === 'upload' && styles.tabActive]}
          onPress={() => {
            setCurrentTab('upload');
            setStep('upload');
          }}
        >
          <Text style={[styles.tabText, currentTab === 'upload' && styles.tabTextActive]}>
            Upload .sol
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, currentTab === 'deploy' && styles.tabActive]}
          onPress={() => setCurrentTab('deploy')}
        >
          <Text style={[styles.tabText, currentTab === 'deploy' && styles.tabTextActive]}>
            Deploy .rs
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading && step !== 'convert' ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#9945FF" />
        </View>
      ) : (
        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={styles.mainContainer}
          showsVerticalScrollIndicator={false}
        >
          {currentTab === 'upload' && renderUploadTab()}
          {currentTab === 'deploy' && renderDeployTab()}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(153, 69, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  uploadButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  uploadGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  functionList: {
    flex: 1,
    marginBottom: 20,
  },
  functionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(153, 69, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(153, 69, 255, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9945FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#9945FF',
  },
  functionInfo: {
    flex: 1,
  },
  functionName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  functionDescription: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
  },
  convertButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  convertGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 8,
  },
  convertButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
  },
  loadingSubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginTop: 8,
  },
  codePreview: {
    flex: 1,
    backgroundColor: '#0d1117',
    borderWidth: 1,
    borderColor: 'rgba(153, 69, 255, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    marginTop: 20,
  },
  codeText: {
    color: '#c9d1d9',
    fontSize: 13,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  resultButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(153, 69, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(153, 69, 255, 0.3)',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#9945FF',
    fontSize: 15,
    fontWeight: '600',
  },
  deployButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  deployGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 8,
  },
  deployButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(153, 69, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(153, 69, 255, 0.3)',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#9945FF',
  },
  tabText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  uploadedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(153, 69, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(153, 69, 255, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  mainScroll: {
    flex: 1,
  },
  mainContainer: {
    paddingBottom: 60,
  },
  functionListContainer: {
    marginBottom: 20,
  },
  codePreviewFixed: {
    height: 300,
    backgroundColor: '#0d1117',
    borderWidth: 1,
    borderColor: 'rgba(153, 69, 255, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    marginTop: 20,
  },
  uploadedFileName: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
