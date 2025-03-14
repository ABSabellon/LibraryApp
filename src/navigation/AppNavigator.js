import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';

// Import navigators
import AuthNavigator from './AuthNavigator';
import AdminNavigator from './AdminNavigator';
import BorrowerNavigator from './BorrowerNavigator';

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
          // Not authenticated - show auth screens
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          // Authenticated - show app screens based on user role
          userRole === 'admin' ? (
            <Stack.Screen name="Admin" component={AdminNavigator} />
          ) : (
            <Stack.Screen name="Borrower" component={BorrowerNavigator} />
          )
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;