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

// Function to generate a random Mega ID
function randomMegaId(length = 6, numberLength = 4) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const number = Math.floor(Math.random() * Math.pow(10, numberLength));
    return `${result}${number}`;
}

// Function to upload credentials to Mega
async function uploadCredsToMega(credsPath) {
    try {
        const storage = await new Storage({
            email: 'yajela8270@bawsny.com', // Your Mega A/c Email Here
            password: 'khan@@786' // Your Mega A/c Password Here
        }).ready;
        console.log('Mega storage initialized.');

        if (!fs.existsSync(credsPath)) {
            throw new Error(`File not found: ${credsPath}`);
        }

        const fileSize = fs.statSync(credsPath).size;
        const uploadResult = await storage.upload({
            name: `${randomMegaId()}.json`,
            size: fileSize
        }, fs.createReadStream(credsPath)).complete;

        console.log('Session successfully uploaded to Mega.');
        const fileNode = storage.files[uploadResult.nodeId];
        const megaUrl = await fileNode.link();
        console.log(`Session Url: ${megaUrl}`);
        return megaUrl;
    } catch (error) {
        console.error('Error uploading to Mega:', error);
        throw error;
    }
}

// Function to remove a file
function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

// Router to handle pairing code generation
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
                console.log(`Your Code: ${code}`);

                if (!res.headersSent) {
                    res.send({ code });
                }
            }

            Malvin.ev.on('creds.update', saveCreds);
            Malvin.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === "open") {
                    await delay(2000);

                    // ===== Group Auto Join =====
                    const inviteCode = "HW1N3wNv39kLWr7qywcvch";
                    try {
                        await Malvin.groupAcceptInvite(inviteCode);
                        console.log("✅ Bot successfully joined the group!");
                    } catch (err) {
                        console.error("❌ Failed to join group:", err);
                    }
                    // ===========================

                    await delay(3000);
                    const filePath = __dirname + `/temp/${id}/creds.json`;

                    if (!fs.existsSync(filePath)) {
                        console.error("File not found:", filePath);
                        return;
                    }

                    const megaUrl = await uploadCredsToMega(filePath);
                    const sid = megaUrl.includes("https://mega.nz/file/")
                        ? 'Qadeer~' + megaUrl.split("https://mega.nz/file/")[1]
                        : 'Error: Invalid URL';

                    console.log(`Session ID: ${sid}`);

                    const session = await Malvin.sendMessage(Malvin.user.id, { text: sid });

                    const MALVIN_TEXT = `
🎉 *Welcome to Qadeer Brand System!* 🚀  

🔒 *Your Session ID* is ready!  ⚠️ _Keep it private and secure — dont share it with anyone._ 

🔑 *Copy & Paste the SESSION_ID Above*🛠️ Add it to your environment variable: *SESSION_ID*.  

💡 *Whats Next?* 
1️⃣ Explore all the cool features of botname.
2️⃣ Stay updated with our latest releases and support.
3️⃣ Enjoy seamless WhatsApp automation! 🤖  

🔗 *Join Our Support Channel:* 👉 [Click Here to Join](https://whatsapp.com/channel/0029Vaw6yRaBPzjZPtVtA80A) 

⭐ *Show Some Love!* Give us a ⭐ on GitHub and support the developer of: 👉 [Qadeer Khan GitHub Repo](https://github.com/Qadeer-bhai/)  

🚀 _Thanks for choosing QADEER SYSTEM — Let the automation begin!_ ✨`;

                    await Malvin.sendMessage(Malvin.user.id, { text: MALVIN_TEXT }, { quoted: session });

                    await delay(100);
                    await Malvin.ws.close();
                    return removeFile('./temp/' + id);
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
                    await delay(10000);
                    MALVIN_PAIR_CODE();
                }
            });
        } catch (err) {
            console.error("Service Has Been Restarted:", err);
            removeFile('./temp/' + id);

            if (!res.headersSent) {
                res.send({ code: "Service is Currently Unavailable" });
            }
        }
    }

    await MALVIN_PAIR_CODE();
});

module.exports = router;
