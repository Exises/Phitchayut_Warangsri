import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="site-footer">
        <div className="footer-content">
            <p>&copy; 2025 Phitchayut Warangsri. Created for educational and private use only.</p>
            <p className="legal-small">This is an unofficial fan project. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.</p>
            <Link to="/legal" className="legal-link">View Full Legal Notice</Link>
        </div>
    </footer>
  );
}

export default Footer;