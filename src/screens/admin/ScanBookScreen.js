import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Camera } from 'expo-camera';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getBookByBarcode } from '../../services/bookService';

const ScanBookScreen = ({ navigation, route }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraRef, setCameraRef] = useState(null);
  
  // Check if we should return to AddBook screen
  const returnToAddBook = route.params?.returnToAddBook || false;
  
  // Request camera permission
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Camera permission denied',
          'Please enable camera access in your device settings to scan books.'
        );
      }
    })();
  }, []);
  
  // Handle barcode scanning
  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    setLoading(true);
    
    try {
      // Try to find the book in Google Books API by barcode/ISBN
      const bookData = await getBookByBarcode(data);
      
      if (bookData) {
        // Process book data
        const volumeInfo = bookData.volumeInfo || {};
        
        // Map Google Books API response to our book model
        const processedBookData = {
          title: volumeInfo.title || '',
          author: (volumeInfo.authors || []).join(', ') || '',
          isbn: data, // Use scanned barcode as ISBN
          publisher: volumeInfo.publisher || '',
          publishedDate: volumeInfo.publishedDate || '',
          description: volumeInfo.description || '',
          pageCount: volumeInfo.pageCount || null,
          categories: volumeInfo.categories || [],
          imageUrl: volumeInfo.imageLinks?.thumbnail || null,
          // Additional fields for our database
          status: 'available',
          location: '',
          notes: '',
        };
        
        // Navigate based on the route parameter
        if (returnToAddBook) {
          navigation.navigate('AddBook', { bookData: processedBookData });
        } else {
          // Show book details with option to add
          Alert.alert(
            'Book Found',
            `"${processedBookData.title}" by ${processedBookData.author}`,
            [
              { 
                text: 'View Details',
                onPress: () => navigation.navigate('BookDetails', { bookData: processedBookData, isNewBook: true })
              },
              { 
                text: 'Add to Library',
                onPress: () => navigation.navigate('AddBook', { bookData: processedBookData })
              },
              { 
                text: 'Scan Again',
                onPress: () => setScanned(false)
              }
            ]
          );
        }
      } else {
        // Book not found in Google Books API
        Alert.alert(
          'Book Not Found',
          'No book found with this barcode. Would you like to add it manually?',
          [
            { 
              text: 'Add Manually',
              onPress: () => navigation.navigate('AddBook', { bookData: { isbn: data } })
            },
            { 
              text: 'Scan Again',
              onPress: () => setScanned(false)
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error scanning book:', error);
      Alert.alert(
        'Error',
        'Failed to process the scanned barcode. Please try again.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle torch
  const toggleTorch = () => {
    setTorch(!torch);
  };
  
  // Handle manual code entry
  const handleManualEntry = () => {
    navigation.navigate('AddBook');
  };
  
  // If waiting for permission
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }
  
  // If permission denied
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <MaterialCommunityIcons name="camera-off" size={64} color="#FF3B30" />
        <Text style={styles.text}>Camera access is required to scan books.</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          Go Back
        </Button>
        <Button 
          mode="outlined" 
          onPress={handleManualEntry}
          style={[styles.button, styles.outlinedButton]}
        >
          Enter Manually
        </Button>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Camera
        ref={ref => setCameraRef(ref)}
        style={styles.camera}
        type={Camera.Constants.Type.back}
        barCodeScannerSettings={{
          barCodeTypes: [BarCodeScanner.Constants.BarCodeType.ean13, BarCodeScanner.Constants.BarCodeType.isbn],
        }}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        flashMode={torch ? Camera.Constants.FlashMode.torch : Camera.Constants.FlashMode.off}
      />
      
      <View style={styles.overlay}>
        <View style={styles.scanArea}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />
        </View>
        
        <Text style={styles.instructions}>
          Align the book's barcode within the frame to scan
        </Text>
      </View>
      
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={toggleTorch}
        >
          <MaterialCommunityIcons 
            name={torch ? "flashlight-off" : "flashlight"} 
            size={28} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
        
        {scanned && !loading && (
          <TouchableOpacity
            style={[styles.controlButton, styles.scanButton]}
            onPress={() => setScanned(false)}
          >
            <MaterialCommunityIcons name="barcode-scan" size={28} color="#FFFFFF" />
            <Text style={styles.scanButtonText}>Scan Again</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleManualEntry}
        >
          <MaterialCommunityIcons name="keyboard" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Searching book database...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 280,
    height: 180,
    borderColor: 'transparent',
    borderWidth: 1,
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#4A90E2',
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: '#4A90E2',
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#4A90E2',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: '#4A90E2',
  },
  instructions: {
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  scanButton: {
    width: 120,
    borderRadius: 30,
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
  },
  scanButtonText: {
    color: '#FFFFFF',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  text: {
    color: '#333333',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    padding: 20,
  },
  button: {
    marginTop: 20,
    width: 200,
    backgroundColor: '#4A90E2',
  },
  outlinedButton: {
    backgroundColor: 'transparent',
    borderColor: '#4A90E2',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
});

export default ScanBookScreen;