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

// Helper function to ensure login
const ensureLogin = async (ssoToken) => {
    if (!activeSessions.has(ssoToken)) {
        console.log('Attempting to login with SSO token');
        const loginResult = await Promise.race([
            API.login(ssoToken),
            timeoutPromise(10000) // 10 second timeout
        ]);
        
        console.log('Login successful:', loginResult);
        activeSessions.set(ssoToken, new Date());
    } else {
        console.log('Using existing session');
    }
};

// Helper function to handle API errors
const handleApiError = (error, res) => {
    console.error('API Error:', error);
    
    // Try to extract more useful information from the error
    let errorMessage = error.message || 'Unknown API error';
    let errorName = error.name || 'ApiError';
    
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
};

// API endpoint to fetch stats
app.post('/api/stats', async (req, res) => {
    console.log('Received request for /api/stats');
    try {
        const { username, ssoToken, platform, game, apiCall } = req.body;
        
        console.log(`Request details - Username: ${username}, Platform: ${platform}, Game: ${game}, API Call: ${apiCall}`);
        
        if (!ssoToken) {
            return res.status(400).json({ error: 'SSO Token is required' });
        }
        
        // For mapList, username is not required
        if (apiCall !== 'mapList' && !username) {
            return res.status(400).json({ error: 'Username is required' });
        }
        
        // Clear previous session if it exists
        if (activeSessions.has(ssoToken)) {
            console.log('Clearing previous session');
            activeSessions.delete(ssoToken);
        }
        
        // Login with the provided SSO token
        try {
            await ensureLogin(ssoToken);
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
        
        // Create a wrapped function for each API call to handle timeout
        const fetchWithTimeout = async (apiFn) => {
            return Promise.race([
                apiFn(),
                timeoutPromise(30000) // 30 second timeout
            ]);
        };

        // Check if the platform is valid for the game
        const requiresUno = ['mw2', 'wz2', 'mw3', 'wzm'].includes(game);
        if (requiresUno && platform !== 'uno' && apiCall !== 'mapList') {
            console.log(`${game} requires Uno ID`);
            return res.status(200).json({ 
                status: 'error',
                message: `${game} requires Uno ID (numerical ID)`,
                timestamp: new Date().toISOString()
            });
        }
        
        try {
            console.log(`Attempting to fetch ${game} data for ${username} on ${platform}`);
            let data;
            
            if (apiCall === 'fullData') {
                // Fetch lifetime stats based on game
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
                        return res.status(200).json({ 
                            status: 'error',
                            message: 'Invalid game selected',
                            timestamp: new Date().toISOString()
                        });
                }
            } else if (apiCall === 'combatHistory') {
                // Fetch recent match history based on game
                switch (game) {
                    case 'mw':
                        data = await fetchWithTimeout(() => API.ModernWarfare.combatHistory(username, platform));
                        break;
                    case 'wz':
                        data = await fetchWithTimeout(() => API.Warzone.combatHistory(username, platform));
                        break;
                    case 'mw2':
                        data = await fetchWithTimeout(() => API.ModernWarfare2.combatHistory(username));
                        break;
                    case 'wz2':
                        data = await fetchWithTimeout(() => API.Warzone2.combatHistory(username));
                        break;
                    case 'mw3':
                        data = await fetchWithTimeout(() => API.ModernWarfare3.combatHistory(username));
                        break;
                    case 'cw':
                        data = await fetchWithTimeout(() => API.ColdWar.combatHistory(username, platform));
                        break;
                    case 'vg':
                        data = await fetchWithTimeout(() => API.Vanguard.combatHistory(username, platform));
                        break;
                    case 'wzm':
                        data = await fetchWithTimeout(() => API.WarzoneMobile.combatHistory(username));
                        break;
                    default:
                        return res.status(200).json({ 
                            status: 'error',
                            message: 'Invalid game selected',
                            timestamp: new Date().toISOString()
                        });
                }
            } else if (apiCall === 'mapList') {
                // Fetch map list (only valid for MW)
                if (game === 'mw') {
                    data = await fetchWithTimeout(() => API.ModernWarfare.mapList(platform));
                } else {
                    return res.status(200).json({ 
                        status: 'error',
                        message: 'Map list is only available for Modern Warfare',
                        timestamp: new Date().toISOString()
                    });
                }
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
            return handleApiError(apiError, res);
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

// API endpoint to fetch recent matches
app.post('/api/matches', async (req, res) => {
    console.log('Received request for /api/matches');
    try {
        const { username, ssoToken, platform, game } = req.body;
        
        console.log(`Request details - Username: ${username}, Platform: ${platform}, Game: ${game}`);
        
        if (!username || !ssoToken) {
            return res.status(400).json({ error: 'Username and SSO Token are required' });
        }
        
        try {
            await ensureLogin(ssoToken);
        } catch (loginError) {
            return res.status(200).json({ 
                status: 'error',
                error_type: 'LoginError',
                message: 'SSO token login failed', 
                details: loginError.message || 'Unknown login error',
                timestamp: new Date().toISOString()
            });
        }
        
        // Create a wrapped function for each API call to handle timeout
        const fetchWithTimeout = async (apiFn) => {
            return Promise.race([
                apiFn(),
                timeoutPromise(30000) // 30 second timeout
            ]);
        };
        
        try {
            console.log(`Attempting to fetch combat history for ${username} on ${platform}`);
            let data;
            
            // Check if the platform is valid for the game
            const requiresUno = ['mw2', 'wz2', 'mw3', 'wzm'].includes(game);
            if (requiresUno && platform !== 'uno') {
                return res.status(200).json({ 
                    status: 'error',
                    message: `${game} requires Uno ID (numerical ID)`,
                    timestamp: new Date().toISOString()
                });
            }
            
            // Fetch combat history based on game
            switch (game) {
                case 'mw':
                    data = await fetchWithTimeout(() => API.ModernWarfare.combatHistory(username, platform));
                    break;
                case 'wz':
                    data = await fetchWithTimeout(() => API.Warzone.combatHistory(username, platform));
                    break;
                case 'mw2':
                    data = await fetchWithTimeout(() => API.ModernWarfare2.combatHistory(username));
                    break;
                case 'wz2':
                    data = await fetchWithTimeout(() => API.Warzone2.combatHistory(username));
                    break;
                case 'mw3':
                    data = await fetchWithTimeout(() => API.ModernWarfare3.combatHistory(username));
                    break;
                case 'cw':
                    data = await fetchWithTimeout(() => API.ColdWar.combatHistory(username, platform));
                    break;
                case 'vg':
                    data = await fetchWithTimeout(() => API.Vanguard.combatHistory(username, platform));
                    break;
                case 'wzm':
                    data = await fetchWithTimeout(() => API.WarzoneMobile.combatHistory(username));
                    break;
                default:
                    return res.status(200).json({ 
                        status: 'error',
                        message: 'Invalid game selected',
                        timestamp: new Date().toISOString()
                    });
            }
            
            return res.json({
                status: 'success',
                data: data,
                timestamp: new Date().toISOString()
            });
            
        } catch (apiError) {
            return handleApiError(apiError, res);
        }
    } catch (serverError) {
        return res.status(200).json({
            status: 'server_error',
            message: 'The server encountered an unexpected error',
            error_details: serverError.message || 'Unknown server error',
            timestamp: new Date().toISOString()
        });
    }
});

// API endpoint to fetch match info
app.post('/api/matchInfo', async (req, res) => {
    console.log('Received request for /api/matchInfo');
    try {
        const { matchId, ssoToken, platform, game } = req.body;
        const mode = 'mp';
        
        console.log(`Request details - Match ID: ${matchId}, Platform: ${platform}, Game: ${game}`);
        
        if (!matchId || !ssoToken) {
            return res.status(400).json({ error: 'Match ID and SSO Token are required' });
        }
        
        try {
            await ensureLogin(ssoToken);
        } catch (loginError) {
            return res.status(200).json({ 
                status: 'error',
                error_type: 'LoginError',
                message: 'SSO token login failed', 
                details: loginError.message || 'Unknown login error',
                timestamp: new Date().toISOString()
            });
        }
        
        // Create a wrapped function for each API call to handle timeout
        const fetchWithTimeout = async (apiFn) => {
            return Promise.race([
                apiFn(),
                timeoutPromise(30000) // 30 second timeout
            ]);
        };
        
        try {
            console.log(`Attempting to fetch match info for match ID: ${matchId}`);
            let data;
            
            // Fetch match info based on game
            switch (game) {
                case 'mw':
                    data = await fetchWithTimeout(() => API.ModernWarfare.matchInfo(matchId, platform));
                    break;
                case 'wz':
                    data = await fetchWithTimeout(() => API.Warzone.matchInfo(matchId, platform));
                    break;
                case 'mw2':
                    data = await fetchWithTimeout(() => API.ModernWarfare2.matchInfo(matchId));
                    break;
                case 'wz2':
                    data = await fetchWithTimeout(() => API.Warzone2.matchInfo(matchId));
                    break;
                case 'mw3':
                    data = await fetchWithTimeout(() => API.ModernWarfare3.matchInfo(matchId));
                    break;
                case 'cw':
                    data = await fetchWithTimeout(() => API.ColdWar.matchInfo(matchId, platform));
                    break;
                case 'vg':
                    data = await fetchWithTimeout(() => API.Vanguard.matchInfo(matchId, platform));
                    break;
                case 'wzm':
                    data = await fetchWithTimeout(() => API.WarzoneMobile.matchInfo(matchId));
                    break;
                default:
                    return res.status(200).json({ 
                        status: 'error',
                        message: 'Invalid game selected',
                        timestamp: new Date().toISOString()
                    });
            }
            
            return res.json({
                status: 'success',
                data: data,
                timestamp: new Date().toISOString()
            });
            
        } catch (apiError) {
            return handleApiError(apiError, res);
        }
    } catch (serverError) {
        return res.status(200).json({
            status: 'server_error',
            message: 'The server encountered an unexpected error',
            error_details: serverError.message || 'Unknown server error',
            timestamp: new Date().toISOString()
        });
    }
});

// API endpoint for user-related API calls
app.post('/api/user', async (req, res) => {
    console.log('Received request for /api/user');
    try {
        const { username, ssoToken, platform, userCall } = req.body;
        
        console.log(`Request details - Username: ${username}, Platform: ${platform}, User Call: ${userCall}`);
        
        if (!ssoToken) {
            return res.status(400).json({ error: 'SSO Token is required' });
        }
        
        // For eventFeed and identities, username is not required
        if (!username && (userCall !== 'eventFeed' && userCall !== 'friendFeed' && userCall !== 'identities')) {
            return res.status(400).json({ error: 'Username is required for this API call' });
        }
        
        try {
            await ensureLogin(ssoToken);
        } catch (loginError) {
            return res.status(200).json({ 
                status: 'error',
                error_type: 'LoginError',
                message: 'SSO token login failed', 
                details: loginError.message || 'Unknown login error',
                timestamp: new Date().toISOString()
            });
        }
        
        // Create a wrapped function for each API call to handle timeout
        const fetchWithTimeout = async (apiFn) => {
            return Promise.race([
                apiFn(),
                timeoutPromise(30000) // 30 second timeout
            ]);
        };
        
        try {
            console.log(`Attempting to fetch user data for ${userCall}`);
            let data;
            
            // Fetch user data based on userCall
            switch (userCall) {
                case 'codPoints':
                    data = await fetchWithTimeout(() => API.Me.codPoints(username, platform));
                    break;
                case 'connectedAccounts':
                    data = await fetchWithTimeout(() => API.Me.connectedAccounts(username, platform));
                    break;
                case 'eventFeed':
                    data = await fetchWithTimeout(() => API.Me.eventFeed());
                    break;
                case 'friendFeed':
                    data = await fetchWithTimeout(() => API.Me.friendFeed(username, platform));
                    break;
                case 'identities':
                    data = await fetchWithTimeout(() => API.Me.loggedInIdentities());
                    break;
                case 'settings':
                    data = await fetchWithTimeout(() => API.Me.settings(username, platform));
                    break;
                default:
                    return res.status(200).json({ 
                        status: 'error',
                        message: 'Invalid user API call selected',
                        timestamp: new Date().toISOString()
                    });
            }
            
            return res.json({
                status: 'success',
                data: data,
                timestamp: new Date().toISOString()
            });
            
        } catch (apiError) {
            return handleApiError(apiError, res);
        }
    } catch (serverError) {
        return res.status(200).json({
            status: 'server_error',
            message: 'The server encountered an unexpected error',
            error_details: serverError.message || 'Unknown server error',
            timestamp: new Date().toISOString()
        });
    }
});

// API endpoint for fuzzy search
app.post('/api/search', async (req, res) => {
    console.log('Received request for /api/search');
    try {
        const { username, ssoToken, platform } = req.body;
        
        console.log(`Request details - Username to search: ${username}, Platform: ${platform}`);
        
        if (!username || !ssoToken) {
            return res.status(400).json({ error: 'Username and SSO Token are required' });
        }
        
        try {
            await ensureLogin(ssoToken);
        } catch (loginError) {
            return res.status(200).json({ 
                status: 'error',
                error_type: 'LoginError',
                message: 'SSO token login failed', 
                details: loginError.message || 'Unknown login error',
                timestamp: new Date().toISOString()
            });
        }
        
        // Create a wrapped function for each API call to handle timeout
        const fetchWithTimeout = async (apiFn) => {
            return Promise.race([
                apiFn(),
                timeoutPromise(30000) // 30 second timeout
            ]);
        };
        
        try {
            console.log(`Attempting fuzzy search for ${username} on platform ${platform}`);
            const data = await fetchWithTimeout(() => API.Misc.search(username, platform));
            
            return res.json({
                status: 'success',
                data: data,
                timestamp: new Date().toISOString()
            });
            
        } catch (apiError) {
            return handleApiError(apiError, res);
        }
    } catch (serverError) {
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
    res.sendFile(path.join(__dirname, 'index-new.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});