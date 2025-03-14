import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import {
  Avatar,
  Card,
  Button,
  List,
  Divider,
  Portal,
  Dialog
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getBorrowsByEmail } from '../../services/borrowService';

const ProfileScreen = ({ navigation }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [borrowStats, setBorrowStats] = useState({
    active: 0,
    returned: 0,
    overdue: 0
  });
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const { currentUser, getUserProfile, signOut } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        if (currentUser && currentUser.uid) {
          // Get user profile
          const profile = await getUserProfile(currentUser.uid);
          setUserProfile(profile);
          
          // Get borrowing statistics
          if (profile && profile.email) {
            const borrows = await getBorrowsByEmail(profile.email);
            
            // Calculate statistics
            const stats = {
              active: 0,
              returned: 0,
              overdue: 0
            };
            
            const now = new Date();
            
            borrows.forEach(borrow => {
              if (borrow.status === 'returned') {
                stats.returned++;
              } else {
                // Check if overdue
                const dueDate = borrow.dueDate.toDate();
                if (dueDate < now) {
                  stats.overdue++;
                } else {
                  stats.active++;
                }
              }
            });
            
            setBorrowStats(stats);
          }
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const handleSignOut = async () => {
    try {
      await signOut();
      // Navigation will be handled by AppNavigator based on auth state
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
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
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Portal>
        <Dialog
          visible={showSignOutDialog}
          onDismiss={() => setShowSignOutDialog(false)}
        >
          <Dialog.Title>Confirm Sign Out</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to sign out?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowSignOutDialog(false)}>Cancel</Button>
            <Button onPress={handleSignOut}>Sign Out</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Avatar.Text
              size={80}
              label={getInitials(userProfile?.name)}
              backgroundColor="#4A90E2"
            />
          </View>
          <Text style={styles.userName}>{userProfile?.name}</Text>
          <Text style={styles.userEmail}>{userProfile?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>Borrower</Text>
          </View>
        </View>

        <Card style={styles.statsCard}>
          <Card.Content style={styles.statsContent}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{borrowStats.active}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{borrowStats.returned}</Text>
              <Text style={styles.statLabel}>Returned</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, borrowStats.overdue > 0 && styles.overdueText]}>
                {borrowStats.overdue}
              </Text>
              <Text style={[styles.statLabel, borrowStats.overdue > 0 && styles.overdueText]}>
                Overdue
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.settingsCard}>
          <Card.Content>
            <List.Section>
              <List.Subheader>Account Settings</List.Subheader>
              
              <List.Item
                title="My Books"
                description="View your current and past borrows"
                left={props => <List.Icon {...props} icon="book-open-page-variant" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => navigation.navigate('MyBooksTab')}
                style={styles.listItem}
              />
              
              <Divider />
              
              <List.Item
                title="Edit Profile"
                description="Update your name, phone, and other details"
                left={props => <List.Icon {...props} icon="account-edit" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => Alert.alert('Coming Soon', 'This feature will be available in a future update.')}
                style={styles.listItem}
              />
              
              <Divider />
              
              <List.Item
                title="Change Password"
                description="Update your account password"
                left={props => <List.Icon {...props} icon="lock-reset" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => Alert.alert('Coming Soon', 'This feature will be available in a future update.')}
                style={styles.listItem}
              />
              
              <Divider />
              
              <List.Item
                title="Notifications"
                description="Manage your notification preferences"
                left={props => <List.Icon {...props} icon="bell-outline" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => Alert.alert('Coming Soon', 'This feature will be available in a future update.')}
                style={styles.listItem}
              />
              
              <Divider />
              
              <List.Item
                title="About Library App"
                description="Version 1.0.0"
                left={props => <List.Icon {...props} icon="information" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => Alert.alert('About', 'Library App v1.0.0\nA complete library management solution.')}
                style={styles.listItem}
              />
            </List.Section>
          </Card.Content>
        </Card>

        <Button
          mode="outlined"
          onPress={() => setShowSignOutDialog(true)}
          style={styles.signOutButton}
          icon="logout"
        >
          Sign Out
        </Button>
      </ScrollView>
    </View>
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
  },
  loadingText: {
    marginTop: 10,
    color: '#666666',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  avatarContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
  },
  userEmail: {
    fontSize: 16,
    color: '#666666',
    marginTop: 5,
  },
  roleBadge: {
    backgroundColor: '#E6F2FF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 15,
  },
  roleText: {
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  statsCard: {
    margin: 15,
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
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 5,
  },
  overdueText: {
    color: '#FF3B30',
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#EEEEEE',
  },
  settingsCard: {
    margin: 15,
    borderRadius: 10,
    elevation: 2,
  },
  listItem: {
    paddingVertical: 8,
  },
  signOutButton: {
    margin: 15,
    marginBottom: 30,
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
});

export default ProfileScreen;