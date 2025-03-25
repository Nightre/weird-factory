import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import { CONFIG } from "../gpt-config.js";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const promptPath = path.join(__dirname, 'prompt');
const PROMPT_TEXTS = {
    machine: fs.readFileSync(path.join(promptPath, 'machine.md'), 'utf8'),
    synthesis: fs.readFileSync(path.join(promptPath, 'synthesis.md'), 'utf8'),
    base: fs.readFileSync(path.join(promptPath, 'base.md'), 'utf8'),
    evaluate: fs.readFileSync(path.join(promptPath, 'evaluate.md'), 'utf8'),
    changeInput: fs.readFileSync(path.join(promptPath, 'change-input.md'), 'utf8'),
};

// 初始化 AI 客户端
const deepseekClient = new OpenAI({
    baseURL: CONFIG.DEEPSEEK.BASE_URL,
    apiKey: CONFIG.DEEPSEEK.API_KEY
});

const googleAiClient = new GoogleGenerativeAI(CONFIG.GOOGLE.API_KEY);

const contextToStr = (gptContext) => {
    return `### 历史发生事件 ：\n 你可以用这个历史记录来更好的模拟： ${gptContext.map((text, id) => `第${id}轮：${text}`).join("\n")} \n\n 现在是${gptContext.length + 2}轮，请根据历史记录来执行当前轮需要执行的操作。`
}

/**
 * 合成物品
 * @param {string} item1 - 第一个物品
 * @param {string} item2 - 第二个物品（可选）
 * @param {string} modelType - AI模型类型
 * @returns {Promise<string>} 合成结果
 */
export const synthesizeItems = async (item1, item2, gptContext) => {
    const systemPrompt = PROMPT_TEXTS.base + PROMPT_TEXTS.machine + contextToStr(gptContext) + PROMPT_TEXTS.synthesis;
    const userPrompt = item2 ? `${item1} + ${item2}` : item1;

    const response = await sendToModel(systemPrompt, userPrompt);
    return cleanJsonResponse(response);
};

export const changeItemsInputs = async (prompt, item, gptContext) => {
    console.log(item, prompt)
    const systemPrompt = PROMPT_TEXTS.base + contextToStr(gptContext) + PROMPT_TEXTS.changeInput;
    const userPrompt = `${item} 添加了："${prompt}" 操作`;

    const response = await sendToModel(systemPrompt, userPrompt);
    return cleanJsonResponse(response);
};

/**
 * 处理机器动作
 * @param {string} machineState - 机器状态
 * @param {string} playerNode - 玩家节点
 * @param {string} playerAction - 玩家操作
 * @param {string} modelType - AI模型类型
 * @returns {Promise<string>} 处理结果
 */
export const processMachineAction = async (machineState, playerNode, playerAction, gptContext) => {
    const systemPrompt = PROMPT_TEXTS.base + PROMPT_TEXTS.machine;
    const userPrompt = `历史记录:${contextToStr(gptContext)} 该机器/物品：${machineState} 玩家节点：${playerNode} 玩家操作:${playerAction}`;

    const response = await sendToModel(systemPrompt, userPrompt);
    const result = cleanJsonResponse(response);

    return result;
};

export const autoProcessMachineAction = async (machineState, prompt, gptContext) => {
    const systemPrompt = PROMPT_TEXTS.base + PROMPT_TEXTS.machine;
    const userPrompt = `历史记录:${contextToStr(gptContext)} （机器自己自动操作，并非玩家操作）该机器/物品：${machineState} 任务：${prompt}`;
    console.log(userPrompt)
    const response = await sendToModel(systemPrompt, userPrompt);
    const result = cleanJsonResponse(response);

    return result;
};

/**
 * 评估物品价值
 * @param {string} itemName - 物品名称
 * @param {Object} constraints - 价格约束
 * @param {string} modelType - AI模型类型
 * @returns {Promise<Object>} 价格评估结果
 */
export const evaluateItemValue = async (itemName, constraints) => {
    const systemPrompt = constraints.prompt + PROMPT_TEXTS.evaluate;
    const response = (await sendToModel(systemPrompt, itemName));
    const { price, reason } = cleanJsonResponse(response)
    return {
        price: Math.max(constraints.min, Math.min(constraints.max, Number(price) ?? 0)),
        reason
    };
};

/**
 * 发送请求到AI模型
 * @param {string} systemPrompt - 系统提示词
 * @param {string} userPrompt - 用户提示词
 * @param {string} modelType - 模型类型
 * @returns {Promise<string>} 模型响应
 */
const sendToModel = async (systemPrompt, userPrompt, modelType = "gg") => {
    switch (modelType) {
        case "dpsk":
            return await sendToDeepseek(systemPrompt, userPrompt);
        case "gg":
            return await sendToGoogle(systemPrompt, userPrompt);
        default:
            throw new Error("modelType is required")
    }
};

/**
 * 发送到Deepseek模型
 */
const sendToDeepseek = async (systemPrompt, userPrompt) => {
    const completion = await deepseekClient.chat.completions.create({
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        model: CONFIG.DEEPSEEK.MODEL,
        temperature: CONFIG.TEMPERATURE
    });
    return completion.choices[0].message.content;
};

/**
 * 发送到Google模型
 */
const sendToGoogle = async (systemPrompt, userPrompt) => {
    const model = googleAiClient.getGenerativeModel({
        model: CONFIG.GOOGLE.MODEL,
        safetySettings: [
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            }
        ]
    });

    const chat = model.startChat({
        history: [
            { role: "user", parts: [{ text: systemPrompt }] }
        ],
        generationConfig: {
            responseMimeType: "application/json",
            temperature: CONFIG.TEMPERATURE
        }
    });

    const result = await chat.sendMessage(userPrompt);
    return result.response.text();
};

/**
 * 清理JSON响应
 */
const cleanJsonResponse = (response) => {
    let jsonResponse;

    if (response.startsWith("```json")) {
        response = response.trim().slice(7, -3).trim();
    }

    jsonResponse = JSON.parse(response);
    fs.promises.writeFile('../last-gpt.json', JSON.stringify(jsonResponse, null, 2))
        .catch(err => console.error('写入调试文件失败:', err));


    return jsonResponse;
};


export const addGptContext = (gptContext, description, ids) => {
    if (gptContext && description) {
        for (const [id, newId] of Object.entries(ids)) {
            description = description.replaceAll(`ID_${id}`, newId)
        }
        gptContext.push(`${description}}`)
        if (gptContext.length > CONFIG.MAX_CONTEXT) {
            gptContext.shift()
        }
    }
}