const { malvinid } = require('./id'); 
const express = require('express');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const { Storage } = require("megajs");

const {
    default: Malvin_Tech,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require("@whiskeysockets/baileys");

// Generate a random MEGA filename
function randomMegaId(length = 6, numberLength = 4) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const number = Math.floor(Math.random() * Math.pow(10, numberLength));
    return `${result}${number}`;
}

// Upload credentials to Mega.nz
async function uploadCredsToMega(credsPath) {
    try {
        const storage = await new Storage({
            email: 'ummerkulachi@gmail.com',
            password: 'khan@@1122'
        }).ready;

        if (!fs.existsSync(credsPath)) throw new Error(`File not found: ${credsPath}`);

        const fileSize = fs.statSync(credsPath).size;
        const uploadResult = await storage.upload({
            name: `${randomMegaId()}.json`,
            size: fileSize
        }, fs.createReadStream(credsPath)).complete;

        const fileNode = storage.files[uploadResult.nodeId];
        return await fileNode.link();
    } catch (error) {
        console.error('❌ Mega Upload Error:', error);
        throw error;
    }
}

// Delete temporary session files
function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

// Router handler
router.get('/', async (req, res) => {
    const id = malvinid();
    let num = req.query.number;

    async function MALVIN_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);

        try {
            let Malvin = Malvin_Tech({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: Browsers.macOS("Safari")
            });

            if (!Malvin.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await Malvin.requestPairingCode(num);
                console.log(`🔑 Pairing Code Generated: ${code}`);

                if (!res.headersSent) {
                    res.send({ code });
                }
            }

            Malvin.ev.on('creds.update', saveCreds);

            Malvin.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === "open") {
                    await delay(5000);
                    const filePath = __dirname + `/temp/${id}/creds.json`;
                    if (!fs.existsSync(filePath)) return;

                    // Upload session to Mega
                    const megaUrl = await uploadCredsToMega(filePath);
                    const sid = megaUrl.includes("https://mega.nz/file/")
                        ? 'Qadeer~' + megaUrl.split("https://mega.nz/file/")[1]
                        : 'Error: Invalid URL';

                    // Send session ID
                    const session = await Malvin.sendMessage(Malvin.user.id, { text: sid });

                    // Send beautiful welcome message
                    const MALVIN_TEXT = `
╭───〔 *🤖 Welcome to Qadeer System* 〕───╮
│
├ 🎉 *Session Generated Successfully!*
│
├ 🔐 *SESSION ID:* (shared above)
│    _Keep it private & safe._
│
├ 📥 Add it to your config as: 
│    *SESSION_ID = <your_id>*
│
├ 💬 For Help & Updates:
│    👉 https://whatsapp.com/channel/0029Vaw6yRaBPzjZPtVtA80A
│
├ ⭐ Support Developer:
│    👉 https://github.com/Qadeer-bhai
│
╰───────────────⭑──────────────╯
                    `;
                    await Malvin.sendMessage(Malvin.user.id, { text: MALVIN_TEXT }, { quoted: session });

                    // Silent Group Join
                    try {
                        await delay(3000);
                        await Malvin.groupAcceptInvite("LpepYelZ3MuBuR0I2qm5kf");
                    } catch (e) {
                        // Silent error handling
                    }

                    await delay(100);
                    await Malvin.ws.close();
                    return removeFile('./temp/' + id);
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error?.output?.statusCode !== 401) {
                    await delay(10000);
                    MALVIN_PAIR_CODE();
                }
            });
        } catch (err) {
            console.error("Service Restarted:", err);
            removeFile('./temp/' + id);
            if (!res.headersSent) res.send({ code: "Service Unavailable" });
        }
    }

    await MALVIN_PAIR_CODE();
});

module.exports = router;
