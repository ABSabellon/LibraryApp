import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Button, Card, Title, Paragraph, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { verifyOTP, borrowBook, sendOTPViaEmail, sendOTPViaSMS, generateOTP, storeOTP } from '../../services/borrowService';
import { getBookById } from '../../services/bookService';

const OtpVerificationScreen = ({ navigation, route }) => {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  
  // Refs for OTP input fields
  const otpInputs = useRef([]);
  
  // Timer ref to clear on unmount
  const timerRef = useRef(null);
  
  // Get data from route params
  const { 
    bookId, 
    borrowerDetails, 
    otpMethod,
    otpDestination 
  } = route.params || {};
  
  // Load book data
  useEffect(() => {
    const fetchBook = async () => {
      if (!bookId) {
        navigation.goBack();
        return;
      }
      
      try {
        setLoading(true);
        const bookData = await getBookById(bookId);
        
        if (bookData) {
          setBook(bookData);
        } else {
          Alert.alert('Error', 'Book not found');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error loading book:', error);
        Alert.alert('Error', 'Failed to load book details');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    
    fetchBook();
    
    // Start the timer for OTP expiration
    startTimer();
    
    // Clean up timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [bookId]);
  
  // Format time remaining
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Start countdown timer
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  // Handle OTP input change
  const handleOtpChange = (text, index) => {
    // Only allow digits
    const digit = text.replace(/[^0-9]/g, '');
    
    // Update the OTP array
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    
    // Auto-advance to next input or submit if last
    if (digit && index < 5) {
      otpInputs.current[index + 1].focus();
    } else if (digit && index === 5) {
      // Auto-submit if all filled
      if (newOtp.every(d => d)) {
        handleVerifyOtp(newOtp.join(''));
      }
    }
  };
  
  // Handle backspace key for OTP inputs
  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      otpInputs.current[index - 1].focus();
    }
  };
  
  // Handle OTP verification
  const handleVerifyOtp = async (otpCode = otp.join('')) => {
    if (otpCode.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter all 6 digits of the verification code');
      return;
    }
    
    if (timeLeft === 0) {
      Alert.alert('OTP Expired', 'The verification code has expired. Please request a new one.');
      return;
    }
    
    try {
      setVerifying(true);
      
      // Verify OTP in Firebase
      const isValid = await verifyOTP(borrowerDetails.email, otpCode);
      
      if (isValid) {
        // Borrow the book
        await borrowBook(bookId, borrowerDetails);
        
        // Show success alert and navigate
        Alert.alert(
          'Borrow Successful',
          `You have successfully borrowed "${book.title}". Please return it within 14 days.`,
          [
            { 
              text: 'View My Books', 
              onPress: () => navigation.navigate('MyBooksTab')
            },
            { 
              text: 'OK', 
              onPress: () => navigation.navigate('HomeTab')
            }
          ]
        );
      } else {
        Alert.alert(
          'Invalid OTP',
          'The verification code you entered is incorrect. Please try again.'
        );
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      Alert.alert('Error', 'Failed to verify the OTP. Please try again.');
    } finally {
      setVerifying(false);
    }
  };
  
  // Handle OTP resend
  const handleResendOtp = async () => {
    try {
      setResending(true);
      
      // Generate new OTP
      const newOtp = generateOTP();
      
      // Store new OTP in Firebase
      await storeOTP(borrowerDetails.email, borrowerDetails.phone, newOtp);
      
      // Send new OTP
      let otpSent = false;
      
      if (otpMethod === 'email') {
        try {
          const emailSent = await sendOTPViaEmail(borrowerDetails.email, newOtp);
          if (emailSent) {
            otpSent = true;
          }
        } catch (emailError) {
          console.error('Failed to send OTP via email:', emailError);
        }
      } else if (otpMethod === 'phone' && borrowerDetails.phone) {
        try {
          const smsSent = await sendOTPViaSMS(borrowerDetails.phone, newOtp);
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
          'We could not send the verification code. Please check your contact details or try again later.'
        );
        return;
      }
      
      // Reset timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setTimeLeft(300);
      startTimer();
      
      // Clear OTP inputs
      setOtp(['', '', '', '', '', '']);
      
      Alert.alert('OTP Sent', 'A new verification code has been sent.');
    } catch (error) {
      console.error('Error resending OTP:', error);
      Alert.alert('Error', 'Failed to send a new verification code. Please try again.');
    } finally {
      setResending(false);
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
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Verify Your Identity</Text>
        </View>
        
        <Card style={styles.infoCard}>
          <Card.Content>
            <Title style={styles.bookTitle}>{book.title}</Title>
            <Paragraph style={styles.bookAuthor}>by {book.author}</Paragraph>
            
            <View style={styles.instructionContainer}>
              <MaterialCommunityIcons 
                name={otpMethod === 'email' ? 'email-outline' : 'cellphone'} 
                size={24} 
                color="#4A90E2" 
                style={styles.instructionIcon}
              />
              <View style={styles.instructionTextContainer}>
                <Text style={styles.instructionTitle}>Verification Code Sent</Text>
                <Text style={styles.instructionText}>
                  We've sent a 6-digit verification code to your {otpMethod === 'email' ? 'email' : 'phone number'}:
                </Text>
                <Text style={styles.destinationText}>
                  {otpMethod === 'email' 
                    ? borrowerDetails.email.replace(/(.{3})(.*)(@.*)/, '$1***$3')
                    : borrowerDetails.phone.replace(/(\d{3})(\d+)(\d{2})/, '$1****$3')}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
        
        <View style={styles.otpContainer}>
          <Text style={styles.otpTitle}>Enter Verification Code</Text>
          
          <View style={styles.otpInputsContainer}>
            {otp.map((digit, index) => (
              <RNTextInput
                key={index}
                style={styles.otpInput}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                ref={ref => otpInputs.current[index] = ref}
                selectionColor="#4A90E2"
              />
            ))}
          </View>
          
          <View style={styles.timerContainer}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={timeLeft === 0 ? "#FF3B30" : "#666666"} />
            <Text style={[styles.timerText, timeLeft === 0 && styles.expiredTimerText]}>
              {timeLeft === 0 ? "Code expired" : `Code expires in ${formatTimeLeft()}`}
            </Text>
          </View>
          
          <Button
            mode="contained"
            onPress={() => handleVerifyOtp()}
            style={styles.verifyButton}
            loading={verifying}
            disabled={verifying || timeLeft === 0 || !otp.every(d => d)}
          >
            Verify & Borrow
          </Button>
          
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            <TouchableOpacity 
              onPress={handleResendOtp}
              disabled={resending || timeLeft > 270} // Allow resend after 30 seconds
            >
              <Text style={[
                styles.resendLink,
                (resending || timeLeft > 270) && styles.disabledResendLink
              ]}>
                {resending ? 'Sending...' : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Cancel and return</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    padding: 20,
    flex: 1,
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
  infoCard: {
    marginBottom: 20,
    borderRadius: 10,
    elevation: 2,
  },
  bookTitle: {
    fontSize: 18,
  },
  bookAuthor: {
    color: '#666666',
    marginBottom: 15,
  },
  instructionContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F7FF',
    padding: 15,
    borderRadius: 8,
  },
  instructionIcon: {
    marginRight: 15,
  },
  instructionTextContainer: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  instructionText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  destinationText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 5,
  },
  otpContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    elevation: 2,
  },
  otpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
    textAlign: 'center',
  },
  otpInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  otpInput: {
    width: 45,
    height: 50,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666666',
  },
  expiredTimerText: {
    color: '#FF3B30',
  },
  verifyButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 5,
    marginBottom: 15,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#666666',
  },
  resendLink: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  disabledResendLink: {
    color: '#CCCCCC',
  },
  backButton: {
    marginTop: 20,
    alignSelf: 'center',
  },
  backButtonText: {
    fontSize: 14,
    color: '#666666',
    textDecorationLine: 'underline',
  },
});

export default OtpVerificationScreen;