import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import BluetoothPaymentScreen from '../screens/BluetoothPaymentScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SolustAIScreen from '../screens/SolustAIScreen';

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: '#1a1a2e',
            borderTopColor: '#2a2a3e',
          },
          tabBarActiveTintColor: '#00d4aa',
          tabBarInactiveTintColor: '#888',
          headerStyle: {
            backgroundColor: '#1a1a2e',
          },
          headerTintColor: '#fff',
        }}
      >
        <Tab.Screen
          name="Transfer"
          component={BluetoothPaymentScreen}
          options={{
            tabBarIcon: () => '🔄',
            title: 'Transfer'
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            tabBarIcon: () => '📜',
            title: 'History'
          }}
        />
        <Tab.Screen
          name="SolustAI"
          component={SolustAIScreen}
          options={{
            tabBarIcon: () => '🤖',
            title: 'Solust AI'
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;