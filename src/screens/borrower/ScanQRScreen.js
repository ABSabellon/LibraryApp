import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Camera } from 'expo-camera';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getBookById } from '../../services/bookService';

const ScanQRScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [loading, setLoading] = useState(false);
  
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
  
  const handleBarCodeScanned = async ({ data }) => {
    setScanned(true);
    setLoading(true);
    
    try {
      let qrData;
      try {
        qrData = JSON.parse(data);
      } catch (e) {
        Alert.alert('Invalid QR Code', 'This QR code does not contain valid book information.', [{ text: 'OK', onPress: () => setScanned(false) }]);
        setLoading(false);
        return;
      }
      
      if (!qrData.type || qrData.type !== 'library_book' || !qrData.id) {
        Alert.alert('Invalid QR Code', 'This QR code does not contain valid book information.', [{ text: 'OK', onPress: () => setScanned(false) }]);
        setLoading(false);
        return;
      }
      
      const bookData = await getBookById(qrData.id);
      
      if (bookData) {
        if (bookData.status === 'available') {
          navigation.navigate('ScanBorrow', { bookId: bookData.id });
        } else {
          Alert.alert('Book Unavailable', 'This book is currently not available.', [{ text: 'OK', onPress: () => setScanned(false) }]);
        }
      } else {
        Alert.alert('Book Not Found', 'We could not find this book.', [{ text: 'OK', onPress: () => setScanned(false) }]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process the QR code.', [{ text: 'OK', onPress: () => setScanned(false) }]);
    } finally {
      setLoading(false);
    }
  };
  
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <MaterialCommunityIcons name="camera-off" size={64} color="#FF3B30" />
        <Text style={styles.text}>Camera access is required to scan QR codes.</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={styles.button}>Go Back</Button>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        type={Camera.Constants.Type.back}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        flashMode={torch ? Camera.Constants.FlashMode.torch : Camera.Constants.FlashMode.off}
      />
      
      {scanned && !loading && (
        <TouchableOpacity style={styles.scanButton} onPress={() => setScanned(false)}>
          <MaterialCommunityIcons name="qrcode-scan" size={28} color="#FFFFFF" />
          <Text style={styles.scanButtonText}>Scan Again</Text>
        </TouchableOpacity>
      )}
      
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
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  camera: { flex: 1, width: '100%' },
  text: { color: '#FFF', fontSize: 16, marginTop: 20, textAlign: 'center' },
  button: { marginTop: 20, width: 200, backgroundColor: '#4A90E2' },
  scanButton: { marginTop: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#4A90E2', padding: 10, borderRadius: 5 },
  scanButtonText: { color: '#FFFFFF', marginLeft: 5, fontWeight: 'bold' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  loadingText: { color: '#FFFFFF', marginTop: 10, fontSize: 16 }
});

export default ScanQRScreen;
