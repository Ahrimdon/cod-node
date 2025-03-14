let tutorialDismissed = false;
let currentData = null;
let outputFormat = "json";

// Initialize once DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
  initTabSwitching();
  addEnterKeyListeners();
  setupDownloadButton();
  setupFormatSelector();
  setupProcessingOptions();
  setupTimeOptions();
  addSyncListeners();
});

// Tab switching logic
function initTabSwitching() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((c) => c.classList.remove("active"));
  
      tab.classList.add("active");
      const tabId = tab.getAttribute("data-tab");
      document.getElementById(`${tabId}-tab`).classList.add("active");
    });
  });
}

// Setup processing options (sanitize/replace)
function setupProcessingOptions() {
  document.getElementById("sanitizeOption").addEventListener("change", function() {
    if (currentData) {
      // Re-fetch with new options
      const activeTab = document.querySelector(".tab.active").getAttribute("data-tab");
      triggerActiveTabButton();
    }
  });
  
  document.getElementById("replaceKeysOption").addEventListener("change", function() {
    if (currentData) {
      // Re-fetch with new options
      const activeTab = document.querySelector(".tab.active").getAttribute("data-tab");
      triggerActiveTabButton();
    }
  });
}

// Setup format selector
function setupFormatSelector() {
  document.getElementById("outputFormat").addEventListener("change", function() {
    outputFormat = this.value;
    if (currentData) {
      displayResults(currentData);
    }
  });
}

// Fetch stats (original functionality enhanced)
document.getElementById("fetchStats").addEventListener("click", async () => {
  const username = document.getElementById("username").value.trim();
  const ssoToken = document.getElementById("ssoToken").value.trim();
  const platform = document.getElementById("platform").value;
  const game = document.getElementById("game").value;
  const apiCall = document.getElementById("apiCall").value;

  const sanitize = document.getElementById("sanitizeOption").checked;
  const replaceKeys = document.getElementById("replaceKeysOption").checked;

  await fetchData("/api/stats", {
    username,
    ssoToken,
    platform,
    game,
    apiCall,
    sanitize,
    replaceKeys
  });
});

// Fetch match history
document.getElementById("fetchMatches").addEventListener("click", async () => {
  const username = document.getElementById("matchUsername").value.trim();
  const ssoToken = document.getElementById("ssoToken").value.trim();
  const platform = document.getElementById("matchPlatform").value;
  const game = document.getElementById("matchGame").value;
  
  const sanitize = document.getElementById("sanitizeOption").checked;
  const replaceKeys = document.getElementById("replaceKeysOption").checked;

  await fetchData("/api/matches", {
    username,
    ssoToken,
    platform,
    game,
    sanitize,
    replaceKeys
  });
});

// Fetch match details
document.getElementById("fetchMatchInfo").addEventListener("click", async () => {
  const matchId = document.getElementById("matchId").value.trim();
  const ssoToken = document.getElementById("ssoToken").value.trim();
  const platform = document.getElementById("matchPlatform").value;
  const game = document.getElementById("matchGame").value;
  
  const sanitize = document.getElementById("sanitizeOption").checked;
  const replaceKeys = document.getElementById("replaceKeysOption").checked;

  if (!matchId) {
    displayError("Match ID is required");
    return;
  }

  await fetchData("/api/matchInfo", {
    matchId,
    ssoToken,
    platform,
    game,
    sanitize,
    replaceKeys
  });
});

// Fetch user info
document.getElementById("fetchUserInfo").addEventListener("click", async () => {
  const username = document.getElementById("userUsername").value.trim();
  const ssoToken = document.getElementById("ssoToken").value.trim();
  const platform = document.getElementById("userPlatform").value;
  const userCall = document.getElementById("userCall").value;
  
  const sanitize = document.getElementById("sanitizeOption").checked;
  const replaceKeys = document.getElementById("replaceKeysOption").checked;

  // For event feed and identities, username is not required
  if (
    !username &&
    userCall !== "eventFeed" &&
    userCall !== "friendFeed" &&
    userCall !== "identities"
  ) {
    displayError("Username is required for this API call");
    return;
  }

  await fetchData("/api/user", {
    username,
    ssoToken,
    platform,
    userCall,
    sanitize,
    replaceKeys
  });
});

// Fuzzy search
document.getElementById("fuzzySearch").addEventListener("click", async () => {
  const username = document.getElementById("searchUsername").value.trim();
  const ssoToken = document.getElementById("ssoToken").value.trim();
  const platform = document.getElementById("searchPlatform").value;
  
  const sanitize = document.getElementById("sanitizeOption").checked;
  const replaceKeys = document.getElementById("replaceKeysOption").checked;

  if (!username) {
    displayError("Username is required for search");
    return;
  }

  await fetchData("/api/search", {
    username,
    ssoToken,
    platform,
    sanitize,
    replaceKeys
  });
});

// Improved YAML conversion function
function jsonToYAML(json) {
  const INDENT_SIZE = 2;
  
  function formatValue(value, indentLevel = 0) {
    const indent = ' '.repeat(indentLevel);
    
    if (value === null) return 'null';
    if (value === undefined) return '';
    
    if (typeof value === 'string') {
      // Check if string needs quotes (contains special chars)
      if (/[:{}[\],&*#?|\-<>=!%@`]/.test(value) || value === '' || !isNaN(value)) {
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      return value;
    }
    
    if (typeof value === 'number' || typeof value === 'boolean') {
      return value.toString();
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      let result = '';
      for (const item of value) {
        result += `\n${indent}- ${formatValue(item, indentLevel + INDENT_SIZE).trimStart()}`;
      }
      return result;
    }
    
    if (typeof value === 'object') {
      if (Object.keys(value).length === 0) return '{}';
      let result = '';
      for (const [key, val] of Object.entries(value)) {
        const formattedValue = formatValue(val, indentLevel + INDENT_SIZE);
        // If the formatted value is a multi-line value (array or object), add a line break
        if (formattedValue.includes('\n')) {
          result += `\n${indent}${key}:${formattedValue}`;
        } else {
          result += `\n${indent}${key}: ${formattedValue}`;
        }
      }
      return result;
    }
    
    return String(value);
  }
  
  return formatValue(json, 0).substring(1); // Remove first newline
}

// Common fetch function
async function fetchData(endpoint, requestData) {
  const errorElement = document.getElementById("error");
  const loadingElement = document.getElementById("loading");
  const resultsElement = document.getElementById("results");
  
  // Get all tutorial elements
  const tutorialElements = document.querySelectorAll(".tutorial");

  // Reset display
  errorElement.textContent = "";
  resultsElement.style.display = "none";
  loadingElement.style.display = "block";
  
  // Mark tutorial as dismissed when any button is clicked
  if (!tutorialDismissed) {
    tutorialDismissed = true;
    // Hide all tutorial elements
    tutorialElements.forEach(element => {
      element.style.display = "none";
    });
  }

  // Check for SSO Token
  if (!requestData.ssoToken) {
    errorElement.textContent = "SSO Token is required";
    loadingElement.style.display = "none";
    return;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    const data = await response.json();

    if (data.error) {
      displayError(data.error);
    } else if (data.status === "error") {
      displayError(data.message || "An error occurred");
    } else {
      currentData = data;
      displayResults(data);
    }
  } catch (error) {
    displayError(
      "An error occurred while fetching data. Please try again."
    );
    console.error("Error:", error);
  } finally {
    loadingElement.style.display = "none";
  }
}

// Update the displayResults function to handle time conversion
function displayResults(data) {
  const resultsElement = document.getElementById("results");
  const downloadContainer = document.getElementById("download-container");
  
  // Apply time conversion if enabled
  const convertTime = document.getElementById('convertTimeOption').checked;
  let displayData = data;
  
  if (convertTime) {
    const timezone = document.getElementById('timezoneSelect').value;
    displayData = processTimestamps(JSON.parse(JSON.stringify(data)), timezone);
  }
  
  // Format the data
  let formattedData = '';
  if (outputFormat === 'yaml') {
    formattedData = jsonToYAML(displayData);
    document.getElementById("downloadJson").textContent = "Download YAML Data";
  } else {
    formattedData = JSON.stringify(displayData, null, 2);
    document.getElementById("downloadJson").textContent = "Download JSON Data";
  }
  
  resultsElement.textContent = formattedData;
  resultsElement.style.display = "block";
  downloadContainer.style.display = "block";
}

// Helper function to display errors
function displayError(message) {
  const errorElement = document.getElementById("error");
  const loadingElement = document.getElementById("loading");
  const resultsElement = document.getElementById("results");

  errorElement.textContent = message;
  loadingElement.style.display = "none";
  
  // Clear previous results to ensure they can be redrawn
  resultsElement.style.display = "none";
  resultsElement.textContent = "";
  
  // Keep tutorial hidden if previously dismissed
  if (tutorialDismissed) {
    document.querySelectorAll(".tutorial").forEach(element => {
      element.style.display = "none";
    });
  }
}

function addEnterKeyListeners() {
  document.getElementById("ssoToken").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      triggerActiveTabButton();
    }
  });
  document.getElementById("username").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      triggerActiveTabButton();
    }
  });
  document.getElementById("matchUsername").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      document.getElementById("fetchMatches").click();
    }
  });
  document.getElementById("matchId").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      document.getElementById("fetchMatchInfo").click();
    }
  });
  document.getElementById("userUsername").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      document.getElementById("fetchUserInfo").click();
    }
  });
  document.getElementById("searchUsername").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      document.getElementById("fuzzySearch").click();
    }
  });
}

function triggerActiveTabButton() {
  const activeTab = document.querySelector(".tab.active").getAttribute("data-tab");
  switch (activeTab) {
    case "stats":
      document.getElementById("fetchStats").click();
      break;
    case "matches":
      document.getElementById("fetchMatches").click();
      break;
    case "user":
      document.getElementById("fetchUserInfo").click();
      break;
    case "other":
      document.getElementById("fuzzySearch").click();
      break;
  }
}

// Function to convert epoch time to human-readable format
function formatEpochTime(epoch, timezone) {
  if (!epoch) return epoch;
  
  // Check if epoch is in milliseconds (13 digits) or seconds (10 digits)
  const epochNumber = parseInt(epoch);
  if (isNaN(epochNumber)) return epoch;
  
  // Convert to milliseconds if needed
  const epochMs = epochNumber.toString().length <= 10 ? epochNumber * 1000 : epochNumber;
  
  // Parse the timezone offset
  let offset = 0;
  if (timezone !== 'UTC') {
    const match = timezone.match(/GMT([+-])(\d+)(?::(\d+))?/);
    if (match) {
      const sign = match[1] === '+' ? 1 : -1;
      const hours = parseInt(match[2]);
      const minutes = match[3] ? parseInt(match[3]) : 0;
      offset = sign * (hours * 60 + minutes) * 60 * 1000;
    }
  }
  
  // Create a date object and adjust for timezone
  const date = new Date(epochMs + offset);
  
  // Format the date
  return date.toUTCString().replace('GMT', timezone);
}

// Function to recursively process timestamps in the data
function processTimestamps(data, timezone, keysToConvert = ['utcStartSeconds', 'utcEndSeconds', 'timestamp', 'startTime', 'endTime']) {
  if (!data || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(item => processTimestamps(item, timezone, keysToConvert));
  }
  
  const result = {};
  for (const [key, value] of Object.entries(data)) {
    if (keysToConvert.includes(key) && typeof value === 'number') {
      result[key] = formatEpochTime(value, timezone);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = processTimestamps(value, timezone, keysToConvert);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

// Add this to your document.addEventListener("DOMContentLoaded", function() {...}) block
function setupTimeOptions() {
  const convertTimeCheckbox = document.getElementById('convertTimeOption');
  const timezoneSelect = document.getElementById('timezoneSelect');
  
  convertTimeCheckbox.addEventListener('change', function() {
    timezoneSelect.disabled = !this.checked;
    
    if (currentData) {
      displayResults(currentData); // Refresh the display
    }
  });
  
  timezoneSelect.addEventListener('change', function() {
    if (currentData) {
      displayResults(currentData); // Refresh the display
    }
  });
}

// Download Button
function setupDownloadButton() {
  const downloadBtn = document.getElementById("downloadJson");
  if (!downloadBtn) return;
  
  downloadBtn.addEventListener("click", function() {
    const resultsElement = document.getElementById("results");
    const jsonData = resultsElement.textContent;
    
    if (!jsonData) {
      alert("No data to download");
      return;
    }
    
    // Create a Blob with the data
    const contentType = outputFormat === 'yaml' ? 'text/yaml' : 'application/json';
    const blob = new Blob([jsonData], { type: contentType });
    
    // Create a temporary link element
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    
    // Generate a filename with timestamp
    const date = new Date();
    const timestamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}`;
    const extension = outputFormat === 'yaml' ? 'yaml' : 'json';
    a.download = `cod_stats_${timestamp}.${extension}`;
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
  });
}
// Function to synchronize username across tabs
function syncUsernames() {
  const mainUsername = document.getElementById("username").value.trim();
  
  // Only sync if there's a value
  if (mainUsername) {
    document.getElementById("matchUsername").value = mainUsername;
    document.getElementById("userUsername").value = mainUsername;
    document.getElementById("searchUsername").value = mainUsername;
  }
  
  // Also sync platform across tabs when it changes
  const mainPlatform = document.getElementById("platform").value;
  document.getElementById("matchPlatform").value = mainPlatform;
  document.getElementById("userPlatform").value = mainPlatform;
  document.getElementById("searchPlatform").value = mainPlatform;
}

// Add these event listeners to the DOMContentLoaded function
function addSyncListeners() {
  // Add change listeners for username sync
  document.getElementById("username").addEventListener("change", syncUsernames);
  document.getElementById("matchUsername").addEventListener("change", function() {
    document.getElementById("username").value = this.value;
    syncUsernames();
  });
  document.getElementById("userUsername").addEventListener("change", function() {
    document.getElementById("username").value = this.value;
    syncUsernames();
  });
  document.getElementById("searchUsername").addEventListener("change", function() {
    document.getElementById("username").value = this.value;
    syncUsernames();
  });
  
  // Add change listeners for platform sync
  document.getElementById("platform").addEventListener("change", syncUsernames);
}
