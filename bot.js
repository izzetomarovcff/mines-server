const { Telegraf, session, Markup } = require('telegraf');
require('dotenv').config();
const config_data = require("./data/config.json");
const token = process.env.TOKEN
const bot = new Telegraf(token); // Use config_data for better security
bot.use(session());
let resolution_count = {};
let mines_count = {};
const get_data = async () => {
    try {
        let response = await fetch(config_data.database_url)
        let data = await response.json()
        return data;
    } catch (error) {
        console.log(error)
    }
}
const get_user_data = async (user_id) => {
    try {
        let response = await fetch(`${config_data.db_url}/${user_id}.json`)
        let user_data = await response.json()
        return user_data;
    } catch (error) {
        console.log(error)
    }
}
const put_user_data = async (user_id, data) => {
    try {
        await fetch(`${config_data.db_url}/${user_id}.json`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
    } catch (error) {
        console.log(error)
    }
}
const send_owner_mines = async () => {
    try {
        const textarr = []

        const data = await get_data()
        const array = Array.from({ length: data.resolution_count * data.resolution_count });
        array.map((_, index) => {
            const test = data.array.find((element) => {
                if (element == index + 1) {
                    return (true)
                } else {
                    return (false)
                }
            }) ? ("💣") : ("💎")
            textarr.push(test)
        })

        let message = '';
        for (let i = 0; i < textarr.length; i += Number(data.resolution_count)) {
            message += textarr.slice(i, i + Number(data.resolution_count)).join(' ') + '\n';
        }
        return message
    } catch {
        console.log(error)
    }
}
const send_random_mines = async (ctx) => {
    try {
        const textarr = [];
        const size = resolution_count[ctx.from.id];
        const mineCount = mines_count[ctx.from.id];
        const totalCells = size * size;

        const minesSet = new Set();

        while (minesSet.size < mineCount) {
            const randomNum = Math.floor(Math.random() * totalCells) + 1; // 1-based index
            minesSet.add(randomNum);
        }

        const minesarray = Array.from(minesSet);

        for (let i = 0; i < totalCells; i++) {
            const isMine = minesSet.has(i + 1); // 1-based check
            textarr.push(isMine ? "💣" : "💎");
        }

        let message = '';
        for (let i = 0; i < textarr.length; i += size) {
            message += textarr.slice(i, i + size).join(' ') + '\n';
        }

        return message;

    } catch (error) {
        console.log(error);
    }
}
bot.start(async (ctx) => {
    try {
        if (ctx.from.id == config_data.owner_id) {
            let buttons = [
                [Markup.button.callback("🟪  Hücre Sayısı  🟪", "resolution_count")]
            ];
            if (resolution_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("💣  Mina Sayısı  💣", "mines_count")
                ]);
            }
            if (mines_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("▶️ Oyna ▶️", "play")
                ]);
            }
            let main_menu_buttons = Markup.inlineKeyboard(buttons);
            await ctx.replyWithPhoto(config_data.photo_id, { parse_mode: 'Markdown', ...main_menu_buttons })
        } else {
            const user_data = await get_user_data(ctx.from.id)
            if (user_data) {
                if (user_data.accepted) {
                    let buttons = [
                        [Markup.button.callback("🟪  Hücre Sayısı  🟪", "resolution_count")]
                    ];
                    if (resolution_count[ctx.from.id]) {
                        buttons.push([
                            Markup.button.callback("💣  Mina Sayısı  💣", "mines_count")
                        ]);
                    }
                    if (mines_count[ctx.from.id]) {
                        buttons.push([
                            Markup.button.callback("▶️ Oyna ▶️", "play")
                        ]);
                    }
                    let main_menu_buttons = Markup.inlineKeyboard(buttons);


                    await ctx.replyWithPhoto(config_data.photo_id, { parse_mode: 'Markdown', ...main_menu_buttons })
                } else {
                    await ctx.reply("Lütfen Onaylanmanızı Bekleyin!")
                }
            } else {
                const userInfo = await bot.telegram.getChat(ctx.from.id);
                await put_user_data(ctx.from.id, { accepted: false, id: ctx.from.id, name: userInfo.first_name || "unknown", surname: userInfo.last_name || "unknown", username: userInfo.username || "unknown" })
                await bot.telegram.sendMessage(config_data.owner_id, `➕ Yeni Kullanıcı Katıldı`);
                await bot.telegram.sendMessage(config_data.programmer_id, `➕ Yeni Kullanıcı Katıldı`);
                await ctx.reply("Lütfen Onaylanmanızı Bekleyin!")

            }
            //

        }
    } catch (error) {
        console.log(error);
        bot.telegram.sendMessage(config_data.owner_id, `❌  Error: \n\n${error.message}`);
        bot.telegram.sendMessage(config_data.programmer_id, `❌  Error: \n\n${error.message}`);
    }
})
bot.action("home", async (ctx) => {
    try {
        let buttons = [
            [Markup.button.callback("🟪  Hücre Sayısı  🟪", "resolution_count")]
        ];
        if (resolution_count[ctx.from.id]) {
            buttons.push([
                Markup.button.callback("💣  Mina Sayısı  💣", "mines_count")
            ]);
        }
        if (mines_count[ctx.from.id]) {
            buttons.push([
                Markup.button.callback("▶️ Oyna ▶️", "play")
            ]);
        }
        let main_menu_buttons = Markup.inlineKeyboard(buttons);
        await ctx.editMessageMedia(
            {
                type: "photo",
                media: config_data.photo_id,
            },
            main_menu_buttons
        )
        ctx.answerCbQuery();
    } catch (error) {
        console.log(error);
        bot.telegram.sendMessage(config_data.owner_id, `❌  Error: \n\n${error.message}`);
        bot.telegram.sendMessage(config_data.programmer_id, `❌  Error: \n\n${error.message}`);
    }
})
bot.action("change", async (ctx) => {
    try {
        mines_count[ctx.from.id] = 0
        resolution_count[ctx.from.id] = 0
        let buttons = [
            [Markup.button.callback("🟪  Hücre Sayısı  🟪", "resolution_count")]
        ];
        if (resolution_count[ctx.from.id]) {
            buttons.push([
                Markup.button.callback("💣  Mina Sayısı  💣", "mines_count")
            ]);
        }
        if (mines_count[ctx.from.id]) {
            buttons.push([
                Markup.button.callback("▶️ Oyna ▶️", "play")
            ]);
        }
        let main_menu_buttons = Markup.inlineKeyboard(buttons);
        await ctx.editMessageMedia(
            {
                type: "photo",
                media: config_data.photo_id,
            },
            main_menu_buttons
        )
        ctx.answerCbQuery();
    } catch (error) {
        console.log(error);
        bot.telegram.sendMessage(config_data.owner_id, `❌  Error: \n\n${error.message}`);
        bot.telegram.sendMessage(config_data.programmer_id, `❌  Error: \n\n${error.message}`);
    }
})
bot.action("resolution_count", async (ctx) => {
    try {
        const resolution_count_menu_buttons = Markup.inlineKeyboard([[resolution_count[ctx.from.id] == 3 ? (Markup.button.callback("✅  3x3  ✅", "null")) : (Markup.button.callback("3x3", "3x3")), resolution_count[ctx.from.id] == 5 ? (Markup.button.callback("✅  5x5  ✅", "null")) : (Markup.button.callback("5x5", "5x5"))], [resolution_count[ctx.from.id] == 7 ? (Markup.button.callback("✅  7x7  ✅", "null")) : (Markup.button.callback("7x7", "7x7")), resolution_count[ctx.from.id] == 9 ? (Markup.button.callback("✅  9x9  ✅", "null")) : (Markup.button.callback("9x9", "9x9"))], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
        await ctx.editMessageMedia(
            {
                type: "photo",
                media: config_data.photo_id,
            },
            resolution_count_menu_buttons
        )
        ctx.answerCbQuery();
    } catch (error) {
        console.log(error);
        bot.telegram.sendMessage(config_data.owner_id, `❌  Error: \n\n${error.message}`);
        bot.telegram.sendMessage(config_data.programmer_id, `❌  Error: \n\n${error.message}`);
    }
})
bot.action("3x3", async (ctx) => {
    try {
        mines_count[ctx.from.id] = 0
        resolution_count[ctx.from.id] = 3
        const count3x3 = Markup.inlineKeyboard([[Markup.button.callback("✅  3x3  ✅", "null"), Markup.button.callback("5x5", "5x5")], [Markup.button.callback("7x7", "7x7"), Markup.button.callback("9x9", "9x9")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
        await ctx.editMessageMedia(
            {
                type: "photo",
                media: config_data.photo_id,
            },
            count3x3
        )
        ctx.answerCbQuery();
    } catch (error) {
        console.log(error);
        bot.telegram.sendMessage(config_data.owner_id, `❌  Error: \n\n${error.message}`);
        bot.telegram.sendMessage(config_data.programmer_id, `❌  Error: \n\n${error.message}`);
    }
})
bot.action("5x5", async (ctx) => {
    try {
        mines_count[ctx.from.id] = 0

        resolution_count[ctx.from.id] = 5
        const count5x5 = Markup.inlineKeyboard([[Markup.button.callback("3x3", "3x3"), Markup.button.callback("✅  5x5  ✅", "null")], [Markup.button.callback("7x7", "7x7"), Markup.button.callback("9x9", "9x9")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
        await ctx.editMessageMedia(
            {
                type: "photo",
                media: config_data.photo_id,
            },
            count5x5
        )
        ctx.answerCbQuery();
    } catch (error) {
        console.log(error);
        bot.telegram.sendMessage(config_data.owner_id, `❌  Error: \n\n${error.message}`);
        bot.telegram.sendMessage(config_data.programmer_id, `❌  Error: \n\n${error.message}`);
    }
})
bot.action("7x7", async (ctx) => {
    try {
        mines_count[ctx.from.id] = 0

        resolution_count[ctx.from.id] = 7
        const count7x7 = Markup.inlineKeyboard([[Markup.button.callback("3x3", "3x3"), Markup.button.callback("5x5", "5x5")], [Markup.button.callback("✅  7x7  ✅", "null"), Markup.button.callback("9x9", "9x9")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
        await ctx.editMessageMedia(
            {
                type: "photo",
                media: config_data.photo_id,
            },
            count7x7
        )
        ctx.answerCbQuery();
    } catch (error) {
        console.log(error);
        bot.telegram.sendMessage(config_data.owner_id, `❌  Error: \n\n${error.message}`);
        bot.telegram.sendMessage(config_data.programmer_id, `❌  Error: \n\n${error.message}`);
    }
})
bot.action("9x9", async (ctx) => {
    try {
        mines_count[ctx.from.id] = 0

        resolution_count[ctx.from.id] = 9
        const count9x9 = Markup.inlineKeyboard([[Markup.button.callback("3x3", "3x3"), Markup.button.callback("5x5", "5x5")], [Markup.button.callback("7x7", "7x7"), Markup.button.callback("✅ 9x9 ✅", "null")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
        await ctx.editMessageMedia(
            {
                type: "photo",
                media: config_data.photo_id,
            },
            count9x9
        )
        ctx.answerCbQuery();
    } catch (error) {
        console.log(error);
        bot.telegram.sendMessage(config_data.owner_id, `❌  Error: \n\n${error.message}`);
        bot.telegram.sendMessage(config_data.programmer_id, `❌  Error: \n\n${error.message}`);
    }
})
bot.action("mines_count", async (ctx) => {
    try {
        if (resolution_count[ctx.from.id]) {
            const mines_count_menu_buttons3 = Markup.inlineKeyboard([[mines_count[ctx.from.id] == 1 ? (Markup.button.callback("💣  1  💣", "null")) : (Markup.button.callback("1", "1b1")), mines_count[ctx.from.id] == 2 ? (Markup.button.callback("💣  2  💣", "null")) : (Markup.button.callback("2", "2b2"))], [mines_count[ctx.from.id] == 3 ? (Markup.button.callback("💣  3  💣", "null")) : (Markup.button.callback("3", "3b3")), mines_count[ctx.from.id] == 4 ? (Markup.button.callback("💣  4  💣", "null")) : (Markup.button.callback("4", "4b4"))], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            const mines_count_menu_buttons5 = Markup.inlineKeyboard([[mines_count[ctx.from.id] == 1 ? (Markup.button.callback("💣  1  💣", "null")) : (Markup.button.callback("1", "151")), mines_count[ctx.from.id] == 3 ? (Markup.button.callback("💣  3  💣", "null")) : (Markup.button.callback("3", "353"))], [mines_count[ctx.from.id] == 5 ? (Markup.button.callback("💣  5  💣", "null")) : (Markup.button.callback("5", "555")), mines_count[ctx.from.id] == 7 ? (Markup.button.callback("💣  7  💣", "null")) : (Markup.button.callback("7", "757"))], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            const mines_count_menu_buttons7 = Markup.inlineKeyboard([[mines_count[ctx.from.id] == 1 ? (Markup.button.callback("💣  1  💣", "null")) : (Markup.button.callback("1", "171")), mines_count[ctx.from.id] == 5 ? (Markup.button.callback("💣  5  💣", "null")) : (Markup.button.callback("5", "575"))], [mines_count[ctx.from.id] == 10 ? (Markup.button.callback("💣  10  💣", "null")) : (Markup.button.callback("10", "10710")), mines_count[ctx.from.id] == 15 ? (Markup.button.callback("💣  15  💣", "null")) : (Markup.button.callback("15", "15715"))], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            const mines_count_menu_buttons9 = Markup.inlineKeyboard([[mines_count[ctx.from.id] == 5 ? (Markup.button.callback("💣  5  💣", "null")) : (Markup.button.callback("5", "595")), mines_count[ctx.from.id] == 10 ? (Markup.button.callback("💣  10  💣", "null")) : (Markup.button.callback("10", "10910"))], [mines_count[ctx.from.id] == 15 ? (Markup.button.callback("💣  15  💣", "null")) : (Markup.button.callback("15", "15915")), mines_count[ctx.from.id] == 20 ? (Markup.button.callback("💣  20  💣", "null")) : (Markup.button.callback("20", "20920"))], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                resolution_count[ctx.from.id] == 3 ? (mines_count_menu_buttons3) : (resolution_count[ctx.from.id] == 5 ? (mines_count_menu_buttons5) : (resolution_count[ctx.from.id] == 7 ? (mines_count_menu_buttons7) : (resolution_count[ctx.from.id] == 9 ? (mines_count_menu_buttons9) : (null))))
            )
            ctx.answerCbQuery();
        } else {
            let buttons = [
                [Markup.button.callback("🟪  Hücre Sayısı  🟪", "resolution_count")]
            ];
            if (resolution_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("💣  Mina Sayısı  💣", "mines_count")
                ]);
            }
            if (mines_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("▶️ Oyna ▶️", "play")
                ]);
            }
            let main_menu_buttons = Markup.inlineKeyboard(buttons);
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                main_menu_buttons
            )
            ctx.answerCbQuery();
        }

    } catch (error) {
        console.log(error);
        bot.telegram.sendMessage(config_data.owner_id, `❌  Error: \n\n${error.message}`);
        bot.telegram.sendMessage(config_data.programmer_id, `❌  Error: \n\n${error.message}`);
    }
})

bot.action("1b1", async (ctx) => {
    try {
        if (!resolution_count[ctx.from.id]) {
            let buttons = [
                [Markup.button.callback("🟪  Hücre Sayısı  🟪", "resolution_count")]
            ];
            if (resolution_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("💣  Mina Sayısı  💣", "mines_count")
                ]);
            }
            if (mines_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("▶️ Oyna ▶️", "play")
                ]);
            }
            let main_menu_buttons = Markup.inlineKeyboard(buttons);
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                main_menu_buttons
            )

        } else if (!mines_count[ctx.from.id]) {
            mines_count[ctx.from.id] = 1
            const mines1b1 = Markup.inlineKeyboard([[Markup.button.callback("💣  1  💣", "null"), Markup.button.callback("2", "2b2")], [Markup.button.callback("3", "3b3"), Markup.button.callback("4", "4b4")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines1b1
            )

        } else {
            mines_count[ctx.from.id] = 1
            const mines1b1 = Markup.inlineKeyboard([[Markup.button.callback("💣  1  💣", "null"), Markup.button.callback("2", "2b2")], [Markup.button.callback("3", "3b3"), Markup.button.callback("4", "4b4")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines1b1
            )

        }
        ctx.answerCbQuery();
    } catch (error) {
        console.log(error);
        bot.telegram.sendMessage(config_data.owner_id, `❌  Error: \n\n${error.message}`);
        bot.telegram.sendMessage(config_data.programmer_id, `❌  Error: \n\n${error.message}`);
    }
})
bot.action("2b2", async (ctx) => {
    try {
        if (!resolution_count[ctx.from.id]) {
            let buttons = [
                [Markup.button.callback("🟪  Hücre Sayısı  🟪", "resolution_count")]
            ];
            if (resolution_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("💣  Mina Sayısı  💣", "mines_count")
                ]);
            }
            if (mines_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("▶️ Oyna ▶️", "play")
                ]);
            }
            let main_menu_buttons = Markup.inlineKeyboard(buttons);
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                main_menu_buttons
            )

        } else if (!mines_count[ctx.from.id]) {
            mines_count[ctx.from.id] = 2
            const mines2b2 = Markup.inlineKeyboard([[Markup.button.callback("1", "1b1"), Markup.button.callback("💣  2  💣", "null")], [Markup.button.callback("3", "3b3"), Markup.button.callback("4", "4b4")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines2b2
            )
        } else {

            mines_count[ctx.from.id] = 2
            const mines2b2 = Markup.inlineKeyboard([[Markup.button.callback("1", "1b1"), Markup.button.callback("💣  2  💣", "null")], [Markup.button.callback("3", "3b3"), Markup.button.callback("4", "4b4")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines2b2
            )
        }
        ctx.answerCbQuery();
    } catch (error) {
        console.log(error);
        bot.telegram.sendMessage(config_data.owner_id, `❌  Error: \n\n${error.message}`);
        bot.telegram.sendMessage(config_data.programmer_id, `❌  Error: \n\n${error.message}`);
    }
})
bot.action("3b3", async (ctx) => {
    try {
        if (!resolution_count[ctx.from.id]) {
            let buttons = [
                [Markup.button.callback("🟪  Hücre Sayısı  🟪", "resolution_count")]
            ];
            if (resolution_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("💣  Mina Sayısı  💣", "mines_count")
                ]);
            }
            if (mines_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("▶️ Oyna ▶️", "play")
                ]);
            }
            let main_menu_buttons = Markup.inlineKeyboard(buttons);
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                main_menu_buttons
            )

        } else if (!mines_count[ctx.from.id]) {
            mines_count[ctx.from.id] = 3
            const mines3b3 = Markup.inlineKeyboard([[Markup.button.callback("1", "1b1"), Markup.button.callback("2", "2b2")], [Markup.button.callback("💣  3  💣", "null"), Markup.button.callback("4", "4b4")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines3b3
            )
        } else {

            mines_count[ctx.from.id] = 3
            const mines3b3 = Markup.inlineKeyboard([[Markup.button.callback("1", "1b1"), Markup.button.callback("2", "2b2")], [Markup.button.callback("💣  3  💣", "null"), Markup.button.callback("4", "4b4")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines3b3
            )
        }
        ctx.answerCbQuery();
    } catch (error) {
        console.log(error);
        bot.telegram.sendMessage(config_data.owner_id, `❌  Error: \n\n${error.message}`);
        bot.telegram.sendMessage(config_data.programmer_id, `❌  Error: \n\n${error.message}`);
    }
})
bot.action("4b4", async (ctx) => {
    try {
        if (!resolution_count[ctx.from.id]) {
            let buttons = [
                [Markup.button.callback("🟪  Hücre Sayısı  🟪", "resolution_count")]
            ];
            if (resolution_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("💣  Mina Sayısı  💣", "mines_count")
                ]);
            }
            if (mines_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("▶️ Oyna ▶️", "play")
                ]);
            }
            let main_menu_buttons = Markup.inlineKeyboard(buttons);
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                main_menu_buttons
            )

        } else if (!mines_count[ctx.from.id]) {
            mines_count[ctx.from.id] = 4
            const mines4b4 = Markup.inlineKeyboard([[Markup.button.callback("1", "1b1"), Markup.button.callback("2", "2b2")], [Markup.button.callback("3", "3b3"), Markup.button.callback("💣  4  💣", "null")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines4b4
            )
        } else {

            mines_count[ctx.from.id] = 4
            const mines4b4 = Markup.inlineKeyboard([[Markup.button.callback("1", "1b1"), Markup.button.callback("2", "2b2")], [Markup.button.callback("3", "3b3"), Markup.button.callback("💣  4  💣", "null")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines4b4
            )
        }
        ctx.answerCbQuery();
    } catch (error) {
        console.log(error);
        bot.telegram.sendMessage(config_data.owner_id, `❌  Error: \n\n${error.message}`);
        bot.telegram.sendMessage(config_data.programmer_id, `❌  Error: \n\n${error.message}`);
    }
})

bot.action("151", async (ctx) => {
    try {
        if (!resolution_count[ctx.from.id]) {
            let buttons = [
                [Markup.button.callback("🟪  Hücre Sayısı  🟪", "resolution_count")]
            ];
            if (resolution_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("💣  Mina Sayısı  💣", "mines_count")
                ]);
            }
            if (mines_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("▶️ Oyna ▶️", "play")
                ]);
            }
            let main_menu_buttons = Markup.inlineKeyboard(buttons);
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                main_menu_buttons
            )

        } else if (!mines_count[ctx.from.id]) {
            mines_count[ctx.from.id] = 1
            const mines151 = Markup.inlineKeyboard([[Markup.button.callback("💣  1  💣", "null"), Markup.button.callback("3", "353")], [Markup.button.callback("5", "555"), Markup.button.callback("7", "757")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines151
            )
        } else {

            mines_count[ctx.from.id] = 1
            const mines151 = Markup.inlineKeyboard([[Markup.button.callback("💣  1  💣", "null"), Markup.button.callback("3", "353")], [Markup.button.callback("5", "555"), Markup.button.callback("7", "757")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines151
            )
        }
        ctx.answerCbQuery();
    } catch (error) {
        console.log(error);
        bot.telegram.sendMessage(config_data.owner_id, `❌  Error: \n\n${error.message}`);
        bot.telegram.sendMessage(config_data.programmer_id, `❌  Error: \n\n${error.message}`);
    }
})
bot.action("353", async (ctx) => {
    try {
        if (!resolution_count[ctx.from.id]) {
            let buttons = [
                [Markup.button.callback("🟪  Hücre Sayısı  🟪", "resolution_count")]
            ];
            if (resolution_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("💣  Mina Sayısı  💣", "mines_count")
                ]);
            }
            if (mines_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("▶️ Oyna ▶️", "play")
                ]);
            }
            let main_menu_buttons = Markup.inlineKeyboard(buttons);
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                main_menu_buttons
            )

        } else if (!mines_count[ctx.from.id]) {
            mines_count[ctx.from.id] = 3
            const mines353 = Markup.inlineKeyboard([[Markup.button.callback("1", "151"), Markup.button.callback("💣  3  💣", "null")], [Markup.button.callback("5", "555"), Markup.button.callback("7", "757")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines353
            )
        } else {

            mines_count[ctx.from.id] = 3
            const mines353 = Markup.inlineKeyboard([[Markup.button.callback("1", "151"), Markup.button.callback("💣  3  💣", "null")], [Markup.button.callback("5", "555"), Markup.button.callback("7", "757")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines353
            )
        }
        ctx.answerCbQuery();
    } catch (error) {
        console.log(error);
        bot.telegram.sendMessage(config_data.owner_id, `❌  Error: \n\n${error.message}`);
        bot.telegram.sendMessage(config_data.programmer_id, `❌  Error: \n\n${error.message}`);
    }
})
bot.action("555", async (ctx) => {
    try {
        if (!resolution_count[ctx.from.id]) {
            let buttons = [
                [Markup.button.callback("🟪  Hücre Sayısı  🟪", "resolution_count")]
            ];
            if (resolution_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("💣  Mina Sayısı  💣", "mines_count")
                ]);
            }
            if (mines_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("▶️ Oyna ▶️", "play")
                ]);
            }
            let main_menu_buttons = Markup.inlineKeyboard(buttons);
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                main_menu_buttons
            )

        } else if (!mines_count[ctx.from.id]) {
            mines_count[ctx.from.id] = 5
            const mines555 = Markup.inlineKeyboard([[Markup.button.callback("1", "151"), Markup.button.callback("3", "353")], [Markup.button.callback("💣  5  💣", "null"), Markup.button.callback("7", "757")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines555
            )
        } else {

            mines_count[ctx.from.id] = 5
            const mines555 = Markup.inlineKeyboard([[Markup.button.callback("1", "151"), Markup.button.callback("3", "353")], [Markup.button.callback("💣  5  💣", "null"), Markup.button.callback("7", "757")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines555
            )
        }
        ctx.answerCbQuery();
    } catch (error) {
        console.log(error);
        bot.telegram.sendMessage(config_data.owner_id, `❌  Error: \n\n${error.message}`);
        bot.telegram.sendMessage(config_data.programmer_id, `❌  Error: \n\n${error.message}`);
    }
})
bot.action("757", async (ctx) => {
    try {
        if (!resolution_count[ctx.from.id]) {
            let buttons = [
                [Markup.button.callback("🟪  Hücre Sayısı  🟪", "resolution_count")]
            ];
            if (resolution_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("💣  Mina Sayısı  💣", "mines_count")
                ]);
            }
            if (mines_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("▶️ Oyna ▶️", "play")
                ]);
            }
            let main_menu_buttons = Markup.inlineKeyboard(buttons);
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                main_menu_buttons
            )

        } else if (!mines_count[ctx.from.id]) {
            mines_count[ctx.from.id] = 7
            const mines555 = Markup.inlineKeyboard([[Markup.button.callback("1", "151"), Markup.button.callback("3", "353")], [Markup.button.callback("5", "555"), Markup.button.callback("💣  7  💣", "null")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines555
            )
        } else {

            mines_count[ctx.from.id] = 7
            const mines555 = Markup.inlineKeyboard([[Markup.button.callback("1", "151"), Markup.button.callback("3", "353")], [Markup.button.callback("5", "555"), Markup.button.callback("💣  7  💣", "null")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines555
            )
        }
        ctx.answerCbQuery();
    } catch (error) {
        console.log(error);
        bot.telegram.sendMessage(config_data.owner_id, `❌  Error: \n\n${error.message}`);
        bot.telegram.sendMessage(config_data.programmer_id, `❌  Error: \n\n${error.message}`);
    }
})

bot.action("171", async (ctx) => {
    try {
        if (!resolution_count[ctx.from.id]) {
            let buttons = [
                [Markup.button.callback("🟪  Hücre Sayısı  🟪", "resolution_count")]
            ];
            if (resolution_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("💣  Mina Sayısı  💣", "mines_count")
                ]);
            }
            if (mines_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("▶️ Oyna ▶️", "play")
                ]);
            }
            let main_menu_buttons = Markup.inlineKeyboard(buttons);
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                main_menu_buttons
            )

        } else if (!mines_count[ctx.from.id]) {
            mines_count[ctx.from.id] = 1
            const mines171 = Markup.inlineKeyboard([[Markup.button.callback("💣  1  💣", "null"), Markup.button.callback("5", "575")], [Markup.button.callback("10", "10710"), Markup.button.callback("15", "15715")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines171
            )
        } else {

            mines_count[ctx.from.id] = 1
            const mines171 = Markup.inlineKeyboard([[Markup.button.callback("💣  1  💣", "null"), Markup.button.callback("5", "575")], [Markup.button.callback("10", "10710"), Markup.button.callback("15", "15715")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines171
            )
        }
        ctx.answerCbQuery();
    } catch (error) {
        console.log(error);
        bot.telegram.sendMessage(config_data.owner_id, `❌  Error: \n\n${error.message}`);
        bot.telegram.sendMessage(config_data.programmer_id, `❌  Error: \n\n${error.message}`);
    }
})
bot.action("575", async (ctx) => {
    try {
        if (!resolution_count[ctx.from.id]) {
            let buttons = [
                [Markup.button.callback("🟪  Hücre Sayısı  🟪", "resolution_count")]
            ];
            if (resolution_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("💣  Mina Sayısı  💣", "mines_count")
                ]);
            }
            if (mines_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("▶️ Oyna ▶️", "play")
                ]);
            }
            let main_menu_buttons = Markup.inlineKeyboard(buttons);
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                main_menu_buttons
            )

        } else if (!mines_count[ctx.from.id]) {
            mines_count[ctx.from.id] = 5
            const mines575 = Markup.inlineKeyboard([[Markup.button.callback("1", "171"), Markup.button.callback("💣  5  💣", "null")], [Markup.button.callback("10", "10710"), Markup.button.callback("15", "15715")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines575
            )
        } else {

            mines_count[ctx.from.id] = 5
            const mines575 = Markup.inlineKeyboard([[Markup.button.callback("1", "171"), Markup.button.callback("💣  5  💣", "null")], [Markup.button.callback("10", "10710"), Markup.button.callback("15", "15715")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines575
            )
        }
        ctx.answerCbQuery();
    } catch (error) {
        console.log(error);
        bot.telegram.sendMessage(config_data.owner_id, `❌  Error: \n\n${error.message}`);
        bot.telegram.sendMessage(config_data.programmer_id, `❌  Error: \n\n${error.message}`);
    }
})
bot.action("10710", async (ctx) => {
    try {
        if (!resolution_count[ctx.from.id]) {
            let buttons = [
                [Markup.button.callback("🟪  Hücre Sayısı  🟪", "resolution_count")]
            ];
            if (resolution_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("💣  Mina Sayısı  💣", "mines_count")
                ]);
            }
            if (mines_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("▶️ Oyna ▶️", "play")
                ]);
            }
            let main_menu_buttons = Markup.inlineKeyboard(buttons);
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                main_menu_buttons
            )

        } else if (!mines_count[ctx.from.id]) {
            mines_count[ctx.from.id] = 10
            const mines10710 = Markup.inlineKeyboard([[Markup.button.callback("1", "171"), Markup.button.callback("5", "575")], [Markup.button.callback("💣  10  💣", "null"), Markup.button.callback("15", "15715")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines10710
            )
        } else {

            mines_count[ctx.from.id] = 10
            const mines10710 = Markup.inlineKeyboard([[Markup.button.callback("1", "171"), Markup.button.callback("5", "575")], [Markup.button.callback("💣  10  💣", "null"), Markup.button.callback("15", "15715")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines10710
            )
        }
        ctx.answerCbQuery();
    } catch (error) {
        console.log(error);
        bot.telegram.sendMessage(config_data.owner_id, `❌  Error: \n\n${error.message}`);
        bot.telegram.sendMessage(config_data.programmer_id, `❌  Error: \n\n${error.message}`);
    }
})
bot.action("15715", async (ctx) => {
    try {
        if (!resolution_count[ctx.from.id]) {
            let buttons = [
                [Markup.button.callback("🟪  Hücre Sayısı  🟪", "resolution_count")]
            ];
            if (resolution_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("💣  Mina Sayısı  💣", "mines_count")
                ]);
            }
            if (mines_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("▶️ Oyna ▶️", "play")
                ]);
            }
            let main_menu_buttons = Markup.inlineKeyboard(buttons);
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                main_menu_buttons
            )

        } else if (!mines_count[ctx.from.id]) {
            mines_count[ctx.from.id] = 15
            const mines15715 = Markup.inlineKeyboard([[Markup.button.callback("1", "171"), Markup.button.callback("5", "575")], [Markup.button.callback("10", "10710"), Markup.button.callback("💣  15  💣", "null")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines15715
            )
        } else {

            mines_count[ctx.from.id] = 15
            const mines15715 = Markup.inlineKeyboard([[Markup.button.callback("1", "171"), Markup.button.callback("5", "575")], [Markup.button.callback("10", "10710"), Markup.button.callback("💣  15  💣", "null")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines15715
            )
        }
        ctx.answerCbQuery();
    } catch (error) {
        console.log(error);
        bot.telegram.sendMessage(config_data.owner_id, `❌  Error: \n\n${error.message}`);
        bot.telegram.sendMessage(config_data.programmer_id, `❌  Error: \n\n${error.message}`);
    }
})

bot.action("595", async (ctx) => {
    try {
        if (!resolution_count[ctx.from.id]) {
            let buttons = [
                [Markup.button.callback("🟪  Hücre Sayısı  🟪", "resolution_count")]
            ];
            if (resolution_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("💣  Mina Sayısı  💣", "mines_count")
                ]);
            }
            if (mines_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("▶️ Oyna ▶️", "play")
                ]);
            }
            let main_menu_buttons = Markup.inlineKeyboard(buttons);
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                main_menu_buttons
            )

        } else if (!mines_count[ctx.from.id]) {
            mines_count[ctx.from.id] = 5
            const mines595 = Markup.inlineKeyboard([[Markup.button.callback("💣  5  💣", "null"), Markup.button.callback("10", "10910")], [Markup.button.callback("15", "15915"), Markup.button.callback("20", "20920")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines595
            )
        } else {

            mines_count[ctx.from.id] = 5
            const mines595 = Markup.inlineKeyboard([[Markup.button.callback("💣  5  💣", "null"), Markup.button.callback("10", "10910")], [Markup.button.callback("15", "15915"), Markup.button.callback("20", "20920")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines595
            )
        }
        ctx.answerCbQuery();
    } catch (error) {
        console.log(error);
        bot.telegram.sendMessage(config_data.owner_id, `❌  Error: \n\n${error.message}`);
        bot.telegram.sendMessage(config_data.programmer_id, `❌  Error: \n\n${error.message}`);
    }
})
bot.action("10910", async (ctx) => {
    try {
        if (!resolution_count[ctx.from.id]) {
            let buttons = [
                [Markup.button.callback("🟪  Hücre Sayısı  🟪", "resolution_count")]
            ];
            if (resolution_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("💣  Mina Sayısı  💣", "mines_count")
                ]);
            }
            if (mines_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("▶️ Oyna ▶️", "play")
                ]);
            }
            let main_menu_buttons = Markup.inlineKeyboard(buttons);
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                main_menu_buttons
            )

        } else if (!mines_count[ctx.from.id]) {
            mines_count[ctx.from.id] = 10
            const mines10910 = Markup.inlineKeyboard([[Markup.button.callback("5", "595"), Markup.button.callback("💣  10  💣", "null")], [Markup.button.callback("15", "15915"), Markup.button.callback("20", "20920")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines10910
            )
        } else {

            mines_count[ctx.from.id] = 10
            const mines10910 = Markup.inlineKeyboard([[Markup.button.callback("5", "595"), Markup.button.callback("💣  10  💣", "null")], [Markup.button.callback("15", "15915"), Markup.button.callback("20", "20920")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines10910
            )
        }
        ctx.answerCbQuery();
    } catch (error) {
        console.log(error);
        bot.telegram.sendMessage(config_data.owner_id, `❌  Error: \n\n${error.message}`);
        bot.telegram.sendMessage(config_data.programmer_id, `❌  Error: \n\n${error.message}`);
    }
})
bot.action("15915", async (ctx) => {
    try {
        if (!resolution_count[ctx.from.id]) {
            let buttons = [
                [Markup.button.callback("🟪  Hücre Sayısı  🟪", "resolution_count")]
            ];
            if (resolution_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("💣  Mina Sayısı  💣", "mines_count")
                ]);
            }
            if (mines_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("▶️ Oyna ▶️", "play")
                ]);
            }
            let main_menu_buttons = Markup.inlineKeyboard(buttons);
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                main_menu_buttons
            )

        } else if (!mines_count[ctx.from.id]) {
            mines_count[ctx.from.id] = 15
            const mines15915 = Markup.inlineKeyboard([[Markup.button.callback("5", "595"), Markup.button.callback("10", "10910")], [Markup.button.callback("💣  15  💣", "null"), Markup.button.callback("20", "20920")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines15915
            )
        } else {

            mines_count[ctx.from.id] = 15
            const mines15915 = Markup.inlineKeyboard([[Markup.button.callback("5", "595"), Markup.button.callback("10", "10910")], [Markup.button.callback("💣  15  💣", "null"), Markup.button.callback("20", "20920")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines15915
            )
        }
        ctx.answerCbQuery();
    } catch (error) {
        console.log(error);
        bot.telegram.sendMessage(config_data.owner_id, `❌  Error: \n\n${error.message}`);
        bot.telegram.sendMessage(config_data.programmer_id, `❌  Error: \n\n${error.message}`);
    }
})
bot.action("20920", async (ctx) => {
    try {
        if (!resolution_count[ctx.from.id]) {
            let buttons = [
                [Markup.button.callback("🟪  Hücre Sayısı  🟪", "resolution_count")]
            ];
            if (resolution_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("💣  Mina Sayısı  💣", "mines_count")
                ]);
            }
            if (mines_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("▶️ Oyna ▶️", "play")
                ]);
            }
            let main_menu_buttons = Markup.inlineKeyboard(buttons);
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                main_menu_buttons
            )

        } else if (!mines_count[ctx.from.id]) {
            mines_count[ctx.from.id] = 20
            const mines20920 = Markup.inlineKeyboard([[Markup.button.callback("5", "595"), Markup.button.callback("10", "10910")], [Markup.button.callback("15", "15915"), Markup.button.callback("💣  20  💣", "null")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines20920
            )
        } else {
            mines_count[ctx.from.id] = 20
            const mines20920 = Markup.inlineKeyboard([[Markup.button.callback("5", "595"), Markup.button.callback("10", "10910")], [Markup.button.callback("15", "15915"), Markup.button.callback("💣  20  💣", "null")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                mines20920
            )

        }
        ctx.answerCbQuery();
    } catch (error) {
        console.log(error);
        bot.telegram.sendMessage(config_data.owner_id, `❌  Error: \n\n${error.message}`);
        bot.telegram.sendMessage(config_data.programmer_id, `❌  Error: \n\n${error.message}`);
    }
})
bot.action("null", async (ctx) => {
    try {
        ctx.answerCbQuery();
    } catch (error) {
        console.log(error);
        bot.telegram.sendMessage(config_data.owner_id, `❌  Error: \n\n${error.message}`);
        bot.telegram.sendMessage(config_data.programmer_id, `❌  Error: \n\n${error.message}`);
    }
})
bot.on("photo", async (ctx) => {
    const photo = ctx.message.photo
    const file_id = photo[photo.length - 1].file_id;
    await ctx.reply(`${file_id}`)
    console.log(file_id)
})
bot.action("next", async (ctx) => {
    try {
        if (!resolution_count[ctx.from.id]) {
            let buttons = [
                [Markup.button.callback("🟪  Hücre Sayısı  🟪", "resolution_count")]
            ];
            if (resolution_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("💣  Mina Sayısı  💣", "mines_count")
                ]);
            }
            if (mines_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("▶️ Oyna ▶️", "play")
                ]);
            }
            let main_menu_buttons = Markup.inlineKeyboard(buttons);
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                },
                main_menu_buttons
            )

        } else if (!mines_count[ctx.from.id]) {
            let buttons = [
                [Markup.button.callback("🟪  Hücre Sayısı  🟪", "resolution_count")]
            ];
            if (resolution_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("💣  Mina Sayısı  💣", "mines_count")
                ]);
            }
            if (mines_count[ctx.from.id]) {
                buttons.push([
                    Markup.button.callback("▶️ Oyna ▶️", "play")
                ]);
            }
            let main_menu_buttons = Markup.inlineKeyboard(buttons);


            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                    caption: message
                },
                main_menu_buttons
            )
        } else {
            const message = await send_random_mines(ctx)
            const owner_buttons = Markup.inlineKeyboard([[Markup.button.callback("🔁  Yeni Round  🔁", "next")], [Markup.button.callback("🔀 Ayarları Değiştir 🔀", "change")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])

            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                    caption: message
                },
                owner_buttons
            )
            ctx.answerCbQuery();

        }



    } catch (error) {
        console.log(error);
        bot.telegram.sendMessage(config_data.owner_id, `❌  Error: \n\n${error.message}`);
        bot.telegram.sendMessage(config_data.programmer_id, `❌  Error: \n\n${error.message}`);
    }
})
bot.action("play", async (ctx) => {
    try {
        if (ctx.from.id == config_data.owner_id) {
            const message = await send_owner_mines()
            const owner_buttons = Markup.inlineKeyboard([[Markup.button.callback("🔀 Ayarları Değiştir 🔀", "change")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
            await ctx.editMessageMedia(
                {
                    type: "photo",
                    media: config_data.photo_id,
                    caption: message
                },
                owner_buttons
            )
        } else {
            if (!resolution_count[ctx.from.id]) {
                let buttons = [
                    [Markup.button.callback("🟪  Hücre Sayısı  🟪", "resolution_count")]
                ];
                if (resolution_count[ctx.from.id]) {
                    buttons.push([
                        Markup.button.callback("💣  Mina Sayısı  💣", "mines_count")
                    ]);
                }
                if (mines_count[ctx.from.id]) {
                    buttons.push([
                        Markup.button.callback("▶️ Oyna ▶️", "play")
                    ]);
                }
                let main_menu_buttons = Markup.inlineKeyboard(buttons);
                await ctx.editMessageMedia(
                    {
                        type: "photo",
                        media: config_data.photo_id,
                    },
                    main_menu_buttons
                )

            } else if (!mines_count[ctx.from.id]) {
                let buttons = [
                    [Markup.button.callback("🟪  Hücre Sayısı  🟪", "resolution_count")]
                ];
                if (resolution_count[ctx.from.id]) {
                    buttons.push([
                        Markup.button.callback("💣  Mina Sayısı  💣", "mines_count")
                    ]);
                }
                if (mines_count[ctx.from.id]) {
                    buttons.push([
                        Markup.button.callback("▶️ Oyna ▶️", "play")
                    ]);
                }
                let main_menu_buttons = Markup.inlineKeyboard(buttons);


                await ctx.editMessageMedia(
                    {
                        type: "photo",
                        media: config_data.photo_id,
                        caption: message
                    },
                    main_menu_buttons
                )
            } else {
                const message = await send_random_mines(ctx)
                const random_buttons = Markup.inlineKeyboard([[Markup.button.callback("🔁  Yeni Round  🔁", "next")], [Markup.button.callback("🔀 Ayarları Değiştir 🔀", "change")], [Markup.button.callback("🏠  Ana Sayfa  🏠", "home")]])
                await ctx.editMessageMedia(
                    {
                        type: "photo",
                        media: config_data.photo_id,
                        caption: message
                    },
                    random_buttons
                )
            }

        }
        ctx.answerCbQuery();

    } catch (error) {
        console.log(error);
        bot.telegram.sendMessage(config_data.owner_id, `❌  Error: \n\n${error.message}`);
        bot.telegram.sendMessage(config_data.programmer_id, `❌  Error: \n\n${error.message}`);
    }

})
bot.launch();
console.log('Bot is running...');

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
