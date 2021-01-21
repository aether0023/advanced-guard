const AdvancedGuardClient = require("./Client");
const { SERVER_ID, SAFE_BOTS, MAIN_TOKEN, AUTHOR, SAFE_USERS, STATUS, LOG_CHANNEL, VANITY_URL, VOICE_CHANNEL } = require("./configurations.json").DEFAULTS;
const { IGNORE_OWNER_MODE, OWNER_GUARD, DANGER_DETECTION, BOT_GUARD } = require("./configurations.json").SETTINGS;
const { approvedConsole, declinedConsole, logMessage, dangerModeControl, guardConsoleLog, clientAuthorSend } = require("./functions");
const chalk = require("chalk");
const client = new AdvancedGuardClient(MAIN_TOKEN);
const fetch = require("node-fetch");
const dangerPerms = ["ADMINSTRATOR", "KICK_MEMBERS", "MANAGE_GUILD", "BAN_MEMBERS", "MANAGE_ROLES", "MANAGE_WEBHOOKS", "MANAGE_CHANNELS"];
let dangerMode = false;
let dangerCount = 0;

client.on("ready", async () => {
    client.user.setPresence({ activity: { name: STATUS }, status: "dnd" });
    client.guilds.cache.get(SERVER_ID).channels.cache.get(VOICE_CHANNEL).join().catch();
    setInterval(async () => {
        if (DANGER_DETECTION === false) return;
        if (dangerMode === true) {
          await client.closeAllPermissionsFromRoles();  
          await dangerModeControl();
          approvedConsole("Danger Mode Control is successfully completed.")  
        };
    }, 1000*60*2);
    setInterval(async () => {
        dangerCount = 0;
        approvedConsole("Danger counts are reseted.")
    }, 1000*60*15);
});

client.on("roleUpdate", async (oldRole, newRole) => {
    let entry = await newRole.guild.fetchAuditLogs({ limit: 1, type: 'ROLE_UPDATE' }).then(x => x.entries.first());
    if (!entry || !entry.executor || (OWNER_GUARD === false && entry.executor.id == oldRole.guild.ownerID) || (IGNORE_OWNER_MODE.IGNORE_OWNERS === true && oldRole.guild.members.cache.get(entry.executor.id).roles.cache.has(IGNORE_OWNER_MODE.OWNER_ROLE)) || client.whitelisted(entry.executor.id)) return;
    await client.punish(entry.executor.id).catch();
    await guardConsoleLog(oldRole.guild, newRole.id, entry.executor.id, 0);
    await logMessage(oldRole.guild, `${entry.executor} (\`${entry.executor.id}\`) adlı kullanıcı bir rol güncelledi ve rolü eski haline geri çevirdim, daha detaylı bilgileri konsola attım.`).catch();
    if (dangerPerms.some(x => !oldRole.permissions.has(x) && newRole.permissions.has(x))) {
        newRole.setPermissions(oldRole.permissions);
    };
    newRole.edit({ ...oldRole });
});

client.on("roleDelete", async role => {
    let entry = await role.guild.fetchAuditLogs({ limit: 1, type: 'ROLE_DELETE' }).then(x => x.entries.first());
    if (!entry || !entry.executor || (OWNER_GUARD === false && entry.executor.id == role.guild.ownerID) || (IGNORE_OWNER_MODE.IGNORE_OWNERS === true && role.guild.members.cache.get(entry.executor.id).roles.cache.has(IGNORE_OWNER_MODE.OWNER_ROLE)) || client.whitelisted(entry.executor.id)) return;
    dangerCount++;
    if (dangerCount >= 3) {
        dangerMode = true;
        setTimeout(() => {
            dangerMode = false;
            dangerCount = 0;
        }, 1000*60*30);
    };
    await client.closeAllPermissionsFromRoles();
    await client.punish(entry.executor.id).catch();
    let newRole = await role.guild.roles.create({
        data: {
            name: role.name,
            color: role.hexColor,
            mentionable: role.mentionable,
            hoist: role.hoist,
            permissions: role.permissions,
            position: role.position
        }, reason: "Aether Role Guard"
    });
    await logMessage(role.guild, `${entry.executor} (\`${entry.executor.id}\`) adlı kullanıcı bir rol sildi ve rolü tekrar oluşturdum, daha detaylı bilgileri konsola attım.`).catch();
    await clientAuthorSend(role.guild, `Bir rol silindi, detaylara konsoldan göz atabilirsin!`).catch();
    await guardConsoleLog(role.guild, role.id, entry.executor.id, 1);
});

client.on("roleCreate", async role => {
    let entry = await role.guild.fetchAuditLogs({ limit: 1, type: 'ROLE_CREATE' }).then(x => x.entries.first());
    if (!entry || !entry.executor || (OWNER_GUARD === false && entry.executor.id == role.guild.ownerID) || (IGNORE_OWNER_MODE.IGNORE_OWNERS === true && role.guild.members.cache.get(entry.executor.id).roles.cache.has(IGNORE_OWNER_MODE.OWNER_ROLE)) || client.whitelisted(entry.executor.id)) return;
    await client.punish(entry.executor.id).catch();
    await guardConsoleLog(role.guild, role.id, entry.executor.id, 2);
    await role.delete();
    await logMessage(role.guild, `${entry.executor} (\`${entry.executor.id}\`) adlı üye bir rol oluşturdu ve rol silindi.`);
});

client.on("channelUpdate", async (oldChannel, newChannel) => {
    let entry = await newChannel.guild.fetchAuditLogs({type: 'CHANNEL_UPDATE'}).then(x => x.entries.first());
    if (!entry || !entry.executor || (OWNER_GUARD === false && entry.executor.id == oldChannel.guild.ownerID) || (IGNORE_OWNER_MODE.IGNORE_OWNERS === true && oldChannel.guild.members.cache.get(entry.executor.id).roles.cache.has(IGNORE_OWNER_MODE.OWNER_ROLE)) || client.whitelisted(entry.executor.id)) return;
    await client.punish(entry.executor.id).catch();
    await logMessage(oldChannel.guild, `${entry.executor} (\`${entry.executor.id}\`) adlı üye **${oldChannel.name}** adlı kanal üzerinde değişiklik yaptı ve kanal geri eski haline getirildi.`);
    await guardConsoleLog(oldChannel.guild, oldChannel.id, entry.executor.id, 3);
    if (newChannel.type !== "category" && newChannel.parentID !== oldChannel.parentID) newChannel.setParent(oldChannel.parentID);
    if (newChannel.type == "text") {
        newChannel.edit({
            name: oldChannel.name,
            nsfw: oldChannel.nsfw,
            topic: oldChannel.topic,
            rateLimitPerUser: oldChannel.rateLimitPerUser
        });
    } else if (newChannel.type == "voice") {
        newChannel.edit({
            name: oldChannel.name,
            userLimit: oldChannel.userLimit
        });
    } else if (newChannel.type == "category") {
        newChannel.edit({
            name: oldChannel.name
        });
    };

    oldChannel.permissionOverwrites.forEach(x => {
        let o = {};
        x.allow.toArray().forEach(p => {
          o[p] = true;
        });
        x.deny.toArray().forEach(p => {
          o[p] = false;
        });
        newChannel.createOverwrite(x.id, o);
      });
});

client.on("channelDelete", async channel => {
    let entry = await channel.guild.fetchAuditLogs({ limit: 1, type: 'CHANNEL_DELETE' }).then(x => x.entries.first());
    if (!entry || !entry.executor || (OWNER_GUARD === false && entry.executor.id == channel.guild.ownerID) || (IGNORE_OWNER_MODE.IGNORE_OWNERS === true && channel.guild.members.cache.get(entry.executor.id).roles.cache.has(IGNORE_OWNER_MODE.OWNER_ROLE)) || client.whitelisted(entry.executor.id)) return;
    dangerCount++;
    if (dangerCount >= 3) {
        dangerMode = true;
        setTimeout(() => {
            dangerMode = false;
            dangerCount = 0;
        }, 1000*60*30);
    };
    await client.closeAllPermissionsFromRoles();
    await client.punish(entry.executor.id).catch();
    await clientAuthorSend(channel.guild, `Bir kanal silindi, detaylara konsoldan göz atabilirsin!`).catch();
    await logMessage(channel.guild, `${entry.executor} (\`${entry.executor.id}\`) adlı üye **${channel.name}** adlı kanalı sildi ve kanal tekrar oluşturuldu, detaylı bilgi için konsolu inceleyebilirsin.`);
    await channel.clone().then(async (c) => {
        if (channel.parentID != null) await c.setParent(channel.parentID);
        await c.setPosition(channel.position);
        await guardConsoleLog(channel.guild, c.id, entry.executor.id, 4);
        if (channel.type == "category") await channel.guild.channels.cache.filter(x => x.parentID == channel.id).forEach(y => y.setParent(c.id));        
    });
});

client.on("channelCreate", async channel => {
    let entry = await channel.guild.fetchAuditLogs({ limit: 1, type: 'CHANNEL_CREATE' }).then(x => x.entries.first());
    if (!entry || !entry.executor || (OWNER_GUARD === false && entry.executor.id == channel.guild.ownerID) || (IGNORE_OWNER_MODE.IGNORE_OWNERS === true && channel.guild.members.cache.get(entry.executor.id).roles.cache.has(IGNORE_OWNER_MODE.OWNER_ROLE)) || client.whitelisted(entry.executor.id)) return;
    await client.punish(entry.executor.id).catch();
    await logMessage(channel.guild, `${entry.executor} (\`${entry.executor.id}\`) adlı üye **${channel.name}** adlı kanalı açtı ve sunucudan uzaklaştırıldı.`);
    await guardConsoleLog(channel.guild, channel.id, entry.executor.id, 5);
    await channel.delete();
});

client.on("guildBanAdd", async (guild, user) => {
    let entry = await guild.fetchAuditLogs({ limit: 1, type: 'MEMBER_BAN_ADD' }).then(x => x.entries.first());
    if (!entry || !entry.executor || (OWNER_GUARD === false && entry.executor.id == guild.ownerID) || (IGNORE_OWNER_MODE.IGNORE_OWNERS === true && guild.members.cache.get(entry.executor.id).roles.cache.has(IGNORE_OWNER_MODE.OWNER_ROLE)) || client.whitelisted(entry.executor.id)) return;
    await client.punish(entry.executor.id).catch();
    await logMessage(guild, `${entry.executor} (\`${entry.executor.id}\`) adlı üye **${user.tag}** adlı üyeye sağ tık ban attı ve sunucudan uzaklaştırıldı.`);
    await guardConsoleLog(guild, user.id, entry.executor.id, 6);
    await guild.members.unban(user.id).catch();

});

client.on("guildMemberUpdate", async (oldMember, newMember) => {
    let entry = await oldMember.guild.fetchAuditLogs({ limit: 1, type: 'MEMBER_ROLE_UPDATE' }).then(x => x.entries.first());
    if (!entry || !entry.executor || (OWNER_GUARD === false && entry.executor.id == oldMember.guild.ownerID) || (IGNORE_OWNER_MODE.IGNORE_OWNERS === true && oldMember.guild.members.cache.get(entry.executor.id).roles.cache.has(IGNORE_OWNER_MODE.OWNER_ROLE)) || client.whitelisted(entry.executor.id)) return;
    if (oldMember.roles.cache.size == newMember.roles.cache.size) return;
    if (dangerPerms.some(x => !oldMember.hasPermission(x) && newMember.hasPermission(x))) {
        await client.punish(entry.executor.id).catch();
        await logMessage(oldMember.guild, `${entry.executor} (\`${entry.executor.id}\`) adlı üye **${oldMember.displayName}** adlı üyeye sağ tıkla yetki vermeye çalıştı ve üye sunucudan uzaklaştırılıp üye geri eski haline çevrildi.`);
        await guardConsoleLog(oldMember.guild, oldMember.id, entry.executor.id, 7);
        newMember.roles.set(oldMember.roles.array()).catch();
    };
});

client.on("guildUpdate", async (oldGuild, newGuild) => {
    const entry = await oldGuild.fetchAuditLogs({ limit: 1, type: "GUILD_UPDATE" }).then(audit => audit.entries.first());
    await guardConsoleLog(oldGuild, oldGuild.vanityURLCode, entry.executor.id, 8, newGuild.vanityURLCode);
    if(oldGuild.vanityURLCode !== newGuild.vanityURLCode) {
        dangerCount++;
        dangerMode = true;
            setTimeout(() => {
                dangerMode = false;
                dangerCount = 0;
            }, 1000*60*30);
        await client.punish(entry.executor.id).catch();
        await client.closeAllPermissionsFromRoles();
        await clientAuthorSend(oldGuild, `${oldGuild.name} adlı sunucunun URLsi değiştirilmeye çalışıldı, detaylara konsoldan göz atabilirsin.`).catch();
        await logMessage(oldGuild, `${entry.executor} (\`${entry.executor.id}\`) adlı üye URLyi değiştirdi ve eski haline getirildi!`);
        await fetch(`https://discord.com/api/guilds/${newGuild.id}/vanity-url`,{
            method: "PATCH",
            headers: { 'Authorization': 'Bot ' + client.token, 'Content-Type': 'application/json'},
            body: JSON.stringify({code: VANITY_URL})
    
        }).then(res => res.json())
         .then(json => { console.log(json)})
         .catch(err => console.log(err));
        await newGuild.edit({ 
            name: oldGuild.name, 
            icon: oldGuild.iconURL({ dynamic: true }), 
            banner: oldGuild.bannerURL(), 
            region: oldGuild.region, 
            verificationLevel: oldGuild.verificationLevel, 
            explicitContentFilter: oldGuild.explicitContentFilter, 
            afkChannel: oldGuild.afkChannel, 
            systemChannel: oldGuild.systemChannel,
            afkTimeout: oldGuild.afkTimeout,
            rulesChannel: oldGuild.rulesChannel,
            publicUpdatesChannel: oldGuild.publicUpdatesChannel,
            preferredLocale: oldGuild.preferredLocale
        })
    };
    
    if (!entry || !entry.executor || (OWNER_GUARD === false && entry.executor.id == oldGuild.ownerID) || (IGNORE_OWNER_MODE.IGNORE_OWNERS === true && oldGuild.members.cache.get(entry.executor.id).roles.cache.has(IGNORE_OWNER_MODE.OWNER_ROLE)) || client.whitelisted(entry.executor.id)) return;
    await client.punish(log.executor.id);
    await logMessage(oldGuild, `${entry.executor} (\`${entry.executor.id}\`) adlı üye sunucu üzerinde değişiklikler yaptı ve eski haline getirildi!`);
    await newGuild.edit({ 
        name: oldGuild.name, 
        icon: oldGuild.iconURL({ dynamic: true }), 
        banner: oldGuild.bannerURL(), 
        region: oldGuild.region, 
        verificationLevel: oldGuild.verificationLevel, 
        explicitContentFilter: oldGuild.explicitContentFilter, 
        afkChannel: oldGuild.afkChannel, 
        systemChannel: oldGuild.systemChannel,
        afkTimeout: oldGuild.afkTimeout,
        rulesChannel: oldGuild.rulesChannel,
        publicUpdatesChannel: oldGuild.publicUpdatesChannel,
        preferredLocale: oldGuild.preferredLocale
    })
});

client.on("guildMemberAdd", async member => {
    let entry = await member.guild.fetchAuditLogs({ limit: 1, type: 'BOT_ADD' }).then(x => x.entries.first());
    if (!entry || !entry.executor || (OWNER_GUARD === false && entry.executor.id == member.guild.ownerID) || entry.executor.id == AUTHOR) return;
    if (BOT_GUARD === false) return;
    await client.punish(entry.executor.id).catch();
    await client.punish(member.id).catch();
    await client.closeAllPermissionsFromRoles();
    await guardConsoleLog(member.guild, member.id, entry.executor.id, 9);
    await logMessage(member.guild, `${entry.executor} (\`${entry.executor.id}\`) adlı üye sunucuya bir bot eklemeye çalıştı, eklenilen bot: **${member.user.tag}** (\`${member.id}\`)`);
    dangerCount++;
    if (dangerCount >= 3) {
        dangerMode = true;
        setTimeout(() => {
            dangerMode = false;
            dangerCount = 0;
        }, 1000*60*30);
    };
});

client.on("guildMemberRemove", async member => {
    let entry = await member.guild.fetchAuditLogs({ limit: 1, type: 'MEMBER_KICK' }).then(x => x.entries.first());
    if (!entry || !entry.executor || (OWNER_GUARD === false && entry.executor.id == member.guild.ownerID) || (IGNORE_OWNER_MODE.IGNORE_OWNERS === true && member.guild.members.cache.get(entry.executor.id).roles.cache.has(IGNORE_OWNER_MODE.OWNER_ROLE)) || client.whitelisted(entry.executor.id)) return;
    await client.punish(entry.executor.id).catch();
    await guardConsoleLog(member.guild, member.id, entry.executor.id, 10);
    await logMessage(member.guild, `${entry.executor} (\`${entry.executor.id}\`) adlı üye **${member.user.tag}** adlı üyeye sağ tık kick attı ve sunucudan uzaklaştırıldı.`);
});

client.login(MAIN_TOKEN).then(approvedConsole("Bot başarılı bir şekilde giriş yaptı.")).catch(e => { 
    declinedConsole("Bot giriş yaparken bir sorun çıktı!");
    console.error(e);
});
