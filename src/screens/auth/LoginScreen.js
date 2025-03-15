import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  
  const { signIn, error } = useAuth();
  
  const handleLogin = async () => {
    // For testing, use hardcoded credentials
   
    // if (!email || !password) {
    //   Alert.alert('Error', 'Please fill in all fields');
    //   return;
    // }
    
    try {
      setLoading(true);
      
      // await signIn(email, password);

     const user = await signIn('supertest@test.com', 'tup5ab8e');

      if(user.profile.role === 'admin'){
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Admin' }],
          });
        }, 500);
      }else{
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Borrower' }],
          });
        }, 500);
      }
    } catch (error) {
      setLoading(false); // Only hide loader on error
      Alert.alert('Login Failed', error.message);
    }
  };
  
  // Use effect to cleanup loading state when component unmounts
  useEffect(() => {
    return () => {
      // Reset loading state when component unmounts
      setLoading(false);
    };
  }, []);
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Loading overlay */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={loading}
      >
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Logging in...</Text>
          </View>
        </View>
      </Modal>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo}
            // If you don't have this image, replace with the code below:
            // The following fallback will be used if the image is not found
            onError={(e) => {
              // We'll just use an icon as fallback
              e.target = null;
            }}
          />
          {/* Fallback icon in case image is not available */}
          {!require('../../assets/logo.png') && (
            <MaterialCommunityIcons name="book-open-page-variant" size={80} color="#4A90E2" />
          )}
          <Text style={styles.appName}>Library App</Text>
        </View>
        
        <View style={styles.formContainer}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email" />}
          />
          
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            style={styles.input}
            secureTextEntry={secureTextEntry}
            autoCapitalize="none"
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon 
                icon={secureTextEntry ? "eye" : "eye-off"}
                onPress={() => setSecureTextEntry(!secureTextEntry)} 
              />
            }
          />
          
          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
          
          <Button 
            mode="contained" 
            onPress={handleLogin}
            style={styles.button}
            loading={loading}
            disabled={loading}
          >
            Log In
          </Button>
          
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.adminLinkContainer}
            onPress={() => navigation.navigate('AdminRegister')}
          >
            <Text style={styles.adminLink}>Admin Registration</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 10,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 15,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#4A90E2',
  },
  button: {
    padding: 5,
    backgroundColor: '#4A90E2',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#333333',
  },
  registerLink: {
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  adminLinkContainer: {
    marginTop: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminLink: {
    color: '#999999',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;