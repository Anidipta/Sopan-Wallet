import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { WalletScreen } from './WalletScreen';
import { SendScreen } from './SendScreen';
import { ReceiveScreen } from './ReceiveScreen';
import BluetoothPaymentScreen from './BluetoothPaymentScreen';
import BluetoothDevicesScreen from './BluetoothDevicesScreen';
import { HistoryScreen } from './HistoryScreen';
import { ProfileScreen } from './ProfileScreen';
import { ScanQRScreen } from './ScanQRScreen';
import { SettingsScreen } from './SettingsScreen';
import { TransactionDetailsScreen } from './TransactionDetailsScreen';
import { NotificationService } from '../services/NotificationService';

interface HomeScreenProps {
  onLogout: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onLogout }) => {
  const [currentScreen, setCurrentScreen] = useState<string>('wallet');
  const [scannedAddress, setScannedAddress] = useState<string>('');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  const notifications = NotificationService.getInstance();

  useEffect(() => {
    // Request notification permissions on app start
    notifications.requestPermissions();
  }, []);

  const handleQRScanned = (address: string) => {
    setScannedAddress(address);
    setCurrentScreen('send');
  };

  const handleTransactionSelected = (transaction: any) => {
    setSelectedTransaction(transaction);
    setCurrentScreen('transactionDetails');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'send':
        return (
          <SendScreen 
            onBack={() => {
              setScannedAddress(''); // Clear scanned address when going back
              setCurrentScreen('wallet');
            }} 
            onScanQR={() => setCurrentScreen('scanqr')}
            initialRecipient={scannedAddress}
          />
        );
      case 'receive':
        return <ReceiveScreen onBack={() => setCurrentScreen('wallet')} />;
      case 'scanqr':
        return (
          <ScanQRScreen 
            onBack={() => setCurrentScreen('send')} 
            onScanned={handleQRScanned}
          />
        );
      case 'bluetooth':
        return <BluetoothPaymentScreen onBack={() => setCurrentScreen('wallet')} onManageDevices={() => setCurrentScreen('bluetoothDevices')} />;
      case 'bluetoothDevices':
        return <BluetoothDevicesScreen onBack={() => setCurrentScreen('bluetooth')} />;
      case 'history':
        return (
          <HistoryScreen 
            onBack={() => setCurrentScreen('wallet')}
            onTransactionSelect={handleTransactionSelected}
          />
        );
      case 'profile':
        return <ProfileScreen onBack={() => setCurrentScreen('wallet')} onLogout={onLogout} />;
      case 'settings':
        return <SettingsScreen onBack={() => setCurrentScreen('wallet')} />;
      case 'transactionDetails':
        return (
          <TransactionDetailsScreen 
            transaction={selectedTransaction}
            onBack={() => setCurrentScreen('history')}
          />
        );
      case 'wallet':
      default:
        return <WalletScreen onNavigate={setCurrentScreen} />;
    }
  };

  return <View style={{ flex: 1 }}>{renderScreen()}</View>;
};
