import OpenAI from "openai";
const api_key = 'sk-85aa2dc696444d0c977d1a08a411a506'
const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: api_key
});

async function main() {
    const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: "You are a helpful assistant." }],
        model: "deepseek-chat",
    });

    console.log(completion.choices[0].message.content);
}

main();