import { db } from "./index";
import * as schema from "@shared/schema";
import { v4 as uuidv4 } from "uuid";

async function seed() {
  try {
    console.log("Seeding database...");

    // Create some sample conversations
    const conversations = [
      {
        id: uuidv4(),
        title: "English to Spanish",
        sourceLanguage: "en-US",
        targetLanguage: "es-ES",
        createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        updatedAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: uuidv4(),
        title: "English to French",
        sourceLanguage: "en-US",
        targetLanguage: "fr-FR",
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    for (const conversation of conversations) {
      // Check if conversation already exists
      const existing = await db.query.conversations.findFirst({
        where: (conv) => 
          conv.title === conversation.title && 
          conv.sourceLanguage === conversation.sourceLanguage && 
          conv.targetLanguage === conversation.targetLanguage
      });

      if (!existing) {
        await db.insert(schema.conversations).values(conversation);
        console.log(`Created conversation: ${conversation.title}`);
      } else {
        console.log(`Conversation already exists: ${conversation.title}`);
      }
    }

    // Add sample messages to the first conversation
    const sampleConversation = await db.query.conversations.findFirst({
      where: (conv) => conv.title === "English to Spanish"
    });

    if (sampleConversation) {
      const sampleMessages = [
        {
          id: uuidv4(),
          conversationId: sampleConversation.id,
          text: "Hi there! Can you help me find a nearby restaurant?",
          isUser: true,
          sourceLanguage: "en-US",
          targetLanguage: "es-ES",
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: uuidv4(),
          conversationId: sampleConversation.id,
          text: "¡Claro que sí! Hay un restaurante muy bueno a dos cuadras de aquí. Se llama \"La Tapería\" y tienen las mejores tapas de la ciudad.",
          isUser: false,
          sourceLanguage: "es-ES",
          targetLanguage: "en-US",
          createdAt: new Date(Date.now() - 7140000).toISOString(),
        },
        {
          id: uuidv4(),
          conversationId: sampleConversation.id,
          text: "That sounds great! How far is it from here exactly? And do they take credit cards?",
          isUser: true,
          sourceLanguage: "en-US",
          targetLanguage: "es-ES",
          createdAt: new Date(Date.now() - 7080000).toISOString(),
        },
        {
          id: uuidv4(),
          conversationId: sampleConversation.id,
          text: "Está a unos 200 metros, solo 5 minutos caminando. Y sí, aceptan tarjetas de crédito sin problema. También tienen un menú en inglés si lo prefieres.",
          isUser: false,
          sourceLanguage: "es-ES",
          targetLanguage: "en-US",
          createdAt: new Date(Date.now() - 7020000).toISOString(),
        },
      ];

      // Check if messages already exist for this conversation
      const existingMessages = await db.query.messages.findMany({
        where: (msg) => msg.conversationId === sampleConversation.id
      });

      if (existingMessages.length === 0) {
        for (const message of sampleMessages) {
          await db.insert(schema.messages).values(message);
        }
        console.log(`Added sample messages to conversation: ${sampleConversation.title}`);
      } else {
        console.log(`Messages already exist for conversation: ${sampleConversation.title}`);
      }
    }

    // Add default voice profiles
    const voiceProfiles = [
      {
        id: uuidv4(),
        name: "Default",
        languageCode: "en-US",
        pitch: 1.0,
        rate: 1.0,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        name: "Slow and Clear",
        languageCode: "en-US",
        pitch: 0.9,
        rate: 0.8,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        name: "Spanish Voice",
        languageCode: "es-ES",
        pitch: 1.0,
        rate: 1.0,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        name: "French Voice",
        languageCode: "fr-FR",
        pitch: 1.0,
        rate: 1.0,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const profile of voiceProfiles) {
      // Check if profile already exists with same name and language
      const existingProfile = await db.query.voiceProfiles.findFirst({
        where: (p) => p.name === profile.name && p.languageCode === profile.languageCode
      });

      if (!existingProfile) {
        await db.insert(schema.voiceProfiles).values(profile);
        console.log(`Created voice profile: ${profile.name} (${profile.languageCode})`);
      } else {
        console.log(`Voice profile already exists: ${profile.name} (${profile.languageCode})`);
      }
    }

    // Get the default profile for speech settings
    const defaultProfile = await db.query.voiceProfiles.findFirst({
      where: (p) => p.isDefault === true
    });

    if (defaultProfile) {
      // Add global speech settings
      const existingSettings = await db.query.speechSettings.findFirst({
        where: () => true
      });

      if (!existingSettings) {
        await db.insert(schema.speechSettings).values({
          id: uuidv4(),
          autoPlay: true,
          useProfileForLanguage: true,
          defaultProfileId: defaultProfile.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        console.log("Created default speech settings");
      } else {
        console.log("Speech settings already exist");
      }
    }
    
    console.log("Database seeding completed!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
