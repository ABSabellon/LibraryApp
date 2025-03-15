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
  TextInput,
  Button,
  IconButton,
  Divider,
  Headline,
  Caption,
  Chip,
  FAB
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import {
  createAndSendInvite,
  getAllValidInvites
} from '../../services/adminService';
import * as Clipboard from 'expo-clipboard';

const ManageInvitesScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { currentUser, userRole, isSuperAdmin } = useAuth();

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    try {
      setRefreshing(true);
      setLoading(true);
      const validInvites = await getAllValidInvites();
      setInvites(validInvites);
    } catch (error) {
      console.error('Error loading invites:', error);
      Alert.alert('Error', 'Failed to load invites');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateInvite = async () => {
    // Validate email
    if (!email || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setSubmitting(true);
      const result = await createAndSendInvite(
        email,
        7, // 7 days expiry
        currentUser?.uid,
        'Library App'
      );

      if (result.sent) {
        Alert.alert(
          'Invite Sent',
          `Invitation code ${result.code} has been sent to ${email}`,
          [{ text: 'OK', onPress: () => setEmail('') }]
        );
      } else {
        Alert.alert(
          'Invite Created',
          `Invitation code ${result.code} has been created for ${email}, but the email could not be sent automatically. Please share the code manually.`,
          [{ text: 'Copy Code', onPress: () => Clipboard.setStringAsync(result.code) }]
        );
      }

      // Refresh the list
      loadInvites();
    } catch (error) {
      console.error('Error creating invite:', error);
      Alert.alert('Error', 'Failed to create invitation');
    } finally {
      setSubmitting(false);
    }
  };

  const copyInviteCode = async (code) => {
    await Clipboard.setStringAsync(code);
    Alert.alert('Copied', 'Invite code copied to clipboard');
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return timestamp.toDate().toLocaleDateString();
  };

  const renderInviteItem = ({ item }) => {
    const isExpiring = new Date(item.expiresAt.toDate()).getTime() - new Date().getTime() < 2 * 24 * 60 * 60 * 1000; // Less than 2 days

    return (
      <Card style={styles.inviteCard}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.emailText}>{item.email}</Text>
              <View style={styles.dateContainer}>
                <Caption>Created: {formatDate(item.createdAt)}</Caption>
                <Caption style={isExpiring ? styles.expiringText : null}>
                  Expires: {formatDate(item.expiresAt)}
                  {isExpiring && ' (Soon)'}
                </Caption>
              </View>
            </View>
            <Chip mode="outlined" style={styles.codeChip}>
              {item.code}
            </Chip>
          </View>
          
          <View style={styles.cardActions}>
            <Button
              mode="text"
              compact
              onPress={() => copyInviteCode(item.code)}
              icon="content-copy"
            >
              Copy Code
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
          <Headline style={styles.headerTitle}>Admin Invitations</Headline>
          {userRole === 'superadmin' && (
            <Chip mode="outlined" style={styles.superAdminChip}>Super Admin</Chip>
          )}
        </View>
      </View>

      {/* Only show the create invite card for superadmins */}
      {isSuperAdmin() && (
        <Card style={styles.createInviteCard}>
          <Card.Content>
            <Text style={styles.createInviteTitle}>Invite New Admin</Text>
            <Text style={styles.createInviteDescription}>
              Send an invitation code to create a new administrator account
            </Text>
            
            <TextInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.emailInput}
              keyboardType="email-address"
              autoCapitalize="none"
              left={<TextInput.Icon icon="email" />}
            />
            
            <Button
              mode="contained"
              onPress={handleCreateInvite}
              loading={submitting}
              disabled={submitting || !email}
              style={styles.sendButton}
              icon="send"
            >
              Send Invitation
            </Button>
          </Card.Content>
        </Card>
      )}
      
      {/* Message for regular admins */}
      {!isSuperAdmin() && (
        <Card style={styles.createInviteCard}>
          <Card.Content>
            <Text style={styles.createInviteTitle}>Admin Permissions</Text>
            <Text style={styles.createInviteDescription}>
              Only super administrators can create new admin invitations. You can view existing invitations below.
            </Text>
          </Card.Content>
        </Card>
      )}

      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Active Invitations</Text>
          <IconButton
            icon="refresh"
            size={20}
            onPress={loadInvites}
            disabled={refreshing}
          />
        </View>
        
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF9500" />
            <Text style={styles.loadingText}>Loading invitations...</Text>
          </View>
        ) : (
          <FlatList
            data={invites}
            renderItem={renderInviteItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={loadInvites}
                colors={['#FF9500']}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="email-outline"
                  size={60}
                  color="#CCCCCC"
                />
                <Text style={styles.emptyText}>
                  No active invitations found
                </Text>
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
    backgroundColor: '#FFE4B5',
    borderColor: '#FFA500',
  },
  createInviteCard: {
    margin: 16,
    borderRadius: 8,
  },
  createInviteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  createInviteDescription: {
    color: '#666666',
    marginBottom: 16,
  },
  emailInput: {
    marginBottom: 16,
  },
  sendButton: {
    backgroundColor: '#FF9500',
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
  inviteCard: {
    marginBottom: 8,
    borderRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  emailText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  dateContainer: {
    marginTop: 4,
  },
  expiringText: {
    color: '#FF3B30',
  },
  codeChip: {
    backgroundColor: '#F0F8FF',
    borderColor: '#4A90E2',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
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
    color: '#999999',
    fontSize: 16,
  },
});

export default ManageInvitesScreen;