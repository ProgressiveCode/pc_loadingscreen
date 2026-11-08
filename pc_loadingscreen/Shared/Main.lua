--> Config
Progressive_Code_Loading_Screen_Config = {}
--

--> Print helpful lifecycle messages in the server/client console.
Progressive_Code_Loading_Screen_Config.Debug = false
--

--> Loading screen lifecycle and automatic shutdown behavior.
Progressive_Code_Loading_Screen_Config.Lifecycle = {
    AutoClose = true, -- true to close when the network session is ready, or false to close it yourself with exports.pc_loadingscreen:Close().

    FadeMs = 900, -- Time used for the fade-out animation (milliseconds).

    ReadyDelayMs = 1000, -- Extra time to wait after the session becomes ready (milliseconds).

    MaxRuntimeHoldMs = 120000, -- Safety timeout measured from client script start. Set to 0 to disable it.

    CloseOnPlayerSpawned = true, -- Close when the playerSpawned event is received. This only applies when AutoClose is enabled.
}
--

--> Optional connection-time information passed to the loading screen.
Progressive_Code_Loading_Screen_Config.Handover = {
    Enabled = true,

    SendPlayerName = true,

    SendPopulation = true,
}
--

--> Limits for text sent through the SetStatus export.
Progressive_Code_Loading_Screen_Config.Status = {
    MaxLength = 160,
}
--