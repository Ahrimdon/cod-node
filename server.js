const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { login, platforms, Warzone, ModernWarfare, ModernWarfare2, ModernWarfare3, Warzone2, ColdWar, Vanguard, WarzoneMobile } = require('call-of-duty-api');
const app = express();
const port = process.env.PORT || 3512;

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(__dirname));

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
        
        // Login with the provided SSO token
        try {
            console.log('Attempting to login with SSO token');
            // Force a new login each time
            const loginResult = await Promise.race([
                login(ssoToken),
                timeoutPromise(10000) // 10 second timeout
            ]);
            console.log('Login successful');
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
            
            switch (game) {
                case 'mw':
                    data = await fetchWithTimeout(() => ModernWarfare.fullData(username, platform));
                    break;
                case 'wz':
                    data = await fetchWithTimeout(() => Warzone.fullData(username, platform));
                    break;
                case 'mw2':
                    if (platform !== platforms.Uno) {
                        console.log('MW2 requires Uno ID');
                        return res.status(200).json({ 
                            status: 'error',
                            message: 'MW2 requires Uno ID (numerical ID)',
                            timestamp: new Date().toISOString()
                        });
                    }
                    data = await fetchWithTimeout(() => ModernWarfare2.fullData(username));
                    break;
                case 'wz2':
                    if (platform !== platforms.Uno) {
                        console.log('Warzone 2 requires Uno ID');
                        return res.status(200).json({ 
                            status: 'error',
                            message: 'Warzone 2 requires Uno ID (numerical ID)',
                            timestamp: new Date().toISOString()
                        });
                    }
                    data = await fetchWithTimeout(() => Warzone2.fullData(username));
                    break;
                case 'mw3':
                    if (platform !== platforms.Uno) {
                        console.log('MW3 requires Uno ID');
                        return res.status(200).json({ 
                            status: 'error',
                            message: 'MW3 requires Uno ID (numerical ID)',
                            timestamp: new Date().toISOString()
                        });
                    }
                    data = await fetchWithTimeout(() => ModernWarfare3.fullData(username));
                    break;
                case 'cw':
                    data = await fetchWithTimeout(() => ColdWar.fullData(username, platform));
                    break;
                case 'vg':
                    data = await fetchWithTimeout(() => Vanguard.fullData(username, platform));
                    break;
                case 'wzm':
                    if (platform !== platforms.Uno) {
                        console.log('Warzone Mobile requires Uno ID');
                        return res.status(200).json({ 
                            status: 'error',
                            message: 'Warzone Mobile requires Uno ID (numerical ID)',
                            timestamp: new Date().toISOString()
                        });
                    }
                    data = await fetchWithTimeout(() => WarzoneMobile.fullData(username));
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
            let errorDetails = {
                message: apiError.message || 'Unknown API error',
                name: apiError.name,
                stack: apiError.stack,
                response: apiError.response
            };
            
            console.log('Error details:', JSON.stringify(errorDetails, null, 2));
            
            // Send a more graceful response that includes whatever data we might have
            return res.status(200).json({
                status: 'error',
                message: apiError.message || 'Unknown API error',
                partial_data: apiError.response || null,
                error_type: apiError.name,
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
