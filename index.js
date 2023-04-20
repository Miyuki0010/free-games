const axios = require('axios');
const fs = require('fs');
const cron = require('node-cron');

// Function to fetch free games from the Epic Games Store
async function fetchGames() {
  const url = 'https://store-site-backend-static.epicgames.com/freeGamesPromotions?locale=en-US&country=US&allowCountries=US';
  try {
    const response = await axios.get(url);
    const data = response.data;
    const freeGames = data.promotions
      .filter(promo => promo.promotionalOffers[0].promotionalOffers[0].discountSetting.discountPercentage === 0)
      .map(promo => promo.title);
    return freeGames;
  } catch (error) {
    console.error('Error:', error.message);
    return [];
  }
}

// Function to fetch free games from Steam
async function fetchSteamGames() {
    const url = 'https://store.steampowered.com/api/freegames/page1';
    try {
      const response = await axios.get(url);
      const data = response.data;
      const freeGames = data.map(game => game.title);
      return freeGames;
    } catch (error) {
      console.error('Error:', error.message);
      return [];
    }
  }

// Function to post a toot on Mastodon using Axios
async function toot(status) {
  const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
  const url = `${config.instanceUrl}/api/v1/statuses`;
  const data = { status: status, visibility: 'public' };
  const headers = {
    'Authorization': `Bearer ${config.bearerToken}`,
    'Content-Type': 'application/json'
  };
  try {
    const response = await axios.post(url, data, { headers: headers });
    console.log('Tooted:', status);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Function to schedule a toot every morning at 8 AM
function scheduleToot() {
    cron.schedule('0 8 * * *', async () => {
        const epicGames = await fetchEpicGames();
        const steamGames = await fetchSteamGames();
        let status = '';
        if (epicGames.length > 0) {
          status += `Today's free games on Epic Games Store: ${epicGames.join(', ')}. 
          Get them now! #freegames #EpicGamesStore`;
        }
        if (steamGames.length > 0) {
          if (epicGames.length > 0) {
            status += '\n\n';
          }
            status += `Today's free games on Steam: ${steamGames.join(', ')}. 
            Get them now! #freegames #Steam`;
        }
        if (status !== '') {
          await toot(status);
        } else {
          console.log('No free games today.');
        }
    });
}
    
    // Main function
async function main() {
    scheduleToot();
}

function testBot() {
    console.log('Testing bot...');
  
    // Get the current date and time
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();
  
    // Create a test message
    const message = `Bot is running! Current time is ${time} on ${date}.`;
  
    // Post the test message to Mastodon
    toot(message);
}
    
// Call the main function
main();
