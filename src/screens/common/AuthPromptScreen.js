import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity
} from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';

const AuthPromptScreen = ({ navigation }) => {
  const navigateToAuth = (screen) => {
    // Navigate to the auth stack and specified screen
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          { 
            name: 'Auth',
            state: {
              routes: [{ name: screen }]
            }
          }
        ],
      })
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="account-lock" size={80} color="#4A90E2" />
      </View>
      
      <Text style={styles.title}>Sign In Required</Text>
      
      <Text style={styles.description}>
        You need to sign in or create an account to access your profile and 
        borrowing features.
      </Text>
      
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          style={styles.signInButton}
          onPress={() => navigateToAuth('Login')}
        >
          Sign In
        </Button>
        
        <Button
          mode="outlined"
          style={styles.registerButton}
          onPress={() => navigateToAuth('Register')}
        >
          Create Account
        </Button>
      </View>
      
      <TouchableOpacity 
        style={styles.skipButton}
        onPress={() => navigation.navigate('HomeTab')}
      >
        <Text style={styles.skipText}>
          Continue Browsing
        </Text>
      </TouchableOpacity>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          As a guest, you can still browse the catalog, but you'll need an 
          account to borrow books or access personalized features.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333333',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666666',
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  signInButton: {
    marginBottom: 15,
    backgroundColor: '#4A90E2',
    padding: 5,
  },
  registerButton: {
    borderColor: '#4A90E2',
    padding: 5,
  },
  skipButton: {
    marginTop: 10,
    padding: 10,
  },
  skipText: {
    color: '#666666',
    fontSize: 16,
  },
  infoContainer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  }
});

export default AuthPromptScreen;