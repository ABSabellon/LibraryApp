import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
  TouchableOpacity
} from 'react-native';
import { Card, Title, Paragraph, Button, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { getBookById } from '../../services/bookService';

const GenerateQRScreen = ({ navigation, route }) => {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrRef, setQrRef] = useState(null);
  const [hasMediaPermission, setHasMediaPermission] = useState(null);
  
  // Get book ID from route params
  const bookId = route.params?.bookId;
  
  // Generate QR data
  const getQRData = (book) => {
    // Create a data object with essential book info
    const qrData = {
      id: book.id,
      title: book.title,
      author: book.author,
      type: 'library_book'
    };
    
    // Return as JSON string
    return JSON.stringify(qrData);
  };
  
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
  }, [bookId]);
  
  // Check for media library permissions
  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasMediaPermission(status === 'granted');
    })();
  }, []);
  
  // Save QR code to device
  const saveQRCode = async () => {
    if (!hasMediaPermission) {
      Alert.alert(
        'Permission Required',
        'Storage permission is required to save the QR code to your device.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Grant Permission', 
            onPress: async () => {
              const { status } = await MediaLibrary.requestPermissionsAsync();
              setHasMediaPermission(status === 'granted');
              
              if (status === 'granted') {
                saveQRCode();
              }
            }
          }
        ]
      );
      return;
    }
    
    try {
      // Convert QR code to PNG data URL
      let qrImage;
      qrRef.toDataURL(async (dataURL) => {
        try {
          // File path to save the image
          const fileUri = `${FileSystem.cacheDirectory}qrcode-${bookId}.png`;
          
          // Convert base64 to file
          const base64Code = dataURL.split('data:image/png;base64,')[1];
          await FileSystem.writeAsStringAsync(fileUri, base64Code, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          // Save to media library
          const asset = await MediaLibrary.createAssetAsync(fileUri);
          await MediaLibrary.createAlbumAsync('Library QR Codes', asset, false);
          
          Alert.alert(
            'Success',
            'QR code saved to your gallery in "Library QR Codes" album'
          );
        } catch (error) {
          console.error('Error saving QR code:', error);
          Alert.alert('Error', 'Failed to save QR code');
        }
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      Alert.alert('Error', 'Failed to generate QR code');
    }
  };
  
  // Share QR code
  const shareQRCode = async () => {
    try {
      // Convert QR code to PNG data URL
      qrRef.toDataURL(async (dataURL) => {
        try {
          // File path for sharing
          const fileUri = `${FileSystem.cacheDirectory}qrcode-${bookId}.png`;
          
          // Convert base64 to file
          const base64Code = dataURL.split('data:image/png;base64,')[1];
          await FileSystem.writeAsStringAsync(fileUri, base64Code, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          // Check if sharing is available
          const isAvailable = await Sharing.isAvailableAsync();
          
          if (isAvailable) {
            await Sharing.shareAsync(fileUri, {
              mimeType: 'image/png',
              dialogTitle: `QR Code for ${book.title}`,
              UTI: 'public.png'
            });
          } else {
            // Fallback for platforms where sharing is not available
            // Use Share API which has more limited capabilities
            const shareOptions = {
              title: `QR Code for ${book.title}`,
              message: `QR Code for checking out "${book.title}" by ${book.author}`,
            };
            
            await Share.share(shareOptions);
          }
        } catch (error) {
          console.error('Error sharing QR code:', error);
          Alert.alert('Error', 'Failed to share QR code');
        }
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      Alert.alert('Error', 'Failed to generate QR code');
    }
  };
  
  // Return to book details
  const viewBookDetails = () => {
    navigation.navigate('BookDetails', { bookId });
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading book details...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card style={styles.bookCard}>
        <Card.Content>
          <Title style={styles.bookTitle}>{book.title}</Title>
          <Paragraph style={styles.bookAuthor}>by {book.author}</Paragraph>
          <Divider style={styles.divider} />
          
          <View style={styles.qrContainer}>
            <QRCode
              value={getQRData(book)}
              size={200}
              backgroundColor="white"
              color="black"
              getRef={(ref) => setQrRef(ref)}
            />
            <Text style={styles.qrText}>Scan to borrow this book</Text>
            
            <View style={styles.qrActions}>
              <Button 
                mode="contained" 
                icon="content-save-outline" 
                onPress={saveQRCode}
                style={styles.qrButton}
              >
                Save
              </Button>
              <Button 
                mode="contained" 
                icon="share-variant" 
                onPress={shareQRCode}
                style={styles.qrButton}
              >
                Share
              </Button>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.bookInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ISBN:</Text>
              <Text style={styles.infoValue}>{book.isbn || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: getStatusColor(book.status) }
              ]}>
                <Text style={styles.statusText}>
                  {book.status ? book.status.charAt(0).toUpperCase() + book.status.slice(1) : 'Unknown'}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location:</Text>
              <Text style={styles.infoValue}>{book.location || 'Not specified'}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      <Button 
        mode="outlined" 
        icon="book-open-variant" 
        onPress={viewBookDetails}
        style={styles.detailsButton}
      >
        View Book Details
      </Button>
      
      <TouchableOpacity 
        style={styles.printHint}
        onPress={() => Alert.alert(
          'Printing QR Codes',
          'For best results, print QR codes at 300 DPI or higher. Stick the QR code on the book cover or inside the front cover for easy access.'
        )}
      >
        <MaterialCommunityIcons name="information" size={20} color="#4A90E2" />
        <Text style={styles.printHintText}>Printing tips</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Helper function to determine status color
const getStatusColor = (status) => {
  switch (status) {
    case 'available':
      return '#4CD964';
    case 'borrowed':
      return '#FF9500';
    case 'unavailable':
      return '#FF3B30';
    default:
      return '#8E8E93';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
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
  bookCard: {
    borderRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bookAuthor: {
    color: '#666666',
    marginBottom: 10,
  },
  divider: {
    marginVertical: 15,
  },
  qrContainer: {
    alignItems: 'center',
    padding: 10,
  },
  qrText: {
    marginTop: 10,
    color: '#666666',
    fontSize: 14,
  },
  qrActions: {
    flexDirection: 'row',
    marginTop: 15,
    justifyContent: 'center',
  },
  qrButton: {
    marginHorizontal: 5,
    backgroundColor: '#4A90E2',
  },
  bookInfo: {
    marginTop: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    width: 70,
    fontSize: 14,
    color: '#666666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsButton: {
    marginBottom: 20,
    borderColor: '#4A90E2',
  },
  printHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  printHintText: {
    marginLeft: 5,
    color: '#4A90E2',
    fontSize: 14,
  },
});

export default GenerateQRScreen;