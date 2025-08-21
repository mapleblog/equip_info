// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: 'AIzaSyBf0aVpRSE0NrM5DRhAzfNGwi66251JyBI',
    authDomain: 'product-info-ccd5d.firebaseapp.com',
    databaseURL:
        'https://product-info-ccd5d-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'product-info-ccd5d',
    storageBucket: 'product-info-ccd5d.firebasestorage.app',
    messagingSenderId: '641844047949',
    appId: '1:641844047949:web:09d6d326bebcb3e180ec04',
    measurementId: 'G-1X1V9TC42E'
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Expose the database instance
window.firebaseDB = {
    database: firebase.database(),
    productsRef: firebase.database().ref('products')
};
