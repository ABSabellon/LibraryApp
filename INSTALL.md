# Library App Installation Guide

This guide will help you set up and run the Library App on your local development environment.

## Prerequisites

- [Node.js](https://nodejs.org/en/) (v14.0.0 or newer)
- [npm](https://www.npmjs.com/get-npm) (v6.0.0 or newer) or [Yarn](https://yarnpkg.com/getting-started/install)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Firebase Account](https://firebase.google.com/)
- [Google Books API Key](https://developers.google.com/books/docs/v1/using)

## Installation Steps

1. **Clone the repository** (if using Git)
```bash
git clone https://github.com/your-username/library-app.git
cd library-app
```

2. **Install dependencies**
```bash
npm install
# or if you're using Yarn
yarn install
```

3. **Configure Firebase**

   a. Create a new Firebase project at [firebase.google.com](https://firebase.google.com/)
   
   b. Enable Authentication with Email/Password method
   
   c. Create a Firestore database
   
   d. Add your Firebase configuration in `/src/services/firebase.js`:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

4. **Get a Google Books API Key**

   a. Go to [Google Cloud Console](https://console.cloud.google.com/)
   
   b. Create a new project (or use existing one)
   
   c. Enable the Google Books API
   
   d. Create an API key and add it to your API requests in `bookService.js`

5. **Run the app in development mode**
```bash
npm start
# or
expo start
```

6. **Testing on devices**

   - Use the Expo Go app on your iOS/Android device and scan the QR code
   - Press `i` for iOS simulator (macOS only with Xcode installed)
   - Press `a` for Android emulator (requires Android Studio)
   - Press `w` for web browser

## Troubleshooting

- If you encounter dependency issues, try clearing the cache:
  ```bash
  expo start -c
  ```

- For Firebase errors, make sure your Firebase config is correct and you have the proper rules set up in Firestore.

- If camera scanning isn't working on a physical device, make sure you've granted camera permissions.

## Building for Production

When you're ready to create a production build:

- For iOS (requires Apple Developer account):
  ```bash
  expo build:ios
  ```

- For Android:
  ```bash
  expo build:android
  ```

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation Documentation](https://reactnavigation.org/docs/getting-started)
- [Firebase Documentation](https://firebase.google.com/docs)