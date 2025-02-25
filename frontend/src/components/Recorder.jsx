import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./styles.css";

const Recorder = () => {
    const [texts, setTexts] = useState([]);
    const [currentText, setCurrentText] = useState(null);
    const [recording, setRecording] = useState(false);
    const [audioChunks, setAudioChunks] = useState([]);
    const [audioUrl, setAudioUrl] = useState(null);
    const [recordedFiles, setRecordedFiles] = useState([]);
    const [folderCreated, setFolderCreated] = useState(false);
    const mediaRecorderRef = useRef(null);
    let folderHandle = useRef(null);

    // ✅ Load Texts and Recorded Files on Page Load
    useEffect(() => {
        axios.get("http://localhost:3000/texts").then((res) => {
            setTexts(res.data);
            setCurrentText(res.data.length > 0 ? res.data[0] : null);
        });

        axios.get("http://localhost:3000/audio/files").then((res) => {
            setRecordedFiles(res.data);
        });
    }, []);

    // ✅ Handle JSON File Upload
    const handleJsonUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);
                await axios.post("http://localhost:3000/texts/upload", { texts: data });

                setTexts(data);
                setCurrentText(data.length > 0 ? data[0] : null);

                console.log("✅ JSON Uploaded Successfully:", data);
            } catch (error) {
                console.error("❌ Invalid JSON file:", error);
                alert("⚠ Invalid JSON format. Please check the file.");
            }
        };
        reader.readAsText(file);
    };

    // ✅ Create Folder (`AudioDataset/Voice Dataset`)
    const createFolder = async () => {
        try {
            folderHandle.current = await window.showDirectoryPicker();
            const audioDataset = await folderHandle.current.getDirectoryHandle("AudioDataset", { create: true });
            await audioDataset.getDirectoryHandle("Voice Dataset", { create: true });

            setFolderCreated(true);
            console.log("✅ Folder created: AudioDataset/Voice Dataset");
        } catch (error) {
            console.error("❌ Folder creation failed:", error);
        }
    };

    // ✅ Start/Stop Recording
    const toggleRecording = async () => {
        if (!recording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                let chunks = [];

                mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(chunks, { type: "audio/wav" });
                    setAudioChunks(chunks);
                    setAudioUrl(URL.createObjectURL(audioBlob));
                };

                mediaRecorder.start();
                mediaRecorderRef.current = mediaRecorder;
                setRecording(true);
            } catch (err) {
                console.error("Microphone access denied:", err);
            }
        } else {
            mediaRecorderRef.current?.stop();
            setRecording(false);
        }
    };

    // ✅ Save Recording to `Voice Dataset`
    const saveRecording = async () => {
        if (!currentText || audioChunks.length === 0) return;
        if (!folderHandle.current) {
            alert("⚠ Please create a folder first!");
            return;
        }

        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });

        try {
            const audioDataset = await folderHandle.current.getDirectoryHandle("AudioDataset", { create: true });
            const voiceDataset = await audioDataset.getDirectoryHandle("Voice Dataset", { create: true });

            const fileHandle = await voiceDataset.getFileHandle(`${currentText.id}.wav`, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(audioBlob);
            await writable.close();

            console.log(`✅ Audio saved as: ${currentText.id}.wav`);
        } catch (error) {
            console.error("❌ Error saving file:", error);
        }

        await axios.delete("http://localhost:3000/texts/remove-first");
        setTexts((prev) => prev.slice(1));
        setCurrentText(texts[1]);

        setAudioUrl(null);
    };

    return (
        <div className="container">
            <h1>🎤 Voice Recorder</h1>

            {/* ✅ Create Folder Button */}
            <button onClick={createFolder} disabled={folderCreated}>📂 Create Folder</button>
            {folderCreated && <p>✅ Folder Created: `AudioDataset/Voice Dataset`</p>}

            {/* ✅ JSON Upload Input */}
            <input type="file" accept=".json" onChange={handleJsonUpload} />
            {texts.length === 0 && <p>⚠ No file uploaded</p>}

            {currentText ? <p>📝 {currentText.Text}</p> : <p>✅ All recordings completed!</p>}

            <button onClick={toggleRecording} disabled={!currentText}>
                {recording ? "⏹ Stop Recording" : "🎤 Start Recording"}
            </button>

            {audioUrl && (
                <>
                    <audio controls src={audioUrl}></audio>
                    <button onClick={saveRecording}>💾 Save Recording</button>
                </>
            )}

            <h2>🎵 Recorded Files</h2>
            {recordedFiles.length > 0 ? (
                recordedFiles.map((file, index) => (
                    <p key={index}>🔊 {file} ▶️</p>
                ))
            ) : (
                <p>(No recordings yet)</p>
            )}
        </div>
    );
};

export default Recorder;
