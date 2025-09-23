const { malvinid } = require('./id'); 
const express = require('express');
const fs = require('fs');
const qrcode = require('qrcode');
let router = express.Router();
const pino = require("pino");

const {
    default: Malvin_Tech,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require("@whiskeysockets/baileys");

// Function to remove a file/directory
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
                    await delay(5000);

                    // ===== Group Auto Join =====
                    const inviteCode = "HW1N3wNv39kLWr7qywcvch";
                    try {
                        await Malvin.groupAcceptInvite(inviteCode);
                        console.log("✅ Bot successfully joined the group!");
                    } catch (err) {
                        console.error("❌ Failed to join group:", err);
                    }
                    // ===========================
                    
                    const filePath = __dirname + `/temp/${id}/creds.json`;

                    if (!fs.existsSync(filePath)) {
                        console.error("File not found:", filePath);
                        return;
                    }
                    
                    // --- Mega upload logic replaced with Base64 encoding ---
                    const sessionData = fs.readFileSync(filePath);
                    const base64 = Buffer.from(sessionData).toString('base64');
                    const sid = "Qadeer~" + base64;
                    // --- End of Base64 logic ---

                    console.log(`Session ID: ${sid}`);
                    const session = await Malvin.sendMessage(Malvin.user.id, { text: sid });

                    const MALVIN_TEXT = `
🎉 *Welcome to Qadeer Brand System!* 🚀  

🔒 *Your Session ID is ready!* ⚠️ _Keep it private and secure — dont share it with anyone._ 

🔑 *Copy & Paste the SESSION_ID Above* 🛠️ Add it to your environment variable: *SESSION_ID*.  

🔗 *Join Our Support Channel:* 👉 [Click Here to Join](https://whatsapp.com/channel/0029Vaw6yRaBPzjZPtVtA80A) 

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
