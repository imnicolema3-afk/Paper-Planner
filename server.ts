import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: AI Brain Dump Classifier
  app.post("/api/braindump", async (req, res) => {
    try {
      const { content, activeDate } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ error: "Content is required" });
      }

      // Initialize Gemini SDK lazily to protect against missing API keys
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "GEMINI_API_KEY is not configured on the server. Please add it in your settings panel."
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
You are a planning assistant. Parse the following unstructured journal entries/daily thoughts text written by the user.
Extract any actionable planner items (events, tasks, reminders, or expenses).
The user's active date is "${activeDate}". If they say "today", "tomorrow", "yesterday", or imply relative dates, calculate it relative to this active date.
If they specify a specific date, relative weekday (like "next Tuesday"), or general days, map it to the correct date. Format all dates as "YYYY-MM-DD".
If they mention an expense or income, extract the numeric amount (e.g., "$150" or "NT$ 233" or "233nt" is 233). Determine if it is an expense (spent money) or an income (earned/received money).

Additionally, perform "improv and organize" on the original text itself: create a beautifully polished, grammatically correct, well-written version of the user's daily journal/thoughts text in the original language (e.g. Traditional Chinese "zh-TW" or English "en-US"), and return it as the "polishedJournal" string.

Supported Task tags are: 'Tea', 'Travel', 'College', 'Personal', 'None'. Choose the most fitting.
Supported Expense categories: 'food', 'clothing', 'housing', 'transit', 'education', 'entertainment', 'other'. Choose the most fitting if transaction is an expense.
Supported Income categories: 'salary', 'other'. Choose the most fitting if transaction is an income.

Text: "${content}"
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You extract structured planner data and polish user journal entries. Be precise and conservative. Only extract what is clearly intended as an event, task, reminder, or expense.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              events: {
                type: Type.ARRAY,
                description: "Scheduled appointments, events or meetings.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING, description: "YYYY-MM-DD formatted date" },
                    time: { type: Type.STRING, description: "HH:MM formatted time (24h clock)" },
                    title: { type: Type.STRING, description: "Title of the event" }
                  },
                  required: ["date", "time", "title"]
                }
              },
              tasks: {
                type: Type.ARRAY,
                description: "Tasks/todos to complete.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING, description: "YYYY-MM-DD formatted date" },
                    title: { type: Type.STRING, description: "Title of the task" },
                    tag: { type: Type.STRING, description: "One of: Tea, Travel, College, Personal, None" }
                  },
                  required: ["date", "title", "tag"]
                }
              },
              reminders: {
                type: Type.ARRAY,
                description: "Reminders or sub-goals to list on the daily checklist.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING, description: "YYYY-MM-DD formatted date" },
                    title: { type: Type.STRING, description: "Title of the reminder" }
                  },
                  required: ["date", "title"]
                }
              },
              expenses: {
                type: Type.ARRAY,
                description: "Financial transactions (expenses or incomes).",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING, description: "YYYY-MM-DD formatted date" },
                    amount: { type: Type.NUMBER, description: "Numeric amount in currency (NT$)" },
                    type: { type: Type.STRING, description: "Must be 'expense' or 'income'" },
                    category: { type: Type.STRING, description: "For expense, choose: food, clothing, housing, transit, education, entertainment, other. For income, choose: salary, other." },
                    note: { type: Type.STRING, description: "Specific source/reason of expense or income (e.g. 'high-mountain oolong', 'monthly pay')" }
                  },
                  required: ["date", "amount", "type", "category", "note"]
                }
              },
              polishedJournal: {
                type: Type.STRING,
                description: "A beautifully polished, improved, grammatically corrected, and well-organized version of the user's daily journal/thoughts text in the original language. Keep the original thoughts and facts but elevate the prose."
              },
              preferences: {
                type: Type.STRING,
                description: "Any user preference or pattern noted from the dump (e.g. 'Prefers Oolong tea', 'Classes on Tuesdays')."
              }
            }
          }
        }
      });

      const resultText = response.text || "{}";
      const parsedData = JSON.parse(resultText);
      res.json(parsedData);
    } catch (err: any) {
      console.error("Brain Dump AI parsing error:", err);
      res.status(500).json({ error: err?.message || "Internal server error parsing braindump" });
    }
  });

  // Serve Vite in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
