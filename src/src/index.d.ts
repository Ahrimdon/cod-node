declare enum platforms {
    All = "all",
    Activision = "acti",
    Battlenet = "battle",
    PSN = "psn",
    Steam = "steam",
    Uno = "uno",
    XBOX = "xbl",
    ios = "ios",
    NULL = "_"
}
declare enum games {
    ModernWarfare = "mw",
    ModernWarfare2 = "mw2",
    Vanguard = "vg",
    ColdWar = "cw",
    NULL = "_"
}
declare enum friendActions {
    Invite = "invite",
    Uninvite = "uninvite",
    Remove = "remove",
    Block = "block",
    Unblock = "unblock"
}
declare const enableDebugMode: () => boolean;
declare const disableDebugMode: () => boolean;
declare const login: (ssoToken: string) => boolean;
declare const telescopeLogin: (username: string, password: string) => Promise<boolean>;
declare class WZ {
    fullData: (gamertag: string, platform: platforms) => Promise<unknown>;
    combatHistory: (gamertag: string, platform: platforms) => Promise<unknown>;
    combatHistoryWithDate: (gamertag: string, startTime: number, endTime: number, platform: platforms) => Promise<unknown>;
    breakdown: (gamertag: string, platform: platforms) => Promise<unknown>;
    breakdownWithDate: (gamertag: string, startTime: number, endTime: number, platform: platforms) => Promise<unknown>;
    matchInfo: (matchId: string, platform: platforms) => Promise<unknown>;
    cleanGameMode: (mode: string) => Promise<string>;
}
declare class MW {
    fullData: (gamertag: string, platform: platforms) => Promise<unknown>;
    combatHistory: (gamertag: string, platform: platforms) => Promise<unknown>;
    combatHistoryWithDate: (gamertag: string, startTime: number, endTime: number, platform: platforms) => Promise<unknown>;
    breakdown: (gamertag: string, platform: platforms) => Promise<unknown>;
    breakdownWithDate: (gamertag: string, startTime: number, endTime: number, platform: platforms) => Promise<unknown>;
    matchInfo: (matchId: string, platform: platforms) => Promise<unknown>;
    seasonloot: (gamertag: string, platform: platforms) => Promise<unknown>;
    mapList: (platform: platforms) => Promise<unknown>;
}
declare class MW2 {
    fullData: (unoId: string) => Promise<unknown>;
    matches: (unoId: string) => Promise<unknown>;
    matchInfo: (unoId: string, matchId: string) => Promise<unknown>;
}
declare class WZ2 {
    fullData: (unoId: string) => Promise<unknown>;
    matches: (unoId: string) => Promise<unknown>;
    matchInfo: (unoId: string, matchId: string) => Promise<unknown>;
}
declare class MW3 {
    fullData: (unoId: string) => Promise<unknown>;
    matches: (unoId: string) => Promise<unknown>;
    matchInfo: (unoId: string, matchId: string) => Promise<unknown>;
}
declare class WZM {
    fullData: (unoId: string) => Promise<unknown>;
    matches: (unoId: string) => Promise<unknown>;
    matchInfo: (unoId: string, matchId: string) => Promise<unknown>;
}
declare class CW {
    fullData: (gamertag: string, platform: platforms) => Promise<unknown>;
    combatHistory: (gamertag: string, platform: platforms) => Promise<unknown>;
    combatHistoryWithDate: (gamertag: string, startTime: number, endTime: number, platform: platforms) => Promise<unknown>;
    breakdown: (gamertag: string, platform: platforms) => Promise<unknown>;
    breakdownWithDate: (gamertag: string, startTime: number, endTime: number, platform: platforms) => Promise<unknown>;
    seasonloot: (gamertag: string, platform: platforms) => Promise<unknown>;
    mapList: (platform: platforms) => Promise<unknown>;
    matchInfo: (matchId: string, platform: platforms) => Promise<unknown>;
}
declare class VG {
    fullData: (gamertag: string, platform: platforms) => Promise<unknown>;
    combatHistory: (gamertag: string, platform: platforms) => Promise<unknown>;
    combatHistoryWithDate: (gamertag: string, startTime: number, endTime: number, platform: platforms) => Promise<unknown>;
    breakdown: (gamertag: string, platform: platforms) => Promise<unknown>;
    breakdownWithDate: (gamertag: string, startTime: number, endTime: number, platform: platforms) => Promise<unknown>;
    seasonloot: (gamertag: string, platform: platforms) => Promise<unknown>;
    mapList: (platform: platforms) => Promise<unknown>;
    matchInfo: (matchId: string, platform: platforms) => Promise<unknown>;
}
declare class SHOP {
    purchasableItems: (gameId: string) => Promise<unknown>;
    bundleInformation: (title: string, bundleId: string) => Promise<unknown>;
    battlePassLoot: (title: games, season: number, platform: platforms) => Promise<unknown>;
}
declare class USER {
    friendFeed: (gamertag: string, platform: platforms) => Promise<unknown>;
    eventFeed: () => Promise<unknown>;
    loggedInIdentities: () => Promise<unknown>;
    codPoints: (gamertag: string, platform: platforms) => Promise<unknown>;
    connectedAccounts: (gamertag: string, platform: platforms) => Promise<unknown>;
    settings: (gamertag: string, platform: platforms) => Promise<unknown>;
    friendAction: (gamertag: string, platform: platforms, action: friendActions) => Promise<unknown>;
}
declare class ALT {
    search: (gamertag: string, platform: platforms) => Promise<unknown>;
    cleanWeapon: (weapon: string) => Promise<string>;
}
declare const Warzone: WZ;
declare const ModernWarfare: MW;
declare const ModernWarfare2: MW2;
declare const Warzone2: WZ2;
declare const ModernWarfare3: MW3;
declare const WarzoneMobile: WZM;
declare const ColdWar: CW;
declare const Vanguard: VG;
declare const Store: SHOP;
declare const Me: USER;
declare const Misc: ALT;
export { login, telescopeLogin, platforms, friendActions, Warzone, ModernWarfare, ModernWarfare2, ModernWarfare3, WarzoneMobile, Warzone2, ColdWar, Vanguard, Store, Me, Misc, enableDebugMode, disableDebugMode, };
