-- ================================================
--  PROGRESSIVE CODE
--  Copyright © 2026 Progressive Code
--  All Rights Reserved.
--  Unauthorized redistribution or resale prohibited.
--  See LICENSE.txt for license terms.
-- ================================================

--> FX Manifest Version
fx_version 'cerulean'
--

--> Red Dead Redemption 2 Warning
rdr3_warning 'I acknowledge that this is a prerelease build of RedM, and I am aware my resources *will* become incompatible once RedM ships.'
--

--> Game
game 'rdr3'
--

--> Author
author 'Progressive Code'
--

--> Description
description 'Progressive Code Loading Screen'
--

--> Version
version '1.0.0'
--

--> Shared Script
shared_script 'Shared/Main.lua'
--

--> Client Script
client_script 'Client/Main.lua'
--

--> Server Script
server_script 'Server/Main.lua'
--

--> Loading Screen
loadscreen 'Html/Index.html'

loadscreen_cursor 'yes'

loadscreen_manual_shutdown 'yes'
--

--> Included Files
files {
    'Html/Index.html',

    'Html/Js/*.js',

    'Html/Css/*.css',

    'Html/Images/*',

    'Html/Sounds/*',
}
--
