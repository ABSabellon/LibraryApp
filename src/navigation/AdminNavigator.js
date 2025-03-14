import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Import admin screens
import DashboardScreen from '../screens/admin/DashboardScreen';
import BookListScreen from '../screens/admin/BookListScreen';
import AddBookScreen from '../screens/admin/AddBookScreen';
import BookDetailsScreen from '../screens/admin/BookDetailsScreen';
import BorrowersScreen from '../screens/admin/BorrowersScreen';
import ReportsScreen from '../screens/admin/ReportsScreen';
import ScanBookScreen from '../screens/admin/ScanBookScreen';
import GenerateQRScreen from '../screens/admin/GenerateQRScreen';
import ProfileScreen from '../screens/admin/ProfileScreen';
import ManageInvitesScreen from '../screens/admin/ManageInvitesScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigators for each tab
const DashboardStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="AdminDashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
  </Stack.Navigator>
);

const BooksStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="BookList" component={BookListScreen} options={{ title: 'Library Books' }} />
    <Stack.Screen name="AddBook" component={AddBookScreen} options={{ title: 'Add New Book' }} />
    <Stack.Screen name="BookDetails" component={BookDetailsScreen} options={{ title: 'Book Details' }} />
    <Stack.Screen name="ScanBook" component={ScanBookScreen} options={{ title: 'Scan Book' }} />
    <Stack.Screen name="GenerateQR" component={GenerateQRScreen} options={{ title: 'Generate QR Code' }} />
  </Stack.Navigator>
);

const BorrowersStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Borrowers" component={BorrowersScreen} options={{ title: 'Borrowers' }} />
  </Stack.Navigator>
);

const ReportsStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports & Analytics' }} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="AdminProfile" component={ProfileScreen} options={{ title: 'My Profile' }} />
    <Stack.Screen name="ManageInvites" component={ManageInvitesScreen} options={{ title: 'Admin Invitations' }} />
  </Stack.Navigator>
);

const AdminNavigator = () => {
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
        name="DashboardTab" 
        component={DashboardStack} 
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="BooksTab" 
        component={BooksStack} 
        options={{
          tabBarLabel: 'Books',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="book-open-variant" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="BorrowersTab" 
        component={BorrowersStack} 
        options={{
          tabBarLabel: 'Borrowers',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="ReportsTab" 
        component={ReportsStack} 
        options={{
          tabBarLabel: 'Reports',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-bar" color={color} size={size} />
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

export default AdminNavigator;