import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert
} from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Chip, 
  Button,
  Menu,
  Divider,
  FAB
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getBookById } from '../../services/bookService';
import { getBorrowsByEmail, returnBook } from '../../services/borrowService';

const MyBooksScreen = ({ navigation }) => {
  const [myBooks, setMyBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'returned', 'overdue'
  
  const { currentUser } = useAuth();
  
  // Load borrowed books
  const loadBooks = async () => {
    if (!currentUser || !currentUser.email) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Get all borrows for the user
      const borrows = await getBorrowsByEmail(currentUser.email);
      
      // For each borrow, fetch the book details
      const booksWithBorrowDetails = await Promise.all(
        borrows.map(async (borrow) => {
          const book = await getBookById(borrow.bookId);
          if (book) {
            // Calculate if overdue
            const dueDate = borrow.dueDate.toDate();
            const isOverdue = borrow.status === 'active' && dueDate < new Date();
            
            return {
              ...book,
              borrowId: borrow.id,
              borrowDate: borrow.borrowDate.toDate(),
              dueDate: dueDate,
              returnDate: borrow.returnDate ? borrow.returnDate.toDate() : null,
              status: borrow.status,
              isOverdue
            };
          }
          return null;
        })
      );
      
      // Remove any null values
      const validBooks = booksWithBorrowDetails.filter(book => book !== null);
      
      // Sort by borrow date (newest first)
      validBooks.sort((a, b) => b.borrowDate - a.borrowDate);
      
      setMyBooks(validBooks);
    } catch (error) {
      console.error('Error loading borrowed books:', error);
      Alert.alert('Error', 'Failed to load your borrowed books');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Initial load
  useEffect(() => {
    loadBooks();
  }, [currentUser]);
  
  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadBooks();
  };
  
  // Apply filter
  const getFilteredBooks = () => {
    if (filter === 'all') {
      return myBooks;
    } else if (filter === 'active') {
      return myBooks.filter(book => book.status === 'active' && !book.isOverdue);
    } else if (filter === 'returned') {
      return myBooks.filter(book => book.status === 'returned');
    } else if (filter === 'overdue') {
      return myBooks.filter(book => book.isOverdue);
    }
    return myBooks;
  };
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString();
  };
  
  // Calculate days left
  const getDaysLeft = (dueDate) => {
    if (!dueDate) return 0;
    
    const today = new Date();
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  // Handle book return
  const handleReturnBook = (book) => {
    Alert.alert(
      'Return Book',
      `Are you sure you want to return "${book.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Return',
          onPress: async () => {
            try {
              setLoading(true);
              await returnBook(book.borrowId);
              Alert.alert('Success', 'Book returned successfully');
              loadBooks();
            } catch (error) {
              console.error('Error returning book:', error);
              Alert.alert('Error', 'Failed to return the book');
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  
  // Render book item
  const renderBookItem = ({ item }) => {
    // Calculate days left or overdue
    const daysLeft = getDaysLeft(item.dueDate);
    
    return (
      <Card 
        style={styles.bookCard}
        onPress={() => navigation.navigate('MyBookDetails', { bookId: item.id })}
      >
        <Card.Content style={styles.bookCardContent}>
          <View style={styles.bookInfo}>
            <Title style={styles.bookTitle}>{item.title}</Title>
            <Paragraph style={styles.bookAuthor}>by {item.author}</Paragraph>
            
            <View style={styles.datesContainer}>
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Borrowed:</Text>
                <Text style={styles.dateValue}>{formatDate(item.borrowDate)}</Text>
              </View>
              
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Due:</Text>
                <Text style={[
                  styles.dateValue,
                  item.isOverdue && styles.overdueDateValue
                ]}>
                  {formatDate(item.dueDate)}
                </Text>
              </View>
              
              {item.returnDate && (
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Returned:</Text>
                  <Text style={styles.dateValue}>{formatDate(item.returnDate)}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.statusContainer}>
              {item.status === 'active' ? (
                item.isOverdue ? (
                  <Chip 
                    mode="outlined" 
                    style={styles.overdueChip}
                    textStyle={styles.overdueChipText}
                  >
                    {Math.abs(daysLeft)} days overdue
                  </Chip>
                ) : (
                  <Chip 
                    mode="outlined" 
                    style={styles.dueChip}
                    textStyle={styles.dueChipText}
                  >
                    {daysLeft} days left
                  </Chip>
                )
              ) : (
                <Chip 
                  mode="outlined" 
                  style={styles.returnedChip}
                  textStyle={styles.returnedChipText}
                >
                  Returned
                </Chip>
              )}
              
              {item.status === 'active' && (
                <Button 
                  mode="text" 
                  compact
                  onPress={() => handleReturnBook(item)}
                  style={styles.returnButton}
                >
                  Return
                </Button>
              )}
            </View>
          </View>
          
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.bookCover}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.bookCoverPlaceholder}>
              <MaterialCommunityIcons name="book-open-page-variant" size={40} color="#CCCCCC" />
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };
  
  const filteredBooks = getFilteredBooks();
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Books</Text>
        
        <Menu
          visible={filterMenuVisible}
          onDismiss={() => setFilterMenuVisible(false)}
          anchor={
            <Button 
              mode="outlined" 
              onPress={() => setFilterMenuVisible(true)}
              style={styles.filterButton}
              icon="filter-variant"
            >
              {filter === 'all' ? 'All Books' : 
               filter === 'active' ? 'Active' :
               filter === 'returned' ? 'Returned' : 'Overdue'}
            </Button>
          }
        >
          <Menu.Item 
            onPress={() => {
              setFilter('all');
              setFilterMenuVisible(false);
            }} 
            title="All Books" 
            leadingIcon="book-multiple"
          />
          <Menu.Item 
            onPress={() => {
              setFilter('active');
              setFilterMenuVisible(false);
            }} 
            title="Active" 
            leadingIcon="book-open-variant"
          />
          <Menu.Item 
            onPress={() => {
              setFilter('returned');
              setFilterMenuVisible(false);
            }} 
            title="Returned" 
            leadingIcon="book-check"
          />
          <Divider />
          <Menu.Item 
            onPress={() => {
              setFilter('overdue');
              setFilterMenuVisible(false);
            }} 
            title="Overdue" 
            leadingIcon="book-alert"
          />
        </Menu>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading your books...</Text>
        </View>
      ) : (
        <>
          {filteredBooks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="bookshelf" size={64} color="#CCCCCC" />
              <Text style={styles.emptyText}>
                {filter !== 'all' 
                  ? `No ${filter} books found`
                  : "You haven't borrowed any books yet"}
              </Text>
              
              {filter === 'all' && (
                <Button 
                  mode="contained"
                  onPress={() => navigation.navigate('CatalogTab')}
                  style={styles.browseButton}
                >
                  Browse Library
                </Button>
              )}
            </View>
          ) : (
            <FlatList
              data={filteredBooks}
              renderItem={renderBookItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#4A90E2']}
                />
              }
            />
          )}
        </>
      )}
      
      <FAB
        style={styles.scanFab}
        icon="qrcode-scan"
        onPress={() => navigation.navigate('ScanTab')}
        color="#FFFFFF"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  filterButton: {
    borderColor: '#4A90E2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  browseButton: {
    backgroundColor: '#4A90E2',
  },
  listContent: {
    padding: 10,
    paddingBottom: 80, // Add padding to bottom to avoid FAB overlap
  },
  bookCard: {
    marginBottom: 10,
    elevation: 2,
    borderRadius: 8,
  },
  bookCardContent: {
    flexDirection: 'row',
  },
  bookInfo: {
    flex: 1,
    marginRight: 10,
  },
  bookTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666666',
  },
  datesContainer: {
    marginTop: 10,
  },
  dateRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dateLabel: {
    width: 75,
    fontSize: 14,
    color: '#666666',
  },
  dateValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  overdueDateValue: {
    color: '#FF3B30',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
  },
  overdueChip: {
    borderColor: '#FF3B30',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  overdueChipText: {
    color: '#FF3B30',
  },
  dueChip: {
    borderColor: '#4CD964',
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
  },
  dueChipText: {
    color: '#4CD964',
  },
  returnedChip: {
    borderColor: '#8E8E93',
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
  },
  returnedChipText: {
    color: '#8E8E93',
  },
  returnButton: {
    marginLeft: 10,
  },
  bookCover: {
    width: 80,
    height: 120,
    borderRadius: 4,
  },
  bookCoverPlaceholder: {
    width: 80,
    height: 120,
    borderRadius: 4,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4A90E2',
  },
});

export default MyBooksScreen;