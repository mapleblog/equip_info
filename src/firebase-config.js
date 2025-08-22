// 环境变量获取函数
function getEnvVar(name, fallback = '') {
    // 在浏览器环境中，环境变量通过构建工具注入
    // Vercel会自动处理VITE_前缀的环境变量
    if (typeof window !== 'undefined' && window.ENV) {
        return window.ENV[name] || fallback;
    }
    
    // 开发环境回退值
    const envVars = {
        'VITE_FIREBASE_API_KEY': 'AIzaSyBf0aVpRSE0NrM5DRhAzfNGwi66251JyBI',
        'VITE_FIREBASE_AUTH_DOMAIN': 'product-info-ccd5d.firebaseapp.com',
        'VITE_FIREBASE_DATABASE_URL': 'https://product-info-ccd5d-default-rtdb.asia-southeast1.firebasedatabase.app',
        'VITE_FIREBASE_PROJECT_ID': 'product-info-ccd5d',
        'VITE_FIREBASE_STORAGE_BUCKET': 'product-info-ccd5d.firebasestorage.app',
        'VITE_FIREBASE_MESSAGING_SENDER_ID': '641844047949',
        'VITE_FIREBASE_APP_ID': '1:641844047949:web:09d6d326bebcb3e180ec04',
        'VITE_FIREBASE_MEASUREMENT_ID': 'G-1X1V9TC42E'
    };
    
    return envVars[name] || fallback;
}

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
    authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
    databaseURL: getEnvVar('VITE_FIREBASE_DATABASE_URL'),
    projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnvVar('VITE_FIREBASE_APP_ID'),
    measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID')
};

// 验证配置
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('Firebase配置不完整，请检查环境变量设置');
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Expose the database instance
window.firebaseDB = {
    database: firebase.database(),
    productsRef: firebase.database().ref('products')
};
