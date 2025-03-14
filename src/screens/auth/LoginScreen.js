import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Alert
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
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    try {
      setLoading(true);
      await signIn(email, password);
      // Navigation will be handled by the AppNavigator based on auth state
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
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
});

export default LoginScreen;