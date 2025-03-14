import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { 
  Searchbar, 
  Chip, 
  Button, 
  Menu, 
  Divider,
  List,
  FAB,
  Card,
  Title,
  Paragraph
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAllBooks, deleteBook } from '../../services/bookService';

const BookListScreen = ({ navigation }) => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState('title_asc');
  
  // Load books from Firebase
  const loadBooks = async () => {
    try {
      setLoading(true);
      const booksData = await getAllBooks();
      setBooks(booksData);
      filterAndSortBooks(booksData, searchQuery, statusFilter, sortOrder);
    } catch (error) {
      console.error('Error loading books:', error);
      Alert.alert('Error', 'Failed to load books from the database');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Initial load
  useEffect(() => {
    loadBooks();
  }, []);
  
  // Filter and sort books based on current criteria
  const filterAndSortBooks = (booksData, query, status, sort) => {
    // First apply status filter
    let result = [...booksData];
    
    if (status !== 'all') {
      result = result.filter(book => book.status === status);
    }
    
    // Then apply search query filter
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      result = result.filter(book => 
        (book.title && book.title.toLowerCase().includes(lowercaseQuery)) ||
        (book.author && book.author.toLowerCase().includes(lowercaseQuery)) ||
        (book.isbn && book.isbn.includes(query))
      );
    }
    
    // Finally apply sorting
    switch (sort) {
      case 'title_asc':
        result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'title_desc':
        result.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        break;
      case 'author_asc':
        result.sort((a, b) => (a.author || '').localeCompare(b.author || ''));
        break;
      case 'author_desc':
        result.sort((a, b) => (b.author || '').localeCompare(a.author || ''));
        break;
      case 'added_newest':
        result.sort((a, b) => {
          const dateA = a.addedDate ? new Date(a.addedDate.toDate()) : new Date(0);
          const dateB = b.addedDate ? new Date(b.addedDate.toDate()) : new Date(0);
          return dateB - dateA;
        });
        break;
      case 'added_oldest':
        result.sort((a, b) => {
          const dateA = a.addedDate ? new Date(a.addedDate.toDate()) : new Date(0);
          const dateB = b.addedDate ? new Date(b.addedDate.toDate()) : new Date(0);
          return dateA - dateB;
        });
        break;
      case 'most_borrowed':
        result.sort((a, b) => (b.borrowCount || 0) - (a.borrowCount || 0));
        break;
      default:
        break;
    }
    
    setFilteredBooks(result);
  };
  
  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadBooks();
  };
  
  // Handle search
  const onChangeSearch = (query) => {
    setSearchQuery(query);
    filterAndSortBooks(books, query, statusFilter, sortOrder);
  };
  
  // Handle status filter change
  const onStatusFilterChange = (status) => {
    setStatusFilter(status);
    filterAndSortBooks(books, searchQuery, status, sortOrder);
  };
  
  // Handle sort order change
  const onSortOrderChange = (order) => {
    setSortOrder(order);
    setSortMenuVisible(false);
    filterAndSortBooks(books, searchQuery, statusFilter, order);
  };
  
  // Delete book handler
  const handleDeleteBook = (bookId) => {
    Alert.alert(
      'Delete Book',
      'Are you sure you want to delete this book? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBook(bookId);
              setBooks(books.filter(book => book.id !== bookId));
              setFilteredBooks(filteredBooks.filter(book => book.id !== bookId));
              Alert.alert('Success', 'Book has been deleted');
            } catch (error) {
              console.error('Error deleting book:', error);
              Alert.alert('Error', 'Failed to delete the book');
            }
          }
        }
      ]
    );
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
  
  // Render book item
  const renderBookItem = ({ item }) => (
    <Card 
      style={styles.bookCard}
      onPress={() => navigation.navigate('BookDetails', { bookId: item.id })}
    >
      <Card.Content>
        <Title>{item.title}</Title>
        <Paragraph>By {item.author}</Paragraph>
        
        <View style={styles.bookDetails}>
          <View style={styles.bookInfo}>
            <Text style={styles.detailLabel}>ISBN:</Text>
            <Text style={styles.detailValue}>{item.isbn || 'N/A'}</Text>
          </View>
          
          <View style={styles.bookInfo}>
            <Text style={styles.detailLabel}>Status:</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>
                {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.cardActions}>
          <Button 
            icon="qrcode" 
            mode="text" 
            onPress={() => navigation.navigate('GenerateQR', { bookId: item.id })}
          >
            QR Code
          </Button>
          
          <View style={styles.cardIconButtons}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('BookDetails', { bookId: item.id })}
            >
              <MaterialCommunityIcons name="eye" size={20} color="#4A90E2" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => handleDeleteBook(item.id)}
            >
              <MaterialCommunityIcons name="delete" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
  
  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search by title, author, or ISBN"
        onChangeText={onChangeSearch}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          <Chip 
            selected={statusFilter === 'all'} 
            onPress={() => onStatusFilterChange('all')}
            style={styles.filterChip}
            selectedColor="#4A90E2"
          >
            All
          </Chip>
          <Chip 
            selected={statusFilter === 'available'} 
            onPress={() => onStatusFilterChange('available')}
            style={styles.filterChip}
            selectedColor="#4CD964"
          >
            Available
          </Chip>
          <Chip 
            selected={statusFilter === 'borrowed'} 
            onPress={() => onStatusFilterChange('borrowed')}
            style={styles.filterChip}
            selectedColor="#FF9500"
          >
            Borrowed
          </Chip>
          <Chip 
            selected={statusFilter === 'unavailable'} 
            onPress={() => onStatusFilterChange('unavailable')}
            style={styles.filterChip}
            selectedColor="#FF3B30"
          >
            Unavailable
          </Chip>
          
          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
              <Button 
                mode="outlined" 
                onPress={() => setSortMenuVisible(true)}
                style={styles.sortButton}
                icon="sort"
              >
                Sort
              </Button>
            }
          >
            <Menu.Item onPress={() => onSortOrderChange('title_asc')} title="Title (A-Z)" />
            <Menu.Item onPress={() => onSortOrderChange('title_desc')} title="Title (Z-A)" />
            <Menu.Item onPress={() => onSortOrderChange('author_asc')} title="Author (A-Z)" />
            <Menu.Item onPress={() => onSortOrderChange('author_desc')} title="Author (Z-A)" />
            <Divider />
            <Menu.Item onPress={() => onSortOrderChange('added_newest')} title="Date Added (Newest)" />
            <Menu.Item onPress={() => onSortOrderChange('added_oldest')} title="Date Added (Oldest)" />
            <Divider />
            <Menu.Item onPress={() => onSortOrderChange('most_borrowed')} title="Most Borrowed" />
          </Menu>
        </ScrollView>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading books...</Text>
        </View>
      ) : (
        <>
          {filteredBooks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="book-open-variant" size={64} color="#CCCCCC" />
              <Text style={styles.emptyText}>No books found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try changing your search or filters'
                  : 'Add your first book to get started'}
              </Text>
              
              {!searchQuery && statusFilter === 'all' && (
                <Button 
                  mode="contained"
                  onPress={() => navigation.navigate('AddBook')}
                  style={styles.addButton}
                >
                  Add Book
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
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('AddBook')}
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
  searchBar: {
    margin: 10,
    elevation: 2,
  },
  filtersContainer: {
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  filtersScroll: {
    paddingRight: 20,
  },
  filterChip: {
    marginRight: 8,
  },
  sortButton: {
    marginLeft: 8,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 5,
    textAlign: 'center',
  },
  addButton: {
    marginTop: 20,
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
  bookDetails: {
    marginTop: 10,
  },
  bookInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 5,
    width: 50,
  },
  detailValue: {
    fontSize: 14,
    color: '#333333',
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
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  cardIconButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 5,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4A90E2',
  },
});

export default BookListScreen;