const { malvinid } = require('./id'); 
const express = require('express');
const fs = require('fs');
const qrcode = require('qrcode');
const axios = require('axios'); // Axios ko istemal karenge
let router = express.Router();
const pino = require("pino");

const {
    default: Malvin_Tech,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require("@whiskeysockets/baileys");

// Naya function session ko Nekobin par upload karne ke liye
async function uploadToNekobin(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const response = await axios.post('https://nekobin.com/api/documents', fileContent, {
            headers: { 'Content-Type': 'text/plain' }
        });
        if (response.data && response.data.result && response.data.result.key) {
            return response.data.result.key; // Yeh key hi aapki ID hogi
        } else {
            throw new Error('Could not get a key from Nekobin response');
        }
    } catch (error) {
        console.error('Error uploading to Nekobin:', error.message);
        return null;
    }
}

// Function to remove a file
function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

// Router to handle QR code generation
router.get('/', async (req, res) => {
    const id = malvinid(); 
    
    async function MALVIN_QR_CODE() {
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

            Malvin.ev.on('creds.update', saveCreds);
            Malvin.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect, qr } = s;

                if (qr) {
                    if (!res.headersSent) {
                        try {
                            const qrCodeDataURL = await qrcode.toDataURL(qr);
                            res.send({ qr: qrCodeDataURL });
                        } catch (e) {
                            console.error("Failed to generate QR code:", e);
                            removeFile('./temp/' + id);
                            if (!res.headersSent) res.status(500).send({ error: "Failed to generate QR code." });
                        }
                    }
                }

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

                    const pasteKey = await uploadToNekobin(filePath);
                    if (!pasteKey) {
                        console.error("Failed to upload to Nekobin, session cannot be sent.");
                        await Malvin.sendMessage(Malvin.user.id, { text: "❗ Error: Could not generate Session ID. Please try again later." });
                        return removeFile('./temp/' + id);
                    }

                    const sid = 'Qadeer~' + pasteKey;
                    console.log(`Session ID: ${sid}`);

                    const session = await Malvin.sendMessage(Malvin.user.id, { text: sid });

                    const MALVIN_TEXT = `
🎉 *Welcome to Qadeer Brand System!* 🚀

🔒 *Your Session ID is ready!* ⚠️ _Keep it private and secure — don’t share it with anyone._

🔑 *How to get your Session File:*
1️⃣ Copy the key from your Session ID (the part after \`Qadeer~\`).
2️⃣ Open this URL in your browser: \`https://nekobin.com/\`
3️⃣ Paste your key at the end of the URL.
    Example: \`https://nekobin.com/${pasteKey}\`
4️⃣ Click the "Raw" button to see all the text.
5️⃣ Copy all the text and paste it into a new file named \`creds.json\`.

🔗 *Join Our Support Channel:* 👉 [Click Here to Join](https://whatsapp.com/channel/0029VajWxSZ96H4SyQLurV1H)

⭐ *Show Some Love!* Give us a ⭐ on GitHub: 👉 [Qadeer Khan GitHub Repo](https://github.com/Qadeer-bhai/)

🚀 _Thanks for choosing QADEER SYSTEM — Let the automation begin!_ ✨`;

                    await Malvin.sendMessage(Malvin.user.id, { text: MALVIN_TEXT }, { quoted: session });

                    await delay(100);
                    await Malvin.ws.close();
                    return removeFile('./temp/' + id);
                    
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
                    await delay(10000);
                    MALVIN_QR_CODE();
                }
            });
        } catch (err) {
            console.error("Service Has Been Restarted:", err);
            removeFile('./temp/' + id);

            if (!res.headersSent) {
                res.status(500).send({ error: "Service is Currently Unavailable" });
            }
        }
    }
    await MALVIN_QR_CODE();
});

module.exports = router;
