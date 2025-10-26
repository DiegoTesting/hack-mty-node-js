import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import { speechToText, textToSpeech } from "./services/elevenlabs.service.js";
import { getResponse } from "./services/openrouter.service.js";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import testOpenRouterRoutes from "./routes/testopenrouter.routes.js";

dotenv.config();
const app = express();
const upload = multer({ dest: "uploads/" });
const PORT = process.env.PORT || 3000;

// Inicializamos el cliente de ElevenLabs
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

app.use(express.json());

// Endpoint de voice-chat existente
app.post("/voice-chat", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Se requiere archivo de audio" });

  try {
    // 1️⃣ Convertir voz a texto
    const userText = await speechToText(req.file.path);

    // 2️⃣ Obtener respuesta de OpenRouter
    const botResponse = await getResponse(userText);

    // 3️⃣ Convertir respuesta a voz
    const audioFile = await textToSpeech(botResponse);

    res.download(audioFile, "response.mp3");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error procesando la solicitud" });
  }
});

// 🔹 Nuevo endpoint: solo TTS
app.post("/tts", async (req, res) => {
  const { text, voiceId } = req.body;
  if (!text) return res.status(400).json({ error: "El campo 'text' es obligatorio" });

  try {
    const audioStream = await elevenlabs.textToSpeech.convert(
      voiceId || "JBFqnCBsd6RMkjVDRZzb",
      {
        text,
        modelId: "eleven_multilingual_v2",
        outputFormat: "mp3_44100_128",
      }
    );

    // Convertimos el stream a buffer
    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.length,
    });
    res.send(audioBuffer);
  } catch (error) {
    console.error("Error en TTS:", error);
    res.status(500).json({ error: "Error generando audio" });
  }
});


// 🔹 Nuevo endpoint: solo STT
app.post("/stt", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Se requiere archivo de audio" });

  try {
    const userText = await speechToText(req.file.path);
    res.json({ text: userText });
  } catch (error) {
    console.error("Error en STT:", error);
    res.status(500).json({ error: "Error transcribiendo audio" });
  }
});


app.use("/", testOpenRouterRoutes);



app.use(express.json());
app.use("/api", testOpenRouterRoutes);

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
