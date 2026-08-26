import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Import CSS หลักที่เราก๊อปปี้มา (ตรวจสอบว่าคุณวางไฟล์ไว้ที่ src/index.css หรือ src/styles/style.css)
// ถ้าคุณวางไว้ที่ src/index.css ให้ใช้บรรทัดนี้:
import './index.css';
import Swal from 'sweetalert2';

// Global override for window.alert to prevent blocking UI/Automation threads
window.alert = (message) => {
  Swal.fire({
    text: message,
    icon: 'info',
    confirmButtonText: 'OK',
    confirmButtonColor: '#3085d6',
    background: '#1a1a1a',
    color: '#ffffff'
  });
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)