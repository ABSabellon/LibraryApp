import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import {
  Card,
  Button,
  IconButton,
  Divider,
  Headline,
  Caption,
  Chip,
  Searchbar
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';

const ManageAdminsScreen = ({ navigation }) => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [promoting, setPromoting] = useState(null);
  const { currentUser, isSuperAdmin, promoteToSuperAdmin } = useAuth();

  // Check if user has permission to access this screen
  useEffect(() => {
    if (!isSuperAdmin()) {
      Alert.alert(
        'Access Denied',
        'Only super administrators can access this page',
        [{ text: 'Go Back', onPress: () => navigation.goBack() }]
      );
    }
  }, []);

  // Load all admin users
  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setRefreshing(true);
      setLoading(true);
      
      // Query admins who are not super admins
      const usersRef = collection(db, 'Users');
      const q = query(usersRef, where('profile.role', '==', 'admin'));
      
      const querySnapshot = await getDocs(q);
      const adminsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setAdmins(adminsList);
    } catch (error) {
      console.error('Error loading admins:', error);
      Alert.alert('Error', 'Failed to load admin accounts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePromoteToSuperAdmin = async (adminId, adminName) => {
    if (!isSuperAdmin()) {
      Alert.alert('Access Denied', 'Only super administrators can promote users');
      return;
    }
    
    // Confirm promotion
    Alert.alert(
      'Confirm Promotion',
      `Are you sure you want to promote ${adminName} to Super Administrator? This gives them complete access to all system functions, including admin invitations and promotions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Promote',
          style: 'destructive',
          onPress: async () => {
            try {
              setPromoting(adminId);
              
              await promoteToSuperAdmin(adminId);
              
              Alert.alert(
                'Success',
                `${adminName} has been promoted to Super Administrator`
              );
              
              // Refresh the list
              loadAdmins();
            } catch (error) {
              console.error('Error promoting admin:', error);
              Alert.alert('Error', error.message || 'Failed to promote admin');
            } finally {
              setPromoting(null);
            }
          }
        }
      ]
    );
  };

  const filterAdmins = () => {
    if (!searchQuery.trim()) return admins;
    
    const lowercaseQuery = searchQuery.toLowerCase();
    return admins.filter(admin => {
      const name = admin.profile?.name || '';
      const email = admin.profile?.email || '';
      return name.toLowerCase().includes(lowercaseQuery) || 
             email.toLowerCase().includes(lowercaseQuery);
    });
  };

  const renderAdminItem = ({ item }) => {
    const name = item.profile?.name || 'Unknown';
    const email = item.profile?.email || '';
    const phone = item.profile?.phone || '';
    const createdAt = item.timestamps?.created_at ? 
      new Date(item.timestamps.created_at.seconds * 1000).toLocaleDateString() : 'Unknown';
    
    return (
      <Card style={styles.adminCard}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.adminInfo}>
              <Text style={styles.adminName}>{name}</Text>
              <Text style={styles.adminEmail}>{email}</Text>
              {phone && <Text style={styles.adminDetail}>Phone: {phone}</Text>}
              <Text style={styles.adminDetail}>Created: {createdAt}</Text>
            </View>
            <Chip mode="outlined" style={styles.roleChip}>
              Admin
            </Chip>
          </View>
          
          <View style={styles.cardActions}>
            <Button
              mode="contained"
              onPress={() => handlePromoteToSuperAdmin(item.id, name)}
              loading={promoting === item.id}
              disabled={promoting !== null}
              icon="shield-account"
              style={styles.promoteButton}
            >
              Promote to Super Admin
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333333" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Headline style={styles.headerTitle}>Manage Administrators</Headline>
          <Chip mode="outlined" style={styles.superAdminChip}>Super Admin Access</Chip>
        </View>
      </View>

      <Searchbar
        placeholder="Search by name or email"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Administrator Accounts</Text>
          <IconButton
            icon="refresh"
            size={20}
            onPress={loadAdmins}
            disabled={refreshing}
          />
        </View>
        
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Loading administrators...</Text>
          </View>
        ) : (
          <FlatList
            data={filterAdmins()}
            renderItem={renderAdminItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={loadAdmins}
                colors={['#4A90E2']}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="account-alert"
                  size={60}
                  color="#CCCCCC"
                />
                <Text style={styles.emptyText}>
                  No administrators found
                </Text>
                {searchQuery ? (
                  <Text style={styles.emptySubtext}>
                    Try changing your search query
                  </Text>
                ) : null}
              </View>
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 10,
  },
  superAdminChip: {
    backgroundColor: '#F0F8FF',
    borderColor: '#4A90E2',
  },
  searchBar: {
    margin: 16,
    elevation: 2,
  },
  listContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  listContent: {
    paddingBottom: 16,
  },
  adminCard: {
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  adminEmail: {
    fontSize: 14,
    color: '#4A90E2',
    marginBottom: 4,
  },
  adminDetail: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  roleChip: {
    backgroundColor: '#FFF5E6',
    borderColor: '#FF9500',
  },
  cardActions: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  promoteButton: {
    backgroundColor: '#4A90E2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    marginTop: 16,
    color: '#666666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySubtext: {
    marginTop: 8,
    color: '#999999',
    fontSize: 14,
  },
});

export default ManageAdminsScreen;