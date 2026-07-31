import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="site-footer">
        <div className="footer-content">
            <p>&copy; 2025 Phitchayut Warangsri. Created for educational and private use only.</p>
            <p className="legal-small">This is an unofficial fan project. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.</p>
            {/* ถ้ายังไม่มีหน้า Legal ลิงก์นี้อาจจะยังไม่ทำงาน แต่ใส่ไว้ก่อนได้ครับ */}
            <Link to="#" className="legal-link">View Full Legal Notice</Link>
        </div>
    </footer>
  );
}

export default Footer;