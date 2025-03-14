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
import { getBookById } from '../../services/bookService';

const ScanQRScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraRef, setCameraRef] = useState(null);
  
  // Request camera permission
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Camera permission denied',
          'Please enable camera access in your device settings to scan QR codes.'
        );
      }
    })();
  }, []);
  
  // Handle QR code scanning
  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    setLoading(true);
    
    try {
      // Try to parse the QR data
      let qrData;
      try {
        qrData = JSON.parse(data);
      } catch (e) {
        // Not a valid JSON
        Alert.alert(
          'Invalid QR Code',
          'This QR code does not contain valid library book information.',
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
        setLoading(false);
        return;
      }
      
      // Check if this is a library book QR code
      if (!qrData.type || qrData.type !== 'library_book' || !qrData.id) {
        Alert.alert(
          'Invalid QR Code',
          'This QR code does not contain valid library book information.',
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
        setLoading(false);
        return;
      }
      
      // Try to find the book in the database
      const bookData = await getBookById(qrData.id);
      
      if (bookData) {
        // Check if book is available
        if (bookData.status === 'available') {
          // Navigate to borrow screen
          navigation.navigate('ScanBorrow', { bookId: bookData.id });
        } else if (bookData.status === 'borrowed') {
          Alert.alert(
            'Book Unavailable',
            'This book is currently borrowed by another user.',
            [{ text: 'OK', onPress: () => setScanned(false) }]
          );
        } else {
          Alert.alert(
            'Book Unavailable',
            'This book is currently not available for borrowing.',
            [{ text: 'OK', onPress: () => setScanned(false) }]
          );
        }
      } else {
        Alert.alert(
          'Book Not Found',
          'We could not find this book in our library database.',
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      Alert.alert(
        'Error',
        'Failed to process the scanned QR code. Please try again.',
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
        <Text style={styles.text}>Camera access is required to scan QR codes.</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          Go Back
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
          barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
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
          Scan a book's QR code to borrow it
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
            <MaterialCommunityIcons name="qrcode-scan" size={28} color="#FFFFFF" />
            <Text style={styles.scanButtonText}>Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Processing book information...</Text>
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
    width: 250,
    height: 250,
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
    width: 150,
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

export default ScanQRScreen;