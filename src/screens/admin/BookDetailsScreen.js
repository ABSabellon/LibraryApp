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
  Chip,
  Dialog,
  Portal,
  IconButton,
  List
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getBookById, updateBookStatus, deleteBook } from '../../services/bookService';
import { getBookBorrowHistory } from '../../services/borrowService';

const BookDetailsScreen = ({ navigation, route }) => {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [borrowHistory, setBorrowHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  
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
          fetchBorrowHistory(bookId);
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
  
  // Fetch borrow history
  const fetchBorrowHistory = async (id) => {
    try {
      setHistoryLoading(true);
      const history = await getBookBorrowHistory(id);
      setBorrowHistory(history);
    } catch (error) {
      console.error('Error fetching borrow history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };
  
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
  
  // Handle edit button press
  const handleEditBook = () => {
    navigation.navigate('AddBook', { bookId: book.id, editMode: true });
  };
  
  // Handle delete book
  const handleDeleteBook = async () => {
    try {
      await deleteBook(book.id);
      Alert.alert('Success', 'Book deleted successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting book:', error);
      Alert.alert('Error', 'Failed to delete book');
    }
  };
  
  // Handle change status
  const handleChangeStatus = async (newStatus) => {
    try {
      await updateBookStatus(book.id, newStatus);
      setBook({...book, status: newStatus});
      Alert.alert('Success', `Book status updated to ${newStatus}`);
      setShowStatusDialog(false);
    } catch (error) {
      console.error('Error updating book status:', error);
      Alert.alert('Error', 'Failed to update book status');
    }
  };
  
  // Handle generate QR code
  const handleGenerateQR = () => {
    navigation.navigate('GenerateQR', { bookId: book.id });
  };
  
  // Handle search online button press
  const handleSearchOnline = () => {
    let searchQuery = `${book.title} ${book.author}`;
    const encodedQuery = encodeURIComponent(searchQuery);
    Linking.openURL(`https://www.google.com/search?q=${encodedQuery}`);
  };

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
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
    <>
      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Book</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Are you sure you want to delete "{book.title}"? This action cannot be undone.</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onPress={handleDeleteBook} textColor="#FF3B30">Delete</Button>
          </Dialog.Actions>
        </Dialog>
        
        <Dialog visible={showStatusDialog} onDismiss={() => setShowStatusDialog(false)}>
          <Dialog.Title>Change Book Status</Dialog.Title>
          <Dialog.Content>
            <TouchableOpacity
              style={styles.statusOption}
              onPress={() => handleChangeStatus('available')}
            >
              <View style={[styles.statusDot, { backgroundColor: '#4CD964' }]} />
              <Text style={styles.statusOptionText}>Available</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.statusOption}
              onPress={() => handleChangeStatus('borrowed')}
            >
              <View style={[styles.statusDot, { backgroundColor: '#FF9500' }]} />
              <Text style={styles.statusOptionText}>Borrowed</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.statusOption}
              onPress={() => handleChangeStatus('unavailable')}
            >
              <View style={[styles.statusDot, { backgroundColor: '#FF3B30' }]} />
              <Text style={styles.statusOptionText}>Unavailable</Text>
            </TouchableOpacity>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowStatusDialog(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.adminHeader}>
          <Text style={styles.adminTitle}>Book Management</Text>
          <View style={styles.adminActions}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={handleEditBook}
            />
            <IconButton
              icon="trash-can-outline"
              size={20}
              onPress={() => setShowDeleteDialog(true)}
              iconColor="#FF3B30"
            />
          </View>
        </View>
        
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
                
                <TouchableOpacity 
                  style={styles.statusContainer}
                  onPress={() => setShowStatusDialog(true)}
                >
                  <Text style={styles.statusLabel}>Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(book.status) }]}>
                    <Text style={styles.statusText}>
                      {book.status ? book.status.charAt(0).toUpperCase() + book.status.slice(1) : 'Unknown'}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="pencil-outline" size={14} color="#666666" style={{marginLeft: 5}} />
                </TouchableOpacity>
                
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
        
        <Card style={[styles.card, styles.historyCard]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Borrowing History</Text>
            </View>
            
            {historyLoading ? (
              <ActivityIndicator size="small" color="#4A90E2" style={{marginVertical: 20}} />
            ) : borrowHistory.length > 0 ? (
              borrowHistory.map((borrow, index) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.borrowerName}>{borrow.borrowerName}</Text>
                    <Chip 
                      style={[
                        styles.historyStatusChip, 
                        { backgroundColor: borrow.status === 'returned' ? '#E0F7E0' : '#FFF0E0' }
                      ]}
                      textStyle={{ 
                        color: borrow.status === 'returned' ? '#4CD964' : '#FF9500',
                        fontWeight: '500'
                      }}
                    >
                      {borrow.status === 'returned' ? 'Returned' : 'Borrowed'}
                    </Chip>
                  </View>
                  <View style={styles.dateContainer}>
                    <View style={styles.dateItem}>
                      <Text style={styles.dateLabel}>Borrowed:</Text>
                      <Text style={styles.dateValue}>{formatDate(borrow.borrowDate)}</Text>
                    </View>
                    <View style={styles.dateItem}>
                      <Text style={styles.dateLabel}>Due:</Text>
                      <Text style={styles.dateValue}>{formatDate(borrow.dueDate)}</Text>
                    </View>
                    {borrow.returnDate && (
                      <View style={styles.dateItem}>
                        <Text style={styles.dateLabel}>Returned:</Text>
                        <Text style={styles.dateValue}>{formatDate(borrow.returnDate)}</Text>
                      </View>
                    )}
                  </View>
                  {index < borrowHistory.length - 1 && <Divider style={styles.historyDivider} />}
                </View>
              ))
            ) : (
              <Text style={styles.noHistoryText}>No borrowing history available</Text>
            )}
          </Card.Content>
        </Card>
        
        <View style={styles.actionButtons}>
          <Button 
            mode="contained" 
            icon="qrcode" 
            onPress={handleGenerateQR}
            style={styles.qrButton}
          >
            Generate QR Code
          </Button>
          
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
    </>
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
  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  adminTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  adminActions: {
    flexDirection: 'row',
  },
  card: {
    borderRadius: 10,
    elevation: 2,
    marginBottom: 15,
  },
  historyCard: {
    marginTop: 0,
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
  sectionHeader: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  historyItem: {
    marginBottom: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  borrowerName: {
    fontSize: 14,
    fontWeight: '500',
  },
  historyStatusChip: {
    height: 24,
  },
  dateContainer: {
    marginBottom: 5,
  },
  dateItem: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  dateLabel: {
    width: 65,
    fontSize: 12,
    color: '#666666',
  },
  dateValue: {
    fontSize: 12,
    color: '#333333',
  },
  historyDivider: {
    marginVertical: 10,
  },
  noHistoryText: {
    textAlign: 'center',
    color: '#999999',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  actionButtons: {
    marginTop: 5,
  },
  qrButton: {
    marginBottom: 10,
    backgroundColor: '#4A90E2',
    paddingVertical: 5,
  },
  searchButton: {
    borderColor: '#4A90E2',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },
  statusOptionText: {
    fontSize: 16,
  },
});

export default BookDetailsScreen;