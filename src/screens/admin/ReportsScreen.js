import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Divider,
  List,
  Chip,
  SegmentedButtons
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { getAllBooks } from '../../services/bookService';
import { getAllBorrows } from '../../services/borrowService';
import { getAllUsers } from '../../services/userService';

const ReportsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [bookStats, setBookStats] = useState(null);
  const [borrowStats, setBorrowStats] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const [popularBooks, setPopularBooks] = useState([]);
  const [activeBorrowers, setActiveBorrowers] = useState([]);
  const [overdueBooks, setOverdueBooks] = useState([]);
  
  useEffect(() => {
    loadReportData();
  }, [timeRange]);
  
  const loadReportData = async () => {
    try {
      setLoading(true);
      
      // Fetch all books, borrows, and users
      const books = await getAllBooks();
      const borrows = await getAllBorrows();
      const users = await getAllUsers();
      
      // Calculate statistics
      calculateStats(books, borrows, users);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const calculateStats = (books, borrows, users) => {
    // Filter data based on time range
    const now = new Date();
    const rangeDate = new Date();
    
    switch (timeRange) {
      case 'week':
        rangeDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        rangeDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        rangeDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    const filteredBorrows = borrows.filter(borrow => {
      const borrowDate = borrow.borrowDate.toDate();
      return borrowDate >= rangeDate;
    });
    
    // Book statistics
    const totalBooks = books.length;
    const availableBooks = books.filter(book => book.status === 'available').length;
    const borrowedBooks = books.filter(book => book.status === 'borrowed').length;
    const unavailableBooks = books.filter(book => book.status === 'unavailable').length;
    
    // Borrow statistics
    const totalBorrows = filteredBorrows.length;
    const activeBorrows = filteredBorrows.filter(borrow => borrow.status === 'borrowed').length;
    const returnedBorrows = filteredBorrows.filter(borrow => borrow.status === 'returned').length;
    
    // User statistics
    const totalUsers = users.filter(user => user.role === 'borrower').length;
    const activeUsers = new Set(filteredBorrows.map(borrow => borrow.borrowerId)).size;
    
    // Calculate daily borrows for chart data
    const dailyBorrows = getDailyBorrows(filteredBorrows, timeRange);
    
    // Find popular books
    const popularBooksData = findPopularBooks(books, borrows);
    
    // Find active borrowers
    const activeBorrowersData = findActiveBorrowers(users, borrows);
    
    // Find overdue books
    const overdueBooksData = findOverdueBooks(books, borrows);
    
    setBookStats({
      totalBooks,
      availableBooks,
      borrowedBooks,
      unavailableBooks,
      dailyBorrows
    });
    
    setBorrowStats({
      totalBorrows,
      activeBorrows,
      returnedBorrows
    });
    
    setUserStats({
      totalUsers,
      activeUsers
    });
    
    setPopularBooks(popularBooksData);
    setActiveBorrowers(activeBorrowersData);
    setOverdueBooks(overdueBooksData);
  };
  
  const getDailyBorrows = (borrows, range) => {
    // Generate daily borrow data for charts
    const labels = [];
    const data = [];
    const now = new Date();
    
    let numPoints = 7; // default for week
    if (range === 'month') numPoints = 30;
    if (range === 'year') numPoints = 12; // Monthly for year
    
    // Generate dates for the time range
    for (let i = numPoints - 1; i >= 0; i--) {
      const date = new Date();
      if (range === 'week' || range === 'month') {
        date.setDate(now.getDate() - i);
        labels.push(date.getDate().toString());
      } else if (range === 'year') {
        date.setMonth(now.getMonth() - i);
        labels.push(date.toLocaleString('default', { month: 'short' }));
      }
      data.push(0);
    }
    
    // Count borrows for each date
    borrows.forEach(borrow => {
      const borrowDate = borrow.borrowDate.toDate();
      let index = -1;
      
      if (range === 'week' || range === 'month') {
        // Find matching day
        for (let i = 0; i < numPoints; i++) {
          const date = new Date();
          date.setDate(now.getDate() - (numPoints - 1 - i));
          if (borrowDate.getDate() === date.getDate() && 
              borrowDate.getMonth() === date.getMonth() && 
              borrowDate.getFullYear() === date.getFullYear()) {
            index = i;
            break;
          }
        }
      } else if (range === 'year') {
        // Find matching month
        for (let i = 0; i < numPoints; i++) {
          const date = new Date();
          date.setMonth(now.getMonth() - (numPoints - 1 - i));
          if (borrowDate.getMonth() === date.getMonth() && 
              borrowDate.getFullYear() === date.getFullYear()) {
            index = i;
            break;
          }
        }
      }
      
      if (index !== -1) {
        data[index]++;
      }
    });
    
    return { labels, data };
  };
  
  const findPopularBooks = (books, borrows) => {
    // Count borrows for each book
    const bookBorrowCounts = {};
    
    borrows.forEach(borrow => {
      if (bookBorrowCounts[borrow.bookId]) {
        bookBorrowCounts[borrow.bookId]++;
      } else {
        bookBorrowCounts[borrow.bookId] = 1;
      }
    });
    
    // Map to books and sort by borrow count
    const popularBooks = books
      .map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.imageUrl,
        borrowCount: bookBorrowCounts[book.id] || 0
      }))
      .sort((a, b) => b.borrowCount - a.borrowCount)
      .slice(0, 5); // Top 5
    
    return popularBooks;
  };
  
  const findActiveBorrowers = (users, borrows) => {
    // Count borrows for each user
    const userBorrowCounts = {};
    
    borrows.forEach(borrow => {
      if (userBorrowCounts[borrow.borrowerId]) {
        userBorrowCounts[borrow.borrowerId]++;
      } else {
        userBorrowCounts[borrow.borrowerId] = 1;
      }
    });
    
    // Map to users and sort by borrow count
    const borrowers = users
      .filter(user => user.role === 'borrower')
      .map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        borrowCount: userBorrowCounts[user.id] || 0
      }))
      .sort((a, b) => b.borrowCount - a.borrowCount)
      .slice(0, 5); // Top 5
    
    return borrowers;
  };
  
  const findOverdueBooks = (books, borrows) => {
    const now = new Date();
    
    const overdueBorrows = borrows
      .filter(borrow => {
        // Check if book is still borrowed and overdue
        if (borrow.status !== 'borrowed') return false;
        const dueDate = borrow.dueDate.toDate();
        return dueDate < now;
      })
      .map(borrow => {
        const book = books.find(b => b.id === borrow.bookId);
        return {
          id: borrow.id,
          bookId: borrow.bookId,
          title: book ? book.title : 'Unknown',
          borrower: borrow.borrowerName,
          borrowDate: borrow.borrowDate.toDate(),
          dueDate: borrow.dueDate.toDate(),
          daysOverdue: Math.floor((now - borrow.dueDate.toDate()) / (1000 * 60 * 60 * 24))
        };
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
    
    return overdueBorrows;
  };
  
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports & Analytics</Text>
        <SegmentedButtons
          value={timeRange}
          onValueChange={setTimeRange}
          buttons={[
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
            { value: 'year', label: 'Year' }
          ]}
          style={styles.segmentedButtons}
        />
      </View>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Library Overview</Title>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#E1F5FE' }]}>
                <MaterialCommunityIcons name="book-multiple" size={24} color="#4A90E2" />
              </View>
              <Text style={styles.statValue}>{bookStats?.totalBooks || 0}</Text>
              <Text style={styles.statLabel}>Total Books</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
                <MaterialCommunityIcons name="book-open-variant" size={24} color="#4CD964" />
              </View>
              <Text style={styles.statValue}>{bookStats?.availableBooks || 0}</Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
                <MaterialCommunityIcons name="book-account" size={24} color="#FF9500" />
              </View>
              <Text style={styles.statValue}>{bookStats?.borrowedBooks || 0}</Text>
              <Text style={styles.statLabel}>Borrowed</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#F5F5F5' }]}>
                <MaterialCommunityIcons name="account-group" size={24} color="#8E8E93" />
              </View>
              <Text style={styles.statValue}>{userStats?.totalUsers || 0}</Text>
              <Text style={styles.statLabel}>Borrowers</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
                <MaterialCommunityIcons name="account-check" size={24} color="#4A90E2" />
              </View>
              <Text style={styles.statValue}>{userStats?.activeUsers || 0}</Text>
              <Text style={styles.statLabel}>Active Users</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
                <MaterialCommunityIcons name="book-check" size={24} color="#4CD964" />
              </View>
              <Text style={styles.statValue}>{borrowStats?.totalBorrows || 0}</Text>
              <Text style={styles.statLabel}>Total Borrows</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      {bookStats?.dailyBorrows && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Borrowing Trends</Title>
            <Paragraph style={styles.chartDescription}>
              Number of books borrowed over time
            </Paragraph>
            
            <LineChart
              data={{
                labels: bookStats.dailyBorrows.labels,
                datasets: [
                  {
                    data: bookStats.dailyBorrows.data,
                  }
                ]
              }}
              width={Dimensions.get('window').width - 40}
              height={220}
              chartConfig={{
                backgroundColor: '#FFFFFF',
                backgroundGradientFrom: '#FFFFFF',
                backgroundGradientTo: '#FFFFFF',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#4A90E2'
                }
              }}
              bezier
              style={styles.chart}
            />
          </Card.Content>
        </Card>
      )}
      
      {bookStats && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Book Status Distribution</Title>
            
            <PieChart
              data={[
                {
                  name: 'Available',
                  population: bookStats.availableBooks,
                  color: '#4CD964',
                  legendFontColor: '#333333',
                  legendFontSize: 12
                },
                {
                  name: 'Borrowed',
                  population: bookStats.borrowedBooks,
                  color: '#FF9500',
                  legendFontColor: '#333333',
                  legendFontSize: 12
                },
                {
                  name: 'Unavailable',
                  population: bookStats.unavailableBooks,
                  color: '#FF3B30',
                  legendFontColor: '#333333',
                  legendFontSize: 12
                }
              ]}
              width={Dimensions.get('window').width - 40}
              height={200}
              chartConfig={{
                backgroundColor: '#FFFFFF',
                backgroundGradientFrom: '#FFFFFF',
                backgroundGradientTo: '#FFFFFF',
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </Card.Content>
        </Card>
      )}
      
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Most Popular Books</Title>
          
          {popularBooks.length > 0 ? (
            popularBooks.map((book, index) => (
              <View key={book.id}>
                {index > 0 && <Divider style={styles.divider} />}
                <List.Item
                  title={book.title}
                  description={book.author}
                  left={() => (
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>{index + 1}</Text>
                    </View>
                  )}
                  right={() => (
                    <Chip style={styles.borrowCountChip}>
                      {book.borrowCount} borrows
                    </Chip>
                  )}
                />
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No borrowing data available</Text>
          )}
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Active Borrowers</Title>
          
          {activeBorrowers.length > 0 ? (
            activeBorrowers.map((user, index) => (
              <View key={user.id}>
                {index > 0 && <Divider style={styles.divider} />}
                <List.Item
                  title={user.name}
                  description={user.email}
                  left={() => (
                    <View style={styles.initialsCircle}>
                      <Text style={styles.initialsText}>
                        {getInitials(user.name)}
                      </Text>
                    </View>
                  )}
                  right={() => (
                    <Chip style={styles.borrowCountChip}>
                      {user.borrowCount} borrows
                    </Chip>
                  )}
                />
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No borrower data available</Text>
          )}
        </Card.Content>
      </Card>
      
      <Card style={[styles.card, styles.lastCard]}>
        <Card.Content>
          <View style={styles.cardTitleContainer}>
            <Title style={styles.cardTitle}>Overdue Books</Title>
            <Chip mode="outlined" style={styles.overdueCount}>
              {overdueBooks.length}
            </Chip>
          </View>
          
          {overdueBooks.length > 0 ? (
            overdueBooks.map((item, index) => (
              <View key={item.id}>
                {index > 0 && <Divider style={styles.divider} />}
                <List.Item
                  title={item.title}
                  description={`Borrowed by: ${item.borrower}`}
                  left={() => (
                    <MaterialCommunityIcons
                      name="clock-alert"
                      size={24}
                      color="#FF3B30"
                      style={styles.overdueIcon}
                    />
                  )}
                  right={() => (
                    <View style={styles.overdueInfo}>
                      <Text style={styles.overdueText}>
                        {item.daysOverdue} days overdue
                      </Text>
                      <Text style={styles.dueDateText}>
                        Due: {item.dueDate.toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                />
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No overdue books</Text>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  header: {
    padding: 15,
    paddingBottom: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  segmentedButtons: {
    marginBottom: 10,
  },
  card: {
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 10,
    elevation: 2,
  },
  lastCard: {
    marginBottom: 30,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  divider: {
    marginVertical: 8,
  },
  chartDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 10,
    marginTop: -5,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 10,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  borrowCountChip: {
    backgroundColor: '#E3F2FD',
    marginVertical: 3,
  },
  initialsCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontWeight: 'bold',
    color: '#666666',
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overdueCount: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FF3B30',
  },
  overdueIcon: {
    marginLeft: 5,
    marginRight: 10,
    alignSelf: 'center',
  },
  overdueInfo: {
    alignItems: 'flex-end',
  },
  overdueText: {
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 12,
  },
  dueDateText: {
    color: '#666666',
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#999999',
    marginVertical: 20,
  },
});

export default ReportsScreen;