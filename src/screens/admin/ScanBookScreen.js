import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getBookByBarcode, getBookByISBN, getBookById } from '../../services/bookService';

const ScanBookScreen = ({ navigation, route }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [isbnInput, setIsbnInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraRef, setCameraRef] = useState(null);
  
  const returnToAddBook = route.params?.returnToAddBook || false;
  
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert(
          'Camera permission denied',
          'You can still enter ISBNs manually, but camera scanning will not be available.'
        );
      }
    })();
  }, []);
  
  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    
    try {
      // Check if this is a library QR code
      let jsonData;
      try {
        jsonData = JSON.parse(data);
        
        // If this is a library QR code, process it differently
        if (jsonData.type === 'library_book' && jsonData.id) {
          setLoading(true);
          
          try {
            // Get the book from Firestore
            const bookData = await getBookById(jsonData.id);
            
            if (bookData) {
              // Navigate to the book details screen
              navigation.navigate('BookDetails', { bookId: jsonData.id });
              return;
            }
          } catch (error) {
            console.error('Error processing QR code:', error);
          } finally {
            setLoading(false);
          }
        }
      } catch (e) {
        // Not JSON data, continue to process as ISBN
      }
    } catch (error) {
      console.error('Error parsing QR code:', error);
    }
    
    // If not a library QR code or processing failed, handle as ISBN
    setIsbnInput(data);
    await processISBN(data);
  };
  
  const processISBN = async (isbn) => {
    if (!isbn || isbn.trim() === '') {
      Alert.alert('Error', 'Please enter a valid ISBN');
      return;
    }
    
    setLoading(true);
    try {
      const bookData = await getBookByISBN(isbn);
      
      if (bookData) {
        const volumeInfo = bookData.volumeInfo || {};
        const processedBookData = {
          title: volumeInfo.title || '',
          author: (volumeInfo.authors || []).join(', ') || '',
          isbn: isbn,
          publisher: volumeInfo.publisher || '',
          publishedDate: volumeInfo.publishedDate || '',
          description: volumeInfo.description || '',
          pageCount: volumeInfo.pageCount || null,
          categories: volumeInfo.categories || [],
          imageUrl: volumeInfo.imageLinks?.thumbnail || null,
          status: 'available',
          location: '',
          notes: '',
          edition: '',
          openlibrary_url: volumeInfo.openlibrary_url || '',
        };
        
        if (returnToAddBook) {
          navigation.navigate('AddBook', { bookData: processedBookData });
        } else {
          Alert.alert(
            'Book Found',
            `"${processedBookData.title}" by ${processedBookData.author}`,
            [
              { text: 'View Details', onPress: () => navigation.navigate('BookDetails', { bookData: processedBookData, isNewBook: true }) },
              { text: 'Add to Library', onPress: () => navigation.navigate('AddBook', { bookData: processedBookData }) },
              { 
                text: 'Try Again', 
                onPress: () => {
                  setScanned(false);
                  setIsbnInput('');
                } 
              }
            ]
          );
        }
      } else {
        Alert.alert(
          'Book Not Found',
          'No book found with this ISBN. Would you like to add it manually?',
          [
            { text: 'Add Manually', onPress: () => navigation.navigate('AddBook', { bookData: { isbn: isbn } }) },
            { 
              text: 'Try Again', 
              onPress: () => {
                setScanned(false);
                setIsbnInput('');
              } 
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error processing ISBN:', error);
      Alert.alert('Error', 'Failed to process the ISBN. Please try again.', [{ 
        text: 'OK', 
        onPress: () => {
          setScanned(false);
          setIsbnInput('');
        } 
      }]);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleTorch = () => {
    setTorch(!torch);
  };
  
  const toggleCamera = () => {
    setCameraActive(!cameraActive);
    setScanned(false);
  };
  
  const renderManualInput = () => (
    <View style={styles.manualInputContainer}>
      <Text style={styles.sectionTitle}>Enter ISBN Manually</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.isbnInput}
          placeholder="Enter ISBN number"
          value={isbnInput}
          onChangeText={setIsbnInput}
          keyboardType="numeric"
          maxLength={13}
          editable={!loading}
        />
        <Button
          mode="contained"
          onPress={() => processISBN(isbnInput)}
          loading={loading}
          disabled={loading || !isbnInput}
          style={styles.searchButton}
        >
          Search
        </Button>
      </View>
      <Text style={styles.helperText}>
        Enter 10 or 13-digit ISBN number
      </Text>
    </View>
  );
  
  const renderCameraToggle = () => (
    <View style={styles.cameraToggleContainer}>
      <Button
        mode="outlined"
        icon={cameraActive ? "camera-off" : "camera"}
        onPress={toggleCamera}
        style={styles.cameraToggleButton}
        disabled={hasPermission === false || loading}
      >
        {cameraActive ? "Hide Camera" : "Show Camera"}
      </Button>
    </View>
  );
  
  const renderCameraView = () => {
    if (!cameraActive) return null;
    
    if (hasPermission === null) {
      return (
        <View style={styles.cameraContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.text}>Requesting camera permission...</Text>
        </View>
      );
    }
    
    if (hasPermission === false) {
      return (
        <View style={styles.cameraContainer}>
          <MaterialCommunityIcons name="camera-off" size={64} color="#FF3B30" />
          <Text style={styles.text}>Camera access is required for scanning.</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.cameraContainer}>
        <Camera
          ref={ref => setCameraRef(ref)}
          style={styles.camera}
          type={CameraType.back}
          barCodeScannerSettings={{
            barCodeTypes: [Camera.Constants.BarCodeType.ean13, Camera.Constants.BarCodeType.qr],
          }}
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          flashMode={torch ? Camera.Constants.FlashMode.torch : Camera.Constants.FlashMode.off}
        />
        <View style={styles.cameraOverlay}>
          <Text style={styles.scanInstructions}>
            Position barcode within frame to scan
          </Text>
          <TouchableOpacity style={styles.torchButton} onPress={toggleTorch}>
            <MaterialCommunityIcons 
              name={torch ? "flashlight-off" : "flashlight"} 
              size={28} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Book ISBN Scanner</Text>
          <Text style={styles.headerSubtitle}>Scan or enter ISBN to find book details</Text>
        </View>
        
        {renderManualInput()}
        {renderCameraToggle()}
        {renderCameraView()}
        
        <Button
          mode="outlined"
          icon="arrow-left"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          Go Back
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
  },
  headerContainer: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
  },
  manualInputContainer: {
    marginBottom: 24,
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333333',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  isbnInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 4,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    marginRight: 12,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#4A90E2',
  },
  helperText: {
    fontSize: 12,
    color: '#888888',
    marginTop: 8,
  },
  cameraToggleContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  cameraToggleButton: {
    width: '100%',
    borderColor: '#4A90E2',
  },
  cameraContainer: {
    height: 250,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    marginBottom: 24,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scanInstructions: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 8,
  },
  torchButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 20,
  },
  text: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 12,
  },
  backButton: {
    marginTop: 20,
    marginBottom: 40,
  },
});

export default ScanBookScreen;
