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
  Alert,
  ScrollView,
  Button
} from 'react-native';
import { 
  Searchbar, 
  Chip, 
  Menu, 
  Divider,
  FAB,
  Card,
  Title,
  Paragraph
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAllBooks } from '../../services/bookService';

const CatalogScreen = ({ navigation }) => {
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
        (book.categories && book.categories.some(cat => cat.toLowerCase().includes(lowercaseQuery)))
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
      case 'rating_high':
        result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case 'rating_low':
        result.sort((a, b) => (a.averageRating || 0) - (b.averageRating || 0));
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
      onPress={() => navigation.navigate('BorrowerBookDetails', { bookId: item.id })}
    >
      <Card.Content style={styles.bookCardContent}>
        <View style={styles.bookInfo}>
          <Title style={styles.bookTitle}>{item.title}</Title>
          <Paragraph style={styles.bookAuthor}>by {item.author}</Paragraph>
          
          {item.categories && item.categories.length > 0 && (
            <View style={styles.categoriesContainer}>
              {item.categories.slice(0, 2).map((category, index) => (
                <Chip 
                  key={index} 
                  style={styles.categoryChip}
                  textStyle={styles.categoryChipText}
                >
                  {category}
                </Chip>
              ))}
              {item.categories.length > 2 && (
                <Text style={styles.moreCategoriesText}>+{item.categories.length - 2} more</Text>
              )}
            </View>
          )}
          
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>
                {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown'}
              </Text>
            </View>
            
            {item.averageRating > 0 && (
              <View style={styles.ratingContainer}>
                <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>{item.averageRating.toFixed(1)}</Text>
              </View>
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
  
  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search by title, author, or category"
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
          
          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
              <Button 
                title="Sort"
                mode="outlined" 
                onPress={() => setSortMenuVisible(true)}
                style={styles.sortButton}
                icon="sort"
              />
            }
          >
            <Menu.Item onPress={() => onSortOrderChange('title_asc')} title="Title (A-Z)" />
            <Menu.Item onPress={() => onSortOrderChange('title_desc')} title="Title (Z-A)" />
            <Menu.Item onPress={() => onSortOrderChange('author_asc')} title="Author (A-Z)" />
            <Menu.Item onPress={() => onSortOrderChange('author_desc')} title="Author (Z-A)" />
            <Divider />
            <Menu.Item onPress={() => onSortOrderChange('rating_high')} title="Highest Rated" />
            <Menu.Item onPress={() => onSortOrderChange('rating_low')} title="Lowest Rated" />
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
                  : 'The library catalog is empty'}
              </Text>
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
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    alignItems: 'center',
  },
  categoryChip: {
    marginRight: 5,
    marginBottom: 5,
    height: 24,
    backgroundColor: '#F0F0F0',
  },
  categoryChipText: {
    fontSize: 10,
    margin: 0,
  },
  moreCategoriesText: {
    fontSize: 10,
    color: '#999999',
    marginLeft: 5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
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
    marginLeft: 10,
  },
  ratingText: {
    marginLeft: 3,
    fontSize: 12,
    color: '#666666',
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

export default CatalogScreen;