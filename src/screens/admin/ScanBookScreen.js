import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getBookByBarcode } from '../../services/bookService';

const ScanBookScreen = ({ navigation, route }) => {
  const [hasPermission, setHasPermission] = useState(null);
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
          'Please enable camera access in your device settings to scan books.'
        );
      }
    })();
  }, []);
  
  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    setLoading(true);
    try {
      const bookData = await getBookByBarcode(data);
      if (bookData) {
        const volumeInfo = bookData.volumeInfo || {};
        const processedBookData = {
          title: volumeInfo.title || '',
          author: (volumeInfo.authors || []).join(', ') || '',
          isbn: data,
          publisher: volumeInfo.publisher || '',
          publishedDate: volumeInfo.publishedDate || '',
          description: volumeInfo.description || '',
          pageCount: volumeInfo.pageCount || null,
          categories: volumeInfo.categories || [],
          imageUrl: volumeInfo.imageLinks?.thumbnail || null,
          status: 'available',
          location: '',
          notes: '',
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
              { text: 'Scan Again', onPress: () => setScanned(false) }
            ]
          );
        }
      } else {
        Alert.alert(
          'Book Not Found',
          'No book found with this barcode. Would you like to add it manually?',
          [
            { text: 'Add Manually', onPress: () => navigation.navigate('AddBook', { bookData: { isbn: data } }) },
            { text: 'Scan Again', onPress: () => setScanned(false) }
          ]
        );
      }
    } catch (error) {
      console.error('Error scanning book:', error);
      Alert.alert('Error', 'Failed to process the scanned barcode. Please try again.', [{ text: 'OK', onPress: () => setScanned(false) }]);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleTorch = () => {
    setTorch(!torch);
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
        <Text style={styles.text}>Camera access is required to scan books.</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={styles.button}>Go Back</Button>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
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
      <TouchableOpacity style={styles.controlButton} onPress={toggleTorch}>
        <MaterialCommunityIcons name={torch ? "flashlight-off" : "flashlight"} size={28} color="#FFFFFF" />
      </TouchableOpacity>
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
  controlButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 50,
  },
  text: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#4A90E2',
  },
});

export default ScanBookScreen;
