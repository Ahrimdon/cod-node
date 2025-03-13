const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const API = require('call-of-duty-api');
const app = express();
const port = process.env.PORT || 3512;

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(__dirname));

// Store active sessions to avoid repeated logins
const activeSessions = new Map();

// Utility function to create a timeout promise
const timeoutPromise = (ms) => {
    return new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
    });
};

// API endpoint to fetch stats
app.post('/api/stats', async (req, res) => {
    console.log('Received request for /api/stats');
    try {
        const { username, ssoToken, platform, game } = req.body;
        
        console.log(`Request details - Username: ${username}, Platform: ${platform}, Game: ${game}`);
        
        if (!username || !ssoToken || !platform || !game) {
            console.log('Missing required parameters');
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        
        // Clear previous session if it exists
        if (activeSessions.has(ssoToken)) {
            console.log('Clearing previous session');
            activeSessions.delete(ssoToken);
        }
        
        // Login with the provided SSO token
        try {
            console.log('Attempting to login with SSO token');
            const loginResult = await Promise.race([
                API.login(ssoToken),
                timeoutPromise(10000) // 10 second timeout
            ]);
            
            console.log('Login successful:', loginResult);
            activeSessions.set(ssoToken, new Date());
        } catch (loginError) {
            console.error('Login error:', loginError);
            return res.status(200).json({ 
                status: 'error',
                error_type: 'LoginError',
                message: 'SSO token login failed', 
                details: loginError.message || 'Unknown login error',
                timestamp: new Date().toISOString()
            });
        }
        
        // Determine which API to call based on the selected game
        try {
            console.log(`Attempting to fetch ${game} data for ${username} on ${platform}`);
            let data;
            
            // Create a wrapped function for each API call to handle timeout
            const fetchWithTimeout = async (apiFn) => {
                return Promise.race([
                    apiFn(),
                    timeoutPromise(30000) // 30 second timeout
                ]);
            };
            
            // Check if the platform is valid for the game
            const requiresUno = ['mw2', 'wz2', 'mw3', 'wzm'].includes(game);
            if (requiresUno && platform !== API.platforms.Uno) {
                console.log(`${game} requires Uno ID`);
                return res.status(200).json({ 
                    status: 'error',
                    message: `${game} requires Uno ID (numerical ID)`,
                    timestamp: new Date().toISOString()
                });
            }
            
            switch (game) {
                case 'mw':
                    data = await fetchWithTimeout(() => API.ModernWarfare.fullData(username, platform));
                    break;
                case 'wz':
                    data = await fetchWithTimeout(() => API.Warzone.fullData(username, platform));
                    break;
                case 'mw2':
                    data = await fetchWithTimeout(() => API.ModernWarfare2.fullData(username));
                    break;
                case 'wz2':
                    data = await fetchWithTimeout(() => API.Warzone2.fullData(username));
                    break;
                case 'mw3':
                    data = await fetchWithTimeout(() => API.ModernWarfare3.fullData(username));
                    break;
                case 'cw':
                    data = await fetchWithTimeout(() => API.ColdWar.fullData(username, platform));
                    break;
                case 'vg':
                    data = await fetchWithTimeout(() => API.Vanguard.fullData(username, platform));
                    break;
                case 'wzm':
                    data = await fetchWithTimeout(() => API.WarzoneMobile.fullData(username));
                    break;
                default:
                    console.log('Invalid game selected:', game);
                    return res.status(200).json({ 
                        status: 'error',
                        message: 'Invalid game selected',
                        timestamp: new Date().toISOString()
                    });
            }
            
            console.log('Data fetched successfully');
            
            // Safely handle the response data
            if (!data) {
                console.log('No data returned from API');
                return res.json({ 
                    status: 'partial_success', 
                    message: 'No data returned from API, but no error thrown',
                    data: null,
                    timestamp: new Date().toISOString()
                });
            }
            
            console.log('Returning data to client');
            return res.json({
                status: 'success',
                data: data,
                timestamp: new Date().toISOString()
            });
            
        } catch (apiError) {
            console.error('API Error:', apiError);
            
            // Try to extract more useful information from the error
            let errorMessage = apiError.message || 'Unknown API error';
            let errorName = apiError.name || 'ApiError';
            
            // Handle the specific JSON parsing error
            if (errorName === 'SyntaxError' && errorMessage.includes('JSON')) {
                console.log('JSON parsing error detected');
                return res.status(200).json({
                    status: 'error',
                    message: 'Failed to parse API response. This usually means the SSO token is invalid or expired.',
                    error_type: 'InvalidResponseError',
                    timestamp: new Date().toISOString()
                });
            }
            
            // Send a more graceful response
            return res.status(200).json({
                status: 'error',
                message: errorMessage,
                error_type: errorName,
                timestamp: new Date().toISOString()
            });
        }
    } catch (serverError) {
        console.error('Server Error:', serverError);
        
        // Return a structured error response even for unexpected errors
        return res.status(200).json({
            status: 'server_error',
            message: 'The server encountered an unexpected error',
            error_details: serverError.message || 'Unknown server error',
            timestamp: new Date().toISOString()
        });
    }
});

// Basic health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
