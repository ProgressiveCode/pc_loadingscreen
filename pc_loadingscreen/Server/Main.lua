local handOverConfig = Progressive_Code_Loading_Screen_Config.Handover or {}

if handOverConfig.Enabled == false then
    return
end

AddEventHandler('playerConnecting', function(_, _, deferrals)
    local playerSource = source

    local loadingData = {}

    if handOverConfig.SendPlayerName then
        local playerName = GetPlayerName(playerSource)

        if type(playerName) == 'string' and playerName ~= '' then
            loadingData.name = playerName
        end
    end

    if handOverConfig.SendPopulation then
        loadingData.population = #GetPlayers()
        
        loadingData.capacity = GetConvarInt('sv_maxclients', 32)
    end

    deferrals.handover({ pc_loading = loadingData })
end)