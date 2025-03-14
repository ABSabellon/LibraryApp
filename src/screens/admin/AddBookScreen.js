import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert
} from 'react-native';
import { TextInput, Button, Divider, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { getBookByBarcode, addBookToLibrary } from '../../services/bookService';

const AddBookScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  // Book data from scan or route params
  const initialBookData = route.params?.bookData || null;
  
  // Validation schema
  const BookSchema = Yup.object().shape({
    title: Yup.string().required('Title is required'),
    author: Yup.string().required('Author is required'),
    isbn: Yup.string(),
    publisher: Yup.string(),
    publishedDate: Yup.string(),
    description: Yup.string(),
    pageCount: Yup.number().integer().positive().nullable(),
    categories: Yup.string(),
    imageUrl: Yup.string().url().nullable(),
    location: Yup.string(),
    notes: Yup.string(),
  });
  
  // Handle scan book button
  const handleScanBook = () => {
    navigation.navigate('ScanBook', { returnToAddBook: true });
  };
  
  // Handle form submission
  const handleAddBook = async (values) => {
    try {
      setLoading(true);
      
      // Process categories to array if provided as comma-separated string
      let processedValues = { ...values };
      if (values.categories && typeof values.categories === 'string') {
        processedValues.categories = values.categories.split(',').map(cat => cat.trim());
      }
      
      // Add the book to the library
      await addBookToLibrary(processedValues);
      
      Alert.alert(
        'Success',
        'Book has been added to the library',
        [
          { text: 'Add Another', onPress: () => navigation.replace('AddBook') },
          { text: 'View Books', onPress: () => navigation.navigate('BookList') }
        ]
      );
    } catch (error) {
      console.error('Error adding book:', error);
      Alert.alert('Error', 'Failed to add the book to the library');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle search by ISBN
  const handleSearchISBN = async (isbn, setFieldValue) => {
    if (!isbn) {
      Alert.alert('Error', 'Please enter an ISBN');
      return;
    }
    
    try {
      setSearchLoading(true);
      const book = await getBookByISBN(isbn);
      
      if (book) {
        // Extract and map book data
        const volumeInfo = book.volumeInfo || {};
        
        setFieldValue('title', volumeInfo.title || '');
        setFieldValue('author', (volumeInfo.authors || []).join(', ') || '');
        setFieldValue('publisher', volumeInfo.publisher || '');
        setFieldValue('publishedDate', volumeInfo.publishedDate || '');
        setFieldValue('description', volumeInfo.description || '');
        setFieldValue('pageCount', volumeInfo.pageCount || null);
        setFieldValue('categories', (volumeInfo.categories || []).join(', ') || '');
        setFieldValue('imageUrl', volumeInfo.imageLinks?.thumbnail || null);
        
        Alert.alert('Success', 'Book details retrieved successfully');
      } else {
        Alert.alert('Not Found', 'No book found with this ISBN');
      }
    } catch (error) {
      console.error('Error searching book by ISBN:', error);
      Alert.alert('Error', 'Failed to search for the book');
    } finally {
      setSearchLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add New Book</Text>
          
          <Button
            mode="contained"
            icon="barcode-scan"
            onPress={handleScanBook}
            style={styles.scanButton}
            labelStyle={styles.scanButtonLabel}
          >
            Scan Book
          </Button>
        </View>
        
        <Formik
          initialValues={{
            title: initialBookData?.title || '',
            author: initialBookData?.author || '',
            isbn: initialBookData?.isbn || '',
            publisher: initialBookData?.publisher || '',
            publishedDate: initialBookData?.publishedDate || '',
            description: initialBookData?.description || '',
            pageCount: initialBookData?.pageCount || null,
            categories: initialBookData?.categories ? initialBookData.categories.join(', ') : '',
            imageUrl: initialBookData?.imageUrl || null,
            location: initialBookData?.location || '',
            notes: initialBookData?.notes || '',
          }}
          validationSchema={BookSchema}
          onSubmit={handleAddBook}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
            <View style={styles.formContainer}>
              {/* ISBN search field */}
              <View style={styles.isbnSearchContainer}>
                <TextInput
                  label="ISBN / Barcode"
                  value={values.isbn}
                  onChangeText={handleChange('isbn')}
                  onBlur={handleBlur('isbn')}
                  mode="outlined"
                  style={styles.isbnInput}
                  keyboardType="numeric"
                  left={<TextInput.Icon icon="barcode" />}
                />
                <Button
                  mode="contained"
                  onPress={() => handleSearchISBN(values.isbn, setFieldValue)}
                  loading={searchLoading}
                  disabled={searchLoading}
                  style={styles.searchButton}
                >
                  Search
                </Button>
              </View>
              
              <Divider style={styles.divider} />
              
              {/* Book cover preview */}
              {values.imageUrl ? (
                <View style={styles.coverPreviewContainer}>
                  <Image
                    source={{ uri: values.imageUrl }}
                    style={styles.coverImage}
                    resizeMode="contain"
                  />
                  <Button
                    icon="close"
                    mode="text"
                    onPress={() => setFieldValue('imageUrl', null)}
                    style={styles.removeCoverButton}
                  >
                    Remove
                  </Button>
                </View>
              ) : (
                <View style={styles.noCoverContainer}>
                  <MaterialCommunityIcons name="book-open-page-variant" size={64} color="#DDDDDD" />
                  <Text style={styles.noCoverText}>No cover image</Text>
                </View>
              )}
              
              {/* Book details form */}
              <TextInput
                label="Title *"
                value={values.title}
                onChangeText={handleChange('title')}
                onBlur={handleBlur('title')}
                mode="outlined"
                style={styles.input}
                error={touched.title && errors.title}
              />
              {touched.title && errors.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}
              
              <TextInput
                label="Author *"
                value={values.author}
                onChangeText={handleChange('author')}
                onBlur={handleBlur('author')}
                mode="outlined"
                style={styles.input}
                error={touched.author && errors.author}
              />
              {touched.author && errors.author && (
                <Text style={styles.errorText}>{errors.author}</Text>
              )}
              
              <TextInput
                label="Publisher"
                value={values.publisher}
                onChangeText={handleChange('publisher')}
                onBlur={handleBlur('publisher')}
                mode="outlined"
                style={styles.input}
              />
              
              <TextInput
                label="Published Date"
                value={values.publishedDate}
                onChangeText={handleChange('publishedDate')}
                onBlur={handleBlur('publishedDate')}
                mode="outlined"
                style={styles.input}
              />
              
              <TextInput
                label="Page Count"
                value={values.pageCount ? String(values.pageCount) : ''}
                onChangeText={(text) => setFieldValue('pageCount', text ? parseInt(text, 10) : null)}
                onBlur={handleBlur('pageCount')}
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
              />
              
              <TextInput
                label="Categories (comma separated)"
                value={values.categories}
                onChangeText={handleChange('categories')}
                onBlur={handleBlur('categories')}
                mode="outlined"
                style={styles.input}
              />
              
              <TextInput
                label="Image URL"
                value={values.imageUrl || ''}
                onChangeText={handleChange('imageUrl')}
                onBlur={handleBlur('imageUrl')}
                mode="outlined"
                style={styles.input}
              />
              
              <TextInput
                label="Location in Library"
                value={values.location}
                onChangeText={handleChange('location')}
                onBlur={handleBlur('location')}
                mode="outlined"
                style={styles.input}
              />
              
              <TextInput
                label="Description"
                value={values.description}
                onChangeText={handleChange('description')}
                onBlur={handleBlur('description')}
                mode="outlined"
                style={styles.textArea}
                multiline
                numberOfLines={4}
              />
              
              <TextInput
                label="Notes"
                value={values.notes}
                onChangeText={handleChange('notes')}
                onBlur={handleBlur('notes')}
                mode="outlined"
                style={styles.textArea}
                multiline
                numberOfLines={3}
              />
              
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.submitButton}
                loading={loading}
                disabled={loading}
              >
                Add Book to Library
              </Button>
            </View>
          )}
        </Formik>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  scanButton: {
    backgroundColor: '#4A90E2',
  },
  scanButtonLabel: {
    fontSize: 12,
  },
  formContainer: {
    width: '100%',
  },
  isbnSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  isbnInput: {
    flex: 1,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#4A90E2',
  },
  divider: {
    marginVertical: 15,
  },
  coverPreviewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  coverImage: {
    width: 120,
    height: 180,
    marginBottom: 10,
    borderRadius: 4,
    backgroundColor: '#F0F0F0',
  },
  removeCoverButton: {
    marginVertical: 5,
  },
  noCoverContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    marginBottom: 20,
  },
  noCoverText: {
    marginTop: 10,
    color: '#999999',
    fontSize: 14,
  },
  input: {
    marginBottom: 15,
  },
  textArea: {
    marginBottom: 15,
    height: 100,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
  },
  submitButton: {
    marginTop: 10,
    marginBottom: 30,
    padding: 5,
    backgroundColor: '#4A90E2',
  },
});

export default AddBookScreen;