import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, Platform } from 'react-native';
import { StorageService } from '../services/StorageService';
import { StellarService } from '../services/StellarService';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../types';

// Local interface removed in favor of global one from ../types

interface HistoryScreenProps {
  onBack: () => void;
  onTransactionSelect?: (transaction: Transaction) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onBack, onTransactionSelect }) => {
  const isWebDesktop = Platform.OS === 'web';
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [loading, setLoading] = useState(true);

  const storage = new StorageService();
  const stellar = new StellarService('testnet');

  useEffect(() => {
    loadTransactions();
  }, []);

  const openInExplorer = (txHash: string) => {
    const url = `https://stellar.expert/explorer/testnet/tx/${txHash}`;
    Linking.openURL(url);
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const wallet = await storage.getWallet();
      if (!wallet) return;

      // Load offline/pending transactions
      const offlineTxs = await storage.getOfflineTransactions();

      // Convert offline txs to Transaction format
      const pendingTransactions: Transaction[] = offlineTxs.map(tx => ({
        id: tx.id,
        type: 'send',
        amount: tx.amount,
        recipient: tx.recipient,
        sender: tx.sender || wallet.publicKey,
        timestamp: tx.timestamp,
        status: 'pending',
        mode: 'offline',
        memo: tx.memo
      }));

      // Fetch deployments (mock)
      const deployments = await storage.getDeployments();
      const deploymentTxs: Transaction[] = deployments.map((d: any) => ({
        id: d.id,
        type: 'deploy',
        amount: 0,
        recipient: `Contract (${d.network})`,
        sender: wallet.publicKey,
        timestamp: d.timestamp,
        status: d.status,
        mode: 'online',
        contractId: d.contractId,
        isDeployment: true
      }));

      // Fetch real transactions from Stellar blockchain
      const stellarTxs = await stellar.getRecentTransactions(wallet.publicKey, 20);

      const completedTransactions: Transaction[] = stellarTxs.map((tx: any) => ({
        id: tx.id || tx.hash,
        type: (tx.from === wallet.publicKey ? 'send' : 'receive') as 'send' | 'receive',
        amount: parseFloat(tx.amount || '0'),
        recipient: tx.to || 'Unknown',
        sender: tx.from || 'Unknown',
        timestamp: tx.timestamp,
        status: 'completed',
        mode: 'online',
        txHash: tx.hash,
        memo: tx.memo
      }));

      // Filter out pending transactions that are already completed
      // (Deduplication based on ID matching which is often used for tracking)
      const uniquePending = pendingTransactions.filter(p =>
        !completedTransactions.some(c => c.id === p.id || c.txHash === p.id)
      );

      // Combine pending, deployments, and completed transactions
      const allTransactions = [...uniquePending, ...deploymentTxs, ...completedTransactions];
      setTransactions(allTransactions.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#14F195';
      case 'pending': return '#FFA500';
      case 'syncing': return '#00D4FF';
      case 'failed': return '#FF6B9D';
      default: return '#888';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    if (filter === 'pending') return tx.status === 'pending' || tx.status === 'syncing';
    if (filter === 'completed') return tx.status === 'completed';
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Transaction History</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'completed' && styles.filterButtonActive]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list}>
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>📭</Text>
            <Text style={styles.emptyStateTitle}>No Transactions Yet</Text>
            <Text style={styles.emptyStateText}>
              Your transaction history will appear here once you start sending or receiving XLM.
            </Text>
          </View>
        ) : (
          filteredTransactions.map((tx) => (
            <TouchableOpacity
              key={tx.id}
              style={[
                styles.transactionCard,
                isWebDesktop && styles.transactionCardWeb,
                isWebDesktop && tx.status === 'completed' && styles.completedCardWeb
              ]}
              onPress={() => {
                if (tx.isDeployment && tx.contractId) {
                  Alert.alert(
                    'Smart Contract Deployed',
                    `Contract ID:\n${tx.contractId}\n\nNetwork: Testnet`,
                    [{ text: 'OK' }]
                  );
                } else {
                  onTransactionSelect?.(tx);
                }
              }}
            >
              <View style={[
                styles.transactionIcon,
                { backgroundColor: tx.isDeployment ? 'rgba(153, 69, 255, 0.2)' : (tx.type === 'send' ? '#9945FF' : '#14F195') },
                isWebDesktop && styles.transactionIconWeb
              ]}>
                <Text style={[styles.transactionIconText, isWebDesktop && styles.transactionIconTextWeb]}>
                  {tx.isDeployment ? '🚀' : (tx.type === 'send' ? '↑' : '↓')}
                </Text>
              </View>

              <View style={styles.transactionInfo}>
                <View style={styles.transactionHeader}>
                  <Text style={styles.transactionType}>
                    {tx.sender === 'GAIH3BXP27LYLYM6YS62MOCX57O6L73PWTF57W5X3TCHWMPVXV2F6746' || tx.sender?.startsWith('GAIH3') ? 'Friendbot Funds' : (tx.type === 'send' ? 'Sent to' : 'Received from')}
                  </Text>
                  {tx.mode === 'offline' && (
                    <View style={styles.offlineBadge}>
                      <Text style={styles.offlineBadgeText}>⚡ Offline</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.transactionAddress}>
                  {tx.type === 'send' ? tx.recipient : tx.sender}
                </Text>
                <View style={styles.transactionFooter}>
                  <Text style={styles.transactionTime}>{formatTime(tx.timestamp)}</Text>
                  <View style={styles.transactionFooterRight}>
                    {!isWebDesktop && (
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tx.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(tx.status) }]}>
                          {getStatusText(tx.status)}
                        </Text>
                      </View>
                    )}
                    {tx.txHash && tx.status === 'completed' && (
                      <TouchableOpacity
                        onPress={() => openInExplorer(tx.txHash!)}
                        style={styles.explorerButton}
                      >
                        <Text style={styles.explorerButtonText}>🔗</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.transactionAmount}>
                <Text style={[
                  styles.amountText,
                  { color: tx.type === 'send' ? '#FF6B9D' : '#14F195' }
                ]}>
                  {tx.isDeployment ? 'Deploy' : `${tx.type === 'send' ? '-' : '+'}${tx.amount.toFixed(4)}`}
                </Text>
                <Text style={styles.amountCurrency}>{tx.isDeployment ? '' : 'XLM'}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  filterContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  filterButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(153, 69, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(153, 69, 255, 0.3)',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#9945FF',
  },
  filterText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyStateText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(153, 69, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(153, 69, 255, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIconText: {
    fontSize: 24,
    color: '#000',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionType: {
    color: '#888',
    fontSize: 12,
    marginRight: 8,
  },
  offlineBadge: {
    backgroundColor: '#00D4FF20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  offlineBadgeText: {
    color: '#00D4FF',
    fontSize: 10,
    fontWeight: '600',
  },
  transactionAddress: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  transactionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionTime: {
    color: '#666',
    fontSize: 12,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  explorerButton: {
    padding: 4,
  },
  explorerButtonText: {
    fontSize: 16,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  amountCurrency: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  completedCardWeb: {
    borderColor: '#14F195',
    borderWidth: 1.5,
    backgroundColor: 'rgba(20, 241, 149, 0.05)',
  },
  transactionCardWeb: {
    padding: 10,
    marginBottom: 8,
    borderRadius: 12,
  },
  transactionIconWeb: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  transactionIconTextWeb: {
    fontSize: 18,
  },
});
