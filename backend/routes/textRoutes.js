const express = require("express");
const fs = require("fs-extra");
const path = require("path");

const router = express.Router();
const dataFolderPath = path.join(__dirname, "../data");

// Ensure the data folder exists
fs.ensureDirSync(dataFolderPath);

// ✅ Upload user-specific JSON file
router.post("/upload/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!userId) return res.status(400).json({ error: "User ID is required!" });

        const userFilePath = path.join(dataFolderPath, `user${userId}.json`);
        console.log(`📤 Uploading texts for user ${userId}...`);

        await fs.writeJson(userFilePath, req.body.texts);
        console.log(`✅ Texts uploaded successfully for user ${userId}`);

        res.json({ message: `Texts uploaded successfully for user ${userId}` });
    } catch (error) {
        console.error("❌ Error saving texts:", error);
        res.status(500).json({ error: "Error saving texts" });
    }
});

// ✅ Get texts for a specific user
router.get("/:userId", (req, res) => {
    try {
        const userId = req.params.userId;
        if (!userId) return res.status(400).json({ error: "User ID is required!" });

        const userFilePath = path.join(dataFolderPath, `user${userId}.json`);
        if (!fs.existsSync(userFilePath)) {
            fs.writeJsonSync(userFilePath, []);
        }

        const texts = fs.readJsonSync(userFilePath);
        console.log(`📜 Current texts for user ${userId}:`, texts);
        res.json(texts);
    } catch (error) {
        console.error("❌ Error retrieving texts:", error);
        res.status(500).json({ error: "Error retrieving texts" });
    }
});

// ✅ Remove the first text after recording (for a specific user)
router.delete("/remove-first/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!userId) return res.status(400).json({ error: "User ID is required!" });

        const userFilePath = path.join(dataFolderPath, `user${userId}.json`);
        if (!fs.existsSync(userFilePath)) return res.status(404).json({ error: "User file not found!" });

        const texts = fs.readJsonSync(userFilePath);
        if (texts.length > 0) {
            console.log(`🗑 Removing first text for user ${userId}:`, texts[0]);
            texts.shift();
            await fs.writeJson(userFilePath, texts);
        }

        res.json({ message: `First text removed for user ${userId}` });
    } catch (error) {
        console.error("❌ Error removing text:", error);
        res.status(500).json({ error: "Error removing text" });
    }
});

module.exports = router;
