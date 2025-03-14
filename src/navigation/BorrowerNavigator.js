import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Import borrower screens
import HomeScreen from '../screens/borrower/HomeScreen';
import CatalogScreen from '../screens/borrower/CatalogScreen';
import BookDetailsScreen from '../screens/borrower/BookDetailsScreen';
import BorrowScreen from '../screens/borrower/BorrowScreen';
import ScanQRScreen from '../screens/borrower/ScanQRScreen';
import MyBooksScreen from '../screens/borrower/MyBooksScreen';
import ProfileScreen from '../screens/borrower/ProfileScreen';
import OtpVerificationScreen from '../screens/borrower/OtpVerificationScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigators for each tab
const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="BorrowerHome" component={HomeScreen} options={{ title: 'Home' }} />
  </Stack.Navigator>
);

const CatalogStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Catalog" component={CatalogScreen} options={{ title: 'Book Catalog' }} />
    <Stack.Screen name="BorrowerBookDetails" component={BookDetailsScreen} options={{ title: 'Book Details' }} />
    <Stack.Screen name="Borrow" component={BorrowScreen} options={{ title: 'Borrow Book' }} />
    <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} options={{ title: 'Verify OTP' }} />
  </Stack.Navigator>
);

const ScanStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="ScanQR" component={ScanQRScreen} options={{ title: 'Scan QR Code' }} />
    <Stack.Screen name="ScanBookDetails" component={BookDetailsScreen} options={{ title: 'Book Details' }} />
    <Stack.Screen name="ScanBorrow" component={BorrowScreen} options={{ title: 'Borrow Book' }} />
    <Stack.Screen name="ScanOtpVerification" component={OtpVerificationScreen} options={{ title: 'Verify OTP' }} />
  </Stack.Navigator>
);

const MyBooksStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="MyBooks" component={MyBooksScreen} options={{ title: 'My Books' }} />
    <Stack.Screen name="MyBookDetails" component={BookDetailsScreen} options={{ title: 'Book Details' }} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="BorrowerProfile" component={ProfileScreen} options={{ title: 'My Profile' }} />
  </Stack.Navigator>
);

const BorrowerNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 3,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeStack} 
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="CatalogTab" 
        component={CatalogStack} 
        options={{
          tabBarLabel: 'Catalog',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="book-open-variant" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="ScanTab" 
        component={ScanStack} 
        options={{
          tabBarLabel: 'Scan',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="qrcode-scan" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="MyBooksTab" 
        component={MyBooksStack} 
        options={{
          tabBarLabel: 'My Books',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bookshelf" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileStack} 
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BorrowerNavigator;