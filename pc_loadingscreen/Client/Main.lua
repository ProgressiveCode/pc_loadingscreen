local resourceName = GetCurrentResourceName()

local lifecycle = Progressive_Code_Loading_Screen_Config.Lifecycle or {}

local statusConfig = Progressive_Code_Loading_Screen_Config.Status or {}

local isClosing = false

local isClosed = false

local function boundedNumber(value, default, maximum)
    local number = tonumber(value)

    if not number or number ~= number then
        return default
    end

    return math.floor(math.max(0, math.min(maximum, number)))
end

local function debugPrint(message)
    if Progressive_Code_Loading_Screen_Config.Debug then
        print(('[%s] %s'):format(resourceName, message))
    end
end

local function shutdownLoadingScreen()
    if isClosed then
        return
    end

    isClosing = true

    isClosed = true

    if type(ShutdownLoadingScreen) == 'function' then
        pcall(ShutdownLoadingScreen)
    end

    if type(ShutdownLoadingScreenNui) == 'function' then
        pcall(ShutdownLoadingScreenNui)
    end

    TriggerEvent('pc_loadingscreen:closed')

    debugPrint('Loading screen shut down.')
end

local function closeLoadingScreen()
    if isClosing or isClosed then
        return false
    end

    isClosing = true

    local fadeMs = boundedNumber(lifecycle.FadeMs, 900, 3000)

    SendLoadingScreenMessage(json.encode({ eventName = 'pc:close', fadeMs = fadeMs }))

    SetTimeout(fadeMs + 100, shutdownLoadingScreen)

    debugPrint(('Close requested (fade: %d ms).'):format(fadeMs))

    return true
end

exports('Close', closeLoadingScreen)

exports('SetStatus', function(message)
    if isClosing or isClosed or type(message) ~= 'string' then
        return false
    end

    local maxLength = boundedNumber(statusConfig.MaxLength, 160, 500)
    
    local cleanMessage = message:sub(1, maxLength)

    SendLoadingScreenMessage(json.encode({ eventName = 'pc:status', text = cleanMessage }))

    return true
end)

AddEventHandler('pc_loadingscreen:close', closeLoadingScreen)

AddEventHandler('playerSpawned', function()
    if lifecycle.AutoClose and lifecycle.CloseOnPlayerSpawned then
        closeLoadingScreen()
    end
end)

AddEventHandler('onResourceStop', function(oldResourceName)
    if oldResourceName == resourceName then
        shutdownLoadingScreen()
    end
end)

local maxRuntimeHoldMs = boundedNumber(lifecycle.MaxRuntimeHoldMs, 120000, 600000)

if maxRuntimeHoldMs > 0 then
    SetTimeout(maxRuntimeHoldMs, function()
        if not isClosing and not isClosed then
            debugPrint('Runtime safety limit reached; releasing loading screen.')

            closeLoadingScreen()
        end
    end)
end

if lifecycle.AutoClose then
    CreateThread(function()
        while not isClosing and not isClosed do
            if NetworkIsSessionStarted() then
                local readyDelayMs = boundedNumber(lifecycle.ReadyDelayMs, 1000, 10000)

                Wait(readyDelayMs)

                closeLoadingScreen()

                return
            end

            Wait(250)
        end
    end)
end