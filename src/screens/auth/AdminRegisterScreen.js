import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { TextInput, Button, Card, Paragraph } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { verifyAdminInviteCode } from '../../services/adminService';

const AdminRegisterScreen = ({ navigation, route }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true);
  
  const { signUp } = useAuth();
  
  const handleRegister = async () => {
    // Validate inputs
    // if (!name || !email || !password || !confirmPassword || !inviteCode) {
    //   Alert.alert('Error', 'Please fill in all fields');
    //   return;
    // }
    
    // if (password !== confirmPassword) {
    //   Alert.alert('Error', 'Passwords do not match');
    //   return;
    // }
    
    // if (password.length < 6) {
    //   Alert.alert('Error', 'Password should be at least 6 characters');
    //   return;
    // }
    
    try {
      setLoading(true);
      // setVerifying(true);
      
      // First verify the invite code
      // const isValid = await verifyAdminInviteCode(inviteCode, email);
      
      // if (!isValid) {
      //   Alert.alert(
      //     'Invalid Invite Code',
      //     'The invite code you entered is invalid or has expired. Please contact the library management for a valid code.'
      //   );
      //   setVerifying(false);
      //   setLoading(false);
      //   return;
      // }
      
      // setVerifying(false);
      
      // Create the admin user
      // await signUp(email, password, name, 'admin', phone);
      await signUp('supertest@test.com', 'tup5ab8e', 'super tester', 'admin', '09178181996');
      

      console.log('Admin registration complete - navigating directly to Admin screen');
      
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Admin' }],
        });
      }, 500); 
     
    } catch (error) {
      setLoading(false); 
      Alert.alert('Registration Failed', error.message);
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
            <ActivityIndicator size="large" color="#FF9500" />
            <Text style={styles.loadingText}>
              {verifying ? 'Verifying invitation code...' : 'Creating your admin account...'}
            </Text>
          </View>
        </View>
      </Modal>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#333333" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Create Admin Account</Text>
        </View>
        
        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.infoHeader}>
              <MaterialCommunityIcons name="shield-account" size={24} color="#FF9500" />
              <Text style={styles.infoTitle}>Admin Registration</Text>
            </View>
            <Paragraph style={styles.infoParagraph}>
              This registration is only for library administrators. You'll need a valid invite code 
              that was sent to your email. If you're a borrower, please use the Borrower Registration.
            </Paragraph>
          </Card.Content>
        </Card>
        
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
          
          <TextInput
            label="Admin Invite Code"
            value={inviteCode}
            onChangeText={setInviteCode}
            mode="outlined"
            style={[styles.input, styles.inviteInput]}
            autoCapitalize="none"
            left={<TextInput.Icon icon="key" />}
          />
          
          <Text style={styles.inviteNote}>
            *The invite code was sent to your email by the library management
          </Text>
          
          <Button 
            mode="contained" 
            onPress={handleRegister}
            style={styles.button}
            loading={loading}
            disabled={loading}
          >
            {verifying ? 'Verifying Code...' : 'Create Admin Account'}
          </Button>
          
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Log In</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>Are you a borrower? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('BorrowerRegister')}>
              <Text style={styles.switchLink}>Register as Borrower</Text>
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
    color: '#FF9500',
    fontWeight: '600',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: Platform.OS === 'ios' ? 40 : 20,
  },
  backButton: {
    marginRight: 10,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
  },
  infoCard: {
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: '#FFF9EF',
    borderColor: '#FF9500',
    borderWidth: 1,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoTitle: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  infoParagraph: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 15,
  },
  inviteInput: {
    backgroundColor: '#F9F9F9',
    borderColor: '#FF9500',
  },
  inviteNote: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
    marginTop: -10,
    marginBottom: 20,
    paddingLeft: 5,
  },
  button: {
    padding: 5,
    backgroundColor: '#FF9500',
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  switchText: {
    color: '#333333',
  },
  switchLink: {
    color: '#4A90E2',
    fontWeight: 'bold',
  },
});

export default AdminRegisterScreen;