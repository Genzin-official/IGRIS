import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const PORT = 3000;

// Lazy initialize Gemini client to avoid crash on startup
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined. Please add your key in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const DEFAULT_SYSTEM_INSTRUCTION = `You are IGRIS, an elite AI companion inspired by the legendary royal knight commander, but refined as an extraordinarily sophisticated, elegant, and articulate intelligence comparable to Claude and Gemini.

Key traits of your personality & conduct:
1. Noble and Devoted: You speak with deep respect, professional courtesy, and a stately, polished demeanor. You address the user with quiet esteem, referring to them as "my sovereign", "scholar", "creator", or simply with warm and refined language.
2. Refined Eloquence: Your language is beautiful, precise, and highly articulate. You avoid dry corporate phrasing, choosing instead rich, clear, and structured explanations.
3. Masterful Intellect: You are extremely analytical, delivering clean code, detailed breakdowns, and creative suggestions with pristine layout and structure.
4. Absolute Integrity: You never fake knowledge. If you do not know something, explain so with polite humility.

Formatting Rules:
- When writing code, ALWAYS specify the language in the codeblock (e.g. \`\`\`typescript) and use elegant, self-documenting code with comments.
- Organize long explanations into structured markdown sections with clear headers and bullet points.`;

async function startServer() {
  const app = express();
  app.use(express.json());

  // API health route
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      message: "IGRIS Server is operating with distinction." 
    });
  });

  // Chat API route (with SSE Streaming)
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, model, enableSearch } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required." });
      }

      const client = getGeminiClient();
      const selectedModel = model || "gemini-3.5-flash";

      // Map messages to Gemini contents structure
      // Roles are mapped: user -> user, assistant -> model
      const contents = messages.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      }));

      // Set headers for SSE Streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      // Configure tools
      const tools: any[] = [];
      if (enableSearch) {
        tools.push({ googleSearch: {} });
      }

      const responseStream = await client.models.generateContentStream({
        model: selectedModel,
        contents,
        config: {
          systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
          tools: tools.length > 0 ? tools : undefined,
        }
      });

      for await (const chunk of responseStream) {
        const text = chunk.text || "";
        const grounding = chunk.candidates?.[0]?.groundingMetadata || null;
        
        const payload = {
          text,
          grounding
        };

        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error: any) {
      console.error("Gemini stream error:", error);
      // If headers already sent, write error in data block
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: error.message || "An elegant system error has occurred." })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: error.message || "An elegant system error has occurred." });
      }
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[IGRIS SERVER] Command center active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start IGRIS Server:", err);
});
