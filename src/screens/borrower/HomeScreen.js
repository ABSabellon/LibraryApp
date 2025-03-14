import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { Card, Title, Paragraph, Button, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { 
  getAllBooks,
  getHighestRatedBooks
} from '../../services/bookService';
import { 
  getBorrowsByEmail
} from '../../services/borrowService';

const HomeScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [myBooks, setMyBooks] = useState([]);
  const [libraryStats, setLibraryStats] = useState({
    totalBooks: 0,
    availableBooks: 0
  });
  
  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      // Get all books for stats
      const books = await getAllBooks();
      
      // Get featured/highest rated books
      const topRated = await getHighestRatedBooks(5);
      
      // Get user's borrowed books
      let borrowedBooks = [];
      if (currentUser && currentUser.email) {
        const borrows = await getBorrowsByEmail(currentUser.email);
        
        // For each borrow, fetch the book details
        for (const borrow of borrows) {
          const book = books.find(b => b.id === borrow.bookId);
          if (book) {
            borrowedBooks.push({
              ...book,
              borrowId: borrow.id,
              dueDate: borrow.dueDate
            });
          }
        }
      }
      
      // Calculate library stats
      const availableBooks = books.filter(book => book.status === 'available').length;
      
      setFeaturedBooks(topRated);
      setMyBooks(borrowedBooks);
      setLibraryStats({
        totalBooks: books.length,
        availableBooks
      });
      
    } catch (error) {
      console.error('Error loading home data:', error);
      Alert.alert('Error', 'Failed to load library data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadHomeData();
  };
  
  useEffect(() => {
    loadHomeData();
  }, [currentUser]);
  
  const renderFeaturedBook = (book) => (
    <TouchableOpacity
      key={book.id}
      onPress={() => navigation.navigate('CatalogTab', {
        screen: 'BorrowerBookDetails',
        params: { bookId: book.id }
      })}
    >
      <Card style={styles.featuredCard}>
        <Card.Cover 
          source={{ uri: book.imageUrl || 'https://via.placeholder.com/150x200?text=No+Cover' }} 
          style={styles.featuredCardImage}
        />
        <Card.Content style={styles.featuredCardContent}>
          <Title numberOfLines={1} style={styles.featuredCardTitle}>{book.title}</Title>
          <Paragraph numberOfLines={1} style={styles.featuredCardAuthor}>
            {book.author}
          </Paragraph>
          <View style={styles.ratingContainer}>
            <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>
              {book.averageRating ? book.averageRating.toFixed(1) : 'No ratings'}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
  
  const renderMyBook = (book) => {
    // Format due date
    const dueDate = book.dueDate ? new Date(book.dueDate.toDate()) : null;
    const formattedDueDate = dueDate ? dueDate.toLocaleDateString() : 'Unknown';
    
    // Check if book is overdue
    const isOverdue = dueDate && dueDate < new Date();
    
    return (
      <Card 
        key={book.id}
        style={styles.myBookCard}
        onPress={() => navigation.navigate('MyBooksTab', {
          screen: 'MyBookDetails',
          params: { bookId: book.id }
        })}
      >
        <Card.Content style={styles.myBookCardContent}>
          <View style={styles.myBookInfo}>
            <Title numberOfLines={2} style={styles.myBookTitle}>{book.title}</Title>
            <Paragraph style={styles.myBookAuthor}>{book.author}</Paragraph>
            
            <View style={styles.dueContainer}>
              <Text style={styles.dueLabel}>Due:</Text>
              <Text style={[
                styles.dueDate,
                isOverdue && styles.overdueDate
              ]}>
                {formattedDueDate}
              </Text>
              
              {isOverdue && (
                <Chip 
                  mode="outlined" 
                  textStyle={styles.overdueChipText}
                  style={styles.overdueChip}
                >
                  Overdue
                </Chip>
              )}
            </View>
          </View>
          
          {book.imageUrl ? (
            <Image
              source={{ uri: book.imageUrl }}
              style={styles.myBookCover}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.myBookCoverPlaceholder}>
              <MaterialCommunityIcons name="book-open-page-variant" size={40} color="#CCCCCC" />
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };
  
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#4A90E2']}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome, {currentUser?.displayName || 'Reader'}</Text>
      </View>
      
      <View style={styles.statsContainer}>
        <Card style={styles.statsCard}>
          <Card.Content style={styles.statsContent}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{libraryStats.totalBooks}</Text>
              <Text style={styles.statLabel}>Total Books</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{libraryStats.availableBooks}</Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{myBooks.length}</Text>
              <Text style={styles.statLabel}>My Books</Text>
            </View>
          </Card.Content>
        </Card>
      </View>
      
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('CatalogTab')}
        >
          <MaterialCommunityIcons name="book-search" size={32} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Browse Books</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('ScanTab')}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={32} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Scan Book</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Books</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('CatalogTab')}
          >
            <Text style={styles.seeAllButton}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredBooksContainer}
        >
          {featuredBooks.length > 0 ? (
            featuredBooks.map(book => renderFeaturedBook(book))
          ) : (
            <Text style={styles.emptyText}>No featured books available</Text>
          )}
        </ScrollView>
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Books</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('MyBooksTab')}
          >
            <Text style={styles.seeAllButton}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.myBooksContainer}>
          {myBooks.length > 0 ? (
            myBooks.map(book => renderMyBook(book))
          ) : (
            <View style={styles.emptyBooksContainer}>
              <MaterialCommunityIcons name="bookshelf" size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>You haven't borrowed any books yet</Text>
              <Button 
                mode="contained" 
                onPress={() => navigation.navigate('CatalogTab')}
                style={styles.browseButton}
              >
                Browse Library
              </Button>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#4A90E2',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statsContainer: {
    marginTop: -5,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statsCard: {
    elevation: 4,
    borderRadius: 10,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#EEEEEE',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 5,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  actionButton: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginTop: 8,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  seeAllButton: {
    color: '#4A90E2',
    fontSize: 14,
  },
  featuredBooksContainer: {
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  featuredCard: {
    width: 150,
    marginHorizontal: 5,
    elevation: 3,
    overflow: 'hidden',
  },
  featuredCardImage: {
    height: 200,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  featuredCardContent: {
    padding: 8,
    paddingBottom: 10,
  },
  featuredCardTitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  featuredCardAuthor: {
    fontSize: 12,
    lineHeight: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 3,
    color: '#666666',
  },
  myBooksContainer: {
    paddingHorizontal: 20,
  },
  myBookCard: {
    marginBottom: 10,
    elevation: 2,
  },
  myBookCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  myBookInfo: {
    flex: 1,
    marginRight: 10,
  },
  myBookTitle: {
    fontSize: 16,
    lineHeight: 20,
  },
  myBookAuthor: {
    fontSize: 14,
    lineHeight: 18,
    color: '#666666',
  },
  myBookCover: {
    width: 60,
    height: 90,
    borderRadius: 4,
  },
  myBookCoverPlaceholder: {
    width: 60,
    height: 90,
    borderRadius: 4,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  dueLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 5,
  },
  dueDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginRight: 8,
  },
  overdueDate: {
    color: '#FF3B30',
  },
  overdueChip: {
    height: 22,
    borderColor: '#FF3B30',
  },
  overdueChipText: {
    color: '#FF3B30',
    fontSize: 10,
    margin: 0,
  },
  emptyBooksContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#999999',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  browseButton: {
    marginTop: 15,
    backgroundColor: '#4A90E2',
  },
});

export default HomeScreen;