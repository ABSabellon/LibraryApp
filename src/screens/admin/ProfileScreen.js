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

const ProfileScreen = ({ navigation }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const { currentUser, getUserProfile, signOut, userRole, isSuperAdmin } = useAuth();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        if (currentUser && currentUser.uid) {
          const profile = await getUserProfile(currentUser.uid);
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  const handleSignOut = async () => {
    try {
      await signOut();
      // Navigation will be handled by app navigator based on auth state
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
          <View style={[styles.roleBadge, isSuperAdmin() ? styles.superAdminBadge : {}]}>
            <Text style={[styles.roleText, isSuperAdmin() ? styles.superAdminText : {}]}>
              {isSuperAdmin() ? 'Super Administrator' : 'Administrator'}
            </Text>
          </View>
        </View>

        <Card style={styles.settingsCard}>
          <Card.Content>
            <List.Section>
              <List.Subheader>Admin Tools</List.Subheader>
              
              <List.Item
                title="Manage Admin Invitations"
                description="Create and manage invites for new administrators"
                left={props => <List.Icon {...props} icon="email-plus" color="#FF9500" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => navigation.navigate('ManageInvites')}
                style={styles.listItem}
              />
              
              {isSuperAdmin() && (
                <>
                  <Divider />
                  
                  <List.Item
                    title="Manage Administrators"
                    description="Promote regular admins to super admins"
                    left={props => <List.Icon {...props} icon="shield-account" color="#4A90E2" />}
                    right={props => <List.Icon {...props} icon="chevron-right" />}
                    onPress={() => navigation.navigate('ManageAdmins')}
                    style={styles.listItem}
                  />
                </>
              )}
              
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
                title="App Settings"
                description="Notifications, theme, and other preferences"
                left={props => <List.Icon {...props} icon="cog" />}
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
    backgroundColor: '#FFF5E6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  roleText: {
    color: '#FF9500',
    fontWeight: 'bold',
  },
  superAdminBadge: {
    backgroundColor: '#F0F8FF',
    borderColor: '#4A90E2',
  },
  superAdminText: {
    color: '#4A90E2',
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