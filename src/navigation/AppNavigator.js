import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';

// Import navigators
import AuthNavigator from './AuthNavigator';
import AdminNavigator from './AdminNavigator';
import BorrowerNavigator from './BorrowerNavigator';
import GuestNavigator from './GuestNavigator';

// Import loading screen
import LoadingScreen from '../screens/common/LoadingScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { currentUser, loading, userRole } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!currentUser ? (
          // Guest mode - show guest screens with the option to log in/register
          <Stack.Screen name="Guest" component={GuestNavigator} />
        ) : (
          // Authenticated - show app screens based on user role
          userRole === 'admin' || userRole === 'superadmin' ? (
            <Stack.Screen name="Admin" component={AdminNavigator} />
          ) : (
            <Stack.Screen name="Borrower" component={BorrowerNavigator} />
          )
        )}
        {/* Auth Navigator is now a separate route that can be navigated to */}
        <Stack.Screen name="Auth" component={AuthNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;