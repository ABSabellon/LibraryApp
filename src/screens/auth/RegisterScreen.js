import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const RegisterScreen = ({ navigation, route }) => {
  // Check if we were passed initial values from borrowing flow
  const initialValues = route.params?.initialValues || {};
  
  const [name, setName] = useState(initialValues.name || '');
  const [email, setEmail] = useState(initialValues.email || '');
  const [phone, setPhone] = useState(initialValues.phone || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true);
  
  const { signUp } = useAuth();
  
  // If coming from borrowing flow, navigate back to book after registration
  const navigateAfterRegister = () => {
    if (initialValues.bookId) {
      // Navigate back to the borrowing flow
      navigation.navigate('Borrower', {
        screen: 'Borrow',
        params: { bookId: initialValues.bookId }
      });
    } else {
      // Standard navigation to Login
      navigation.navigate('Login');
    }
  };

  const handleRegister = async () => {
    // Validate inputs
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      Alert.alert('Error', 'Password should be at least 6 characters');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create the user - always as a borrower
      await signUp(email, password, name, 'borrower', phone);
      
      Alert.alert(
        'Success',
        'Account created successfully',
        [{ text: 'OK', onPress: navigateAfterRegister }]
      );
    } catch (error) {
      Alert.alert('Registration Failed', error.message);
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
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#333333" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Create Account</Text>
        </View>
        
        <View style={styles.formContainer}>
          <TextInput
            label="Full Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            autoCapitalize="words"
            left={<TextInput.Icon icon="account" />}
          />
          
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
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            mode="outlined"
            style={styles.input}
            keyboardType="phone-pad"
            left={<TextInput.Icon icon="phone" />}
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
          
          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            style={styles.input}
            secureTextEntry={secureConfirmTextEntry}
            autoCapitalize="none"
            left={<TextInput.Icon icon="lock-check" />}
            right={
              <TextInput.Icon 
                icon={secureConfirmTextEntry ? "eye" : "eye-off"}
                onPress={() => setSecureConfirmTextEntry(!secureConfirmTextEntry)} 
              />
            }
          />
          
          <View style={styles.infoContainer}>
            <MaterialCommunityIcons name="information-outline" size={16} color="#666666" />
            <Text style={styles.infoText}>
              By registering, you'll be able to borrow books from our library
            </Text>
          </View>
          
          <Button 
            mode="contained" 
            onPress={handleRegister}
            style={styles.button}
            loading={loading}
            disabled={loading}
          >
            Create Account
          </Button>
          
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Log In</Text>
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
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: Platform.OS === 'ios' ? 40 : 20,
  },
  backButton: {
    marginRight: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 15,
  },
  infoContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoText: {
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  button: {
    padding: 5,
    backgroundColor: '#4A90E2',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#333333',
  },
  loginLink: {
    color: '#4A90E2',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;