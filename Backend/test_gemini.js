// Test script - run: node test_gemini.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
console.log("API Key found:", apiKey ? "YES (starts with " + apiKey.substring(0, 10) + "...)" : "NO - MISSING!");

async function testGemini() {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Test 1: Simple call without systemInstruction
        console.log("\n--- Test 1: Simple call ---");
        const model1 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result1 = await model1.generateContent("Say hello in Thai, respond with JSON only: {\"message\": \"...\"}");
        console.log("SUCCESS! Response:", result1.response.text());

        // Test 2: With systemInstruction as string
        console.log("\n--- Test 2: systemInstruction as string ---");
        const model2 = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: "You are a helpful assistant. Always respond in JSON format."
        });
        const result2 = await model2.generateContent("Say hello in Thai");
        console.log("SUCCESS! Response:", result2.response.text());

        // Test 3: With Chat + systemInstruction
        console.log("\n--- Test 3: Chat with systemInstruction ---");
        const model3 = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: "You are a DM. Respond in JSON with keys: narrative, choices (array of 4 strings), questionNumber, isFinished"
        });
        const chat = model3.startChat({
            history: [],
            generationConfig: { responseMimeType: "application/json" }
        });
        const result3 = await chat.sendMessage("Start a short adventure scene 1");
        console.log("SUCCESS! Response:", result3.response.text());

        console.log("\n=== ALL TESTS PASSED ===");
    } catch (error) {
        console.error("\nFAILED! Error details:");
        console.error("Name:", error.name);
        console.error("Message:", error.message);
        console.error("Status:", error.status);
        if (error.errorDetails) {
            console.error("Error Details:", JSON.stringify(error.errorDetails, null, 2));
        }
    }
}

testGemini();
