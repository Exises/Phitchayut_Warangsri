import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Import CSS หลักที่เราก๊อปปี้มา (ตรวจสอบว่าคุณวางไฟล์ไว้ที่ src/index.css หรือ src/styles/style.css)
// ถ้าคุณวางไว้ที่ src/index.css ให้ใช้บรรทัดนี้:
import './index.css' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)