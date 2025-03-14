import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking
} from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Divider, 
  Chip
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getBookById } from '../../services/bookService';
import { useAuth } from '../../context/AuthContext';

const BookDetailsScreen = ({ navigation, route }) => {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  
  // Get book ID from route params
  const bookId = route.params?.bookId;
  
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
  
  // Format status for display
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
  
  // Handle borrow button press
  const handleBorrow = () => {
    if (!currentUser) {
      Alert.alert(
        'Sign In Required',
        'You need to sign in to borrow books',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Auth') }
        ]
      );
      return;
    }
    
    if (book.status !== 'available') {
      Alert.alert('Book Unavailable', 'This book is currently not available for borrowing');
      return;
    }
    
    navigation.navigate('Borrow', { bookId: book.id });
  };
  
  // Handle search online button press
  const handleSearchOnline = () => {
    let searchQuery = `${book.title} ${book.author}`;
    const encodedQuery = encodeURIComponent(searchQuery);
    Linking.openURL(`https://www.google.com/search?q=${encodedQuery}`);
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
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerContainer}>
            {book.imageUrl ? (
              <Image
                source={{ uri: book.imageUrl }}
                style={styles.coverImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.coverPlaceholder}>
                <MaterialCommunityIcons name="book-open-page-variant" size={64} color="#CCCCCC" />
              </View>
            )}
            
            <View style={styles.headerInfo}>
              <Title style={styles.title}>{book.title}</Title>
              <Paragraph style={styles.author}>by {book.author}</Paragraph>
              
              <View style={styles.statusContainer}>
                <Text style={styles.statusLabel}>Status:</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(book.status) }]}>
                  <Text style={styles.statusText}>
                    {book.status ? book.status.charAt(0).toUpperCase() + book.status.slice(1) : 'Unknown'}
                  </Text>
                </View>
              </View>
              
              {book.averageRating > 0 && (
                <View style={styles.ratingContainer}>
                  <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                  <Text style={styles.ratingText}>
                    {book.averageRating.toFixed(1)} ({book.ratings?.length || 0} ratings)
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ISBN:</Text>
              <Text style={styles.detailValue}>{book.isbn || 'N/A'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Publisher:</Text>
              <Text style={styles.detailValue}>{book.publisher || 'N/A'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Published:</Text>
              <Text style={styles.detailValue}>{book.publishedDate || 'N/A'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pages:</Text>
              <Text style={styles.detailValue}>{book.pageCount || 'N/A'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>{book.location || 'N/A'}</Text>
            </View>
            
            {book.categories && book.categories.length > 0 && (
              <View style={styles.categoriesContainer}>
                <Text style={styles.detailLabel}>Categories:</Text>
                <View style={styles.categoriesWrapper}>
                  {book.categories.map((category, index) => (
                    <Chip 
                      key={index} 
                      style={styles.categoryChip}
                      textStyle={styles.categoryChipText}
                    >
                      {category}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          </View>
          
          {book.description && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionTitle}>Description</Text>
                <Text style={styles.descriptionText}>{book.description}</Text>
              </View>
            </>
          )}
        </Card.Content>
      </Card>
      
      <View style={styles.actionButtons}>
        {book.status === 'available' ? (
          <Button 
            mode="contained" 
            icon="book-plus" 
            onPress={handleBorrow}
            style={styles.borrowButton}
          >
            Borrow This Book
          </Button>
        ) : (
          <Button 
            mode="contained" 
            disabled
            icon="book" 
            style={styles.unavailableButton}
          >
            {book.status === 'borrowed' ? 'Currently Borrowed' : 'Not Available'}
          </Button>
        )}
        
        <Button 
          mode="outlined" 
          icon="magnify" 
          onPress={handleSearchOnline}
          style={styles.searchButton}
        >
          Search Online
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    padding: 15,
    paddingBottom: 30,
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
  card: {
    borderRadius: 10,
    elevation: 2,
  },
  headerContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  coverImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
  },
  coverPlaceholder: {
    width: 120,
    height: 180,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: 15,
    flex: 1,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
  },
  author: {
    fontSize: 14,
    color: '#666666',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 5,
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666666',
  },
  divider: {
    marginVertical: 15,
  },
  detailsContainer: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    width: 80,
    fontSize: 14,
    color: '#666666',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },
  categoriesContainer: {
    marginTop: 5,
  },
  categoriesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  categoryChip: {
    marginRight: 5,
    marginBottom: 5,
    backgroundColor: '#F0F0F0',
  },
  categoryChipText: {
    fontSize: 12,
  },
  descriptionContainer: {
    marginBottom: 10,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333333',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
  },
  actionButtons: {
    marginTop: 15,
  },
  borrowButton: {
    marginBottom: 10,
    backgroundColor: '#4A90E2',
    paddingVertical: 5,
  },
  unavailableButton: {
    marginBottom: 10,
    backgroundColor: '#999999',
    paddingVertical: 5,
  },
  searchButton: {
    borderColor: '#4A90E2',
  },
});

export default BookDetailsScreen;