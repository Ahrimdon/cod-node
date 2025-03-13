I made a web application that pulls stats from the call of duty API. It works perfectly, however I want to make some improvements to it. Given the linked GitHub repository, I want you to go through and add selections / options for all of the other possible API calls that can be made. I will provide you the documentation for each. Here is the documentation for each API call. I want you to integrate these extra calls nicely into the into my web application. Feel free to modify both the index.html and the server.js files to ensure each function has a button, field or option. The script works perfectly as it is so I do not want the core functionality changed.

Lifetime Statistics
Retrieve lifetime statistics.

Multiplayer
Copy
import { ModernWarfare, platforms } from "call-of-duty-api";

try {
   let data = await ModernWarfare.fullData(gamertag: string, platform: platforms)
} catch(Error) {
    //Handle Exception
}
Warzone
Copy
import { Warzone, platforms } from "call-of-duty-api";

try {
   let data = await Warzone.fullData(gamertag: string, platform: platforms)
} catch(Error) {
    //Handle Exception
}

---

Recent Match Details
Retrieve recent match information from the last 20 games played.

Multiplayer
Copy
import { ModernWarfare, platforms } from "call-of-duty-api";

try {
   let data = await ModernWarfare.combatHistory(gamertag: string, platform: platforms)
} catch(Error) {
    //Handle Exception
}
Warzone
Copy
import { Warzone, platforms } from "call-of-duty-api";

try {
   let data = await Warzone.combatHistory(gamertag: string, platform: platforms)
} catch(Error) {
    //Handle Exception
}

---

Match Information
Retrieve detailed information about a specific match.

Multiplayer
Copy
import { ModernWarfare, platforms } from "call-of-duty-api";

try {
   let data = await ModernWarfare.matchInfo(matchId: string, platform: platforms)
} catch(Error) {
    //Handle Exception
}
Warzone
Copy
import { Warzone, platforms } from "call-of-duty-api";

try {
   let data = await Warzone.matchInfo(matchId: string, platform: platforms)
} catch(Error) {
    //Handle Exception
}

---

Map List
Retrieve list of maps and their supported modes.

Copy
import { ModernWarfare, platforms } from "call-of-duty-api";

try {
   let data = await ModernWarfare.mapList(platform: platforms)
} catch(Error) {
    //Handle Exception
}

---

Cod Points
Retrieve COD Points count.

Logged in user only.

Copy
import { Me, platforms } from "call-of-duty-api";

try {
   let data = await Me.codPoints(gamertag: string, platform: platforms)
} catch(Error) {
    //Handle Exception
}

---

Connected Accounts
Retrieve accounts connected to logged in user.

Logged in user only.

Copy
import { Me, platforms } from "call-of-duty-api";

try {
   let data = await Me.connectedAccounts(gamertag: string, platform: platforms)
} catch(Error) {
    //Handle Exception
}

---

Event Feed
Retrieve information regarding friends activity.

Logged in user only.

Copy
import { Me } from "call-of-duty-api";

try {
   let data = await Me.eventFeed();
} catch(Error) {
    //Handle Exception
}

---

Identities
Retrieve list of games and the platforms linked.

Logged in user only.

Copy
import { Me } from "call-of-duty-api";

try {
   let data = await Me.loggedInIdentities()
} catch(Error) {
    //Handle Exception
}

---

Settings
Retrieve account settings.

Logged in user only.

Copy
import { Me, platforms } from "call-of-duty-api";

try {
   let data = await Me.settings(gamertag: string, platform: platforms)
} catch(Error) {
    //Handle Exception
}

---

Fuzzy Search
Lookup a gamertag and retrieve fuzzy matches and the related platform.

platform 'all' is valid and will search all possible platforms

Copy
import { Misc, platforms } from "call-of-duty-api";

try {
   let data = await Misc.search(gamertag: string, platform: platforms)
} catch(Error) {
    //Handle Exception
}
