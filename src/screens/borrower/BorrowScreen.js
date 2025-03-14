import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { TextInput, Button, Card, Paragraph, Title, Dialog, Portal } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { getBookById } from '../../services/bookService';
import { generateOTP, storeOTP, sendOTPViaEmail, sendOTPViaSMS } from '../../services/borrowService';
import { checkUserExists } from '../../services/userService';

const BorrowScreen = ({ navigation, route }) => {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [pendingBorrowValues, setPendingBorrowValues] = useState(null);
  const [checkingUser, setCheckingUser] = useState(false);
  const { currentUser, getUserProfile } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  
  // Get book ID from route params
  const bookId = route.params?.bookId;
  
  // Validation schema
  const BorrowerSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    phone: Yup.string().matches(/^[0-9+\s-]+$/, 'Invalid phone number'),
  });
  
  // Load book data and user profile
  useEffect(() => {
    const fetchData = async () => {
      if (!bookId) {
        navigation.goBack();
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch book details
        const bookData = await getBookById(bookId);
        if (!bookData) {
          Alert.alert('Error', 'Book not found');
          navigation.goBack();
          return;
        }
        
        if (bookData.status !== 'available') {
          Alert.alert('Book Unavailable', 'This book is currently not available for borrowing');
          navigation.goBack();
          return;
        }
        
        setBook(bookData);
        
        // Fetch user profile if logged in
        if (currentUser) {
          const profile = await getUserProfile(currentUser.uid);
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load data');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [bookId, currentUser]);
  
  // Handle the signup prompt response
  const handleSignupPrompt = (agree) => {
    setShowSignupPrompt(false);
    
    if (agree) {
      // Navigate to the registration screen with pre-filled data
      navigation.navigate('Auth', { 
        screen: 'Register',
        params: {
          initialValues: pendingBorrowValues
        }
      });
    }
    
    // Clear pending values if they disagree
    setPendingBorrowValues(null);
  };

  // Proceed with borrowing after user check
  const proceedWithBorrowing = async (values) => {
    try {
      // Generate OTP
      const otp = generateOTP();
      
      // Store OTP in Firebase
      await storeOTP(values.email, values.phone, otp);
      
      // Send OTP
      let otpSent = false;
      
      // Try email first
      if (values.email) {
        try {
          const emailSent = await sendOTPViaEmail(values.email, otp);
          if (emailSent) {
            otpSent = true;
          }
        } catch (emailError) {
          console.error('Failed to send OTP via email:', emailError);
        }
      }
      
      // Try SMS as fallback
      if (!otpSent && values.phone) {
        try {
          const smsSent = await sendOTPViaSMS(values.phone, otp);
          if (smsSent) {
            otpSent = true;
          }
        } catch (smsError) {
          console.error('Failed to send OTP via SMS:', smsError);
        }
      }
      
      if (!otpSent) {
        Alert.alert(
          'OTP Delivery Failed',
          'We could not send the verification code. Please check your email and phone number or try again later.'
        );
        return;
      }
      
      // Navigate to OTP verification screen
      navigation.navigate('OtpVerification', {
        bookId: book.id,
        borrowerDetails: values,
        otpMethod: values.email ? 'email' : 'phone',
        otpDestination: values.email || values.phone
      });
    } catch (error) {
      console.error('Error in borrowing process:', error);
      Alert.alert('Error', 'Failed to initiate book borrowing. Please try again.');
    }
  };
  
  // Handle form submission
  const handleBorrow = async (values) => {
    try {
      setSubmitting(true);
      setCheckingUser(true);
      
      // Check if user is registered in our system
      const userExists = await checkUserExists(values.email);
      
      if (!userExists && !currentUser) {
        // Store values for later use
        setPendingBorrowValues(values);
        
        // Show signup prompt
        setShowSignupPrompt(true);
        return;
      }
      
      // If user exists or is logged in, proceed with borrowing
      await proceedWithBorrowing(values);
      
    } catch (error) {
      console.error('Error checking user or generating OTP:', error);
      Alert.alert('Error', 'Failed to initiate book borrowing. Please try again.');
    } finally {
      setSubmitting(false);
      setCheckingUser(false);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
  
  // Initial values for the form
  const initialValues = {
    name: userProfile?.name || '',
    email: userProfile?.email || '',
    phone: userProfile?.phone || '',
  };
  
  return (
    <>
      {/* Signup prompt dialog */}
      <Portal>
        <Dialog
          visible={showSignupPrompt}
          onDismiss={() => handleSignupPrompt(false)}
        >
          <Dialog.Title>Create an Account</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              To borrow books from our library, you need to create an account. Would you like to sign up now?
            </Paragraph>
            <Paragraph style={{ marginTop: 8, fontStyle: 'italic' }}>
              Your provided details will be used to create your account.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => handleSignupPrompt(false)}>Cancel</Button>
            <Button onPress={() => handleSignupPrompt(true)}>Sign Up</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Borrow Book</Text>
          </View>
          
          <Card style={styles.bookCard}>
            <Card.Content>
              <Title style={styles.bookTitle}>{book.title}</Title>
              <Paragraph style={styles.bookAuthor}>by {book.author}</Paragraph>
              
              {book.isbn && (
                <View style={styles.isbnContainer}>
                  <Text style={styles.isbnText}>ISBN: {book.isbn}</Text>
                </View>
              )}
            </Card.Content>
          </Card>
          
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Your Information</Text>
            <Text style={styles.instruction}>
              Please provide your details below. We'll send a verification code to complete your borrowing request.
            </Text>
            
            <Formik
              initialValues={initialValues}
              validationSchema={BorrowerSchema}
              onSubmit={handleBorrow}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <View>
                  <TextInput
                    label="Full Name *"
                    value={values.name}
                    onChangeText={handleChange('name')}
                    onBlur={handleBlur('name')}
                    mode="outlined"
                    style={styles.input}
                    error={touched.name && errors.name}
                    left={<TextInput.Icon icon="account" />}
                  />
                  {touched.name && errors.name && (
                    <Text style={styles.errorText}>{errors.name}</Text>
                  )}
                  
                  <TextInput
                    label="Email Address *"
                    value={values.email}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={touched.email && errors.email}
                    left={<TextInput.Icon icon="email" />}
                  />
                  {touched.email && errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}
                  
                  <TextInput
                    label="Phone Number"
                    value={values.phone}
                    onChangeText={handleChange('phone')}
                    onBlur={handleBlur('phone')}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="phone-pad"
                    error={touched.phone && errors.phone}
                    left={<TextInput.Icon icon="phone" />}
                  />
                  {touched.phone && errors.phone && (
                    <Text style={styles.errorText}>{errors.phone}</Text>
                  )}
                  
                  <Text style={styles.noteText}>
                    * Email is required for sending verification code and borrowing receipts
                  </Text>
                  
                  <Button
                    mode="contained"
                    onPress={handleSubmit}
                    style={styles.submitButton}
                    loading={submitting || checkingUser}
                    disabled={submitting || checkingUser}
                  >
                    {checkingUser ? 'Checking...' : 'Continue to Verification'}
                  </Button>
                </View>
              )}
            </Formik>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666666',
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  bookCard: {
    marginBottom: 20,
    borderRadius: 10,
    elevation: 2,
  },
  bookTitle: {
    fontSize: 18,
  },
  bookAuthor: {
    color: '#666666',
  },
  isbnContainer: {
    marginTop: 10,
  },
  isbnText: {
    fontSize: 14,
    color: '#666666',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  instruction: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 15,
    lineHeight: 20,
  },
  input: {
    marginBottom: 15,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
  },
  noteText: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 5,
  },
});

export default BorrowScreen;