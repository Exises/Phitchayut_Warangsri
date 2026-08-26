const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Helper to preserve query string during proxy
const preserveQuery = (newUrl, originalUrl) => {
    const qIndex = originalUrl.indexOf('?');
    return qIndex > -1 ? newUrl + originalUrl.substring(qIndex) : newUrl;
};

// Action Router Middleware at ROOT level
app.use((req, res, next) => {
    if (req.path === '/api' || req.path === '/api/') {
        const action = req.body?.action || req.query?.action;
        
        if (action) {
            switch (action) {
                // CC Data
                case 'get_cc_data':
                    req.url = preserveQuery('/api/cc_data', req.url);
                    req.method = 'GET';
                    break;
                
                // Characters
                case 'get_user_characters':
                    req.url = `/api/character/user/${req.query.user_id}`;
                    req.method = 'GET';
                    break;
                case 'get_character_by_id':
                    req.url = `/api/character/${req.query.id}?user_id=${req.query.user_id || ''}`;
                    req.method = 'GET';
                    break;
                case 'save_character':
                    req.url = '/api/character/save';
                    break;
                case 'delete_character':
                    req.url = '/api/character/delete';
                    break;
                
                // Auth & Profile
                case 'register':
                    req.url = '/api/auth/register';
                    break;
                case 'login':
                    req.url = '/api/auth/login';
                    break;
                case 'update_profile':
                    req.url = '/api/auth/update_profile';
                    break;
                case 'change_password':
                    req.url = '/api/auth/change_password';
                    break;
                case 'verify_password':
                    req.url = '/api/auth/verify_password';
                    break;
                
                // Logs
                case 'add_character_log':
                    req.url = '/api/logs/add';
                    break;
                case 'get_character_logs':
                    req.url = preserveQuery('/api/logs/get', req.url);
                    break;
                case 'clear_character_logs':
                    req.url = '/api/logs/clear';
                    break;
                
                // Uploads
                case 'upload_avatar':
                    req.url = '/api/upload/avatar';
                    break;
                case 'delete_avatar':
                    req.url = '/api/upload/delete_avatar';
                    break;

                // Admin
                case 'get_admin_stats':
                    req.url = '/api/admin/stats';
                    break;
                case 'get_users':
                    req.url = '/api/admin/users';
                    break;
                case 'update_user':
                    req.url = '/api/admin/update_user';
                    break;
                case 'delete_user':
                    req.url = '/api/admin/delete_user';
                    break;
                case 'delete_compendium_item':
                    req.url = '/api/admin/delete_compendium_item';
                    break;
                case 'create_compendium_item':
                    req.url = '/api/admin/create_compendium_item';
                    break;
                case 'update_compendium_item':
                    req.url = '/api/admin/update_compendium_item';
                    break;
                
                // Feedback
                case 'submit_feedback':
                    req.url = '/api/feedback/submit';
                    break;
                case 'get_feedbacks':
                    req.url = '/api/feedback/get';
                    break;
                case 'get_user_feedbacks':
                    req.url = '/api/feedback/get_user';
                    break;
                case 'update_feedback':
                    req.url = '/api/feedback/update';
                    break;
                case 'delete_feedback':
                    req.url = '/api/feedback/delete';
                    break;
                case 'mark_feedback_read':
                    req.url = '/api/feedback/mark_read';
                    break;
            }
        } else if (req.query?.category || req.query?.q || req.query?.id || req.query?.index) {
            // For endpoints like /api?category=classes or /api?id=...&category=...
            req.url = preserveQuery('/api/cc_data', req.url);
            req.method = 'GET';
        }
    }
    next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/character', require('./routes/character'));
app.use('/api/cc_data', require('./routes/cc_data'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/dm', require('./routes/dmRoutes'));

// Catch-all for API root if needed
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Endpoint or action not implemented in Node.js yet', request: { body: req.body, query: req.query, path: req.path } });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
