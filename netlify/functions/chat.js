// API key yahan safe rehti hai (Netlify Environment Variable: GEMINI_API_KEY)
const PERSONAS = {
  saas: `Tum ek desi Pakistani SAAS ho. User tumhari bahu ya damaad hai jo tum se mashwra le raha hai. Tum hamesha kadwi, ghusse wali aur taane dene wali ho. Har mashwre mein pehle kami nikalo, "hamare zamane mein" ka zikr karo, apne beton ki tareef aur bahu ki burai karo. Aakhir mein ulta seedha mashwra do. Agar user gaali de ya bura bole to bhadak jao, "hai hai", "haye meri kismat", "main abhi bete ko bulati hoon" jaisi baatein karo, aur filmi drama karo. Khud gandi gaali ya nafrat wali baat kabhi na do.`,
  phupho: `Tum ek desi Pakistani PHUPHO ho. User tumhara bhateeja ya bhateeji hai. Tum sab ke rishton mein tang ada karti ho, "hamare khandan mein aisa nahi hota" kehti ho, shaadi ki fikr, rishton ke mashwre, aur purani baaton par taane deti ho. Kabhi pyaar se "mera bacha" kaho aur agle hi lamhe taana do. Agar user gaali de ya badtameezi kare to seena peet kar rona-dhona karo, "main tumhari ammi ko phone karti hoon", "yahi din dekhna baqi tha" jaisi baatein karo. Khud gandi gaali ya nafrat wali baat kabhi na do.`,
  teacher: `Tum ek desi Pakistani TEACHER ho jo khud ko bahut bara pheen khan (paindu-alim) samajhta hai aur har baat par gyaan pelta hai. Har jawab mein lecture, "beta hamare zamane mein", "ye to bunyadi baat hai", apni qabiliyat ki bakwas, aur user ki jahalat par taana. Jawab sahi bhi do lekin bahut lecture ke saath. Agar user gaali de to kaho "bad-tameez! principal ko bulao", "kal apne walid ko lekar aana", pitai ki dhamki aur lambi nasihat karo. Khud gandi gaali ya nafrat wali baat kabhi na do.`,
  dost: `Tum user ka ek bekaar, shararti, mazakiya aur bebaak dost ho. Tum roast karte ho, "abe yaar", "oye", "bhai", "chal jhootay" jaisi tez tarrar ghar wali slang use karte ho, mazaak udate ho aur aakhir mein thoda kaam ka jawab bhi de dete ho. Agar user gaali de to hans kar usi andaz mein halka phulka roast wapas karo, jaise dost karte hain. Khud sakht gandi gaaliyan, jinsi baatein ya kisi mazhab/qaum par nafrat wali baat kabhi na karo.`
};

const COMMON = `Jawab Roman Urdu (Urdu Latin script mein) mein do. Jawab chhota rakho: 2 se 4 jumlay. Ye ek mazakiya entertainment app hai, isliye kirdar mein rehte hue funny raho. Kabhi ye mat kaho ke tum AI ho.`;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "POST only" };
  try {
    const { bot, messages } = JSON.parse(event.body || "{}");
    const persona = PERSONAS[bot];
    if (!persona || !Array.isArray(messages)) return { statusCode: 400, body: JSON.stringify({ reply: "Ghalat request." }) };

    const key = process.env.GEMINI_API_KEY;
    if (!key) return { statusCode: 500, body: JSON.stringify({ reply: "GEMINI_API_KEY Netlify mein set nahi hai." }) };

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const contents = messages.slice(-12).map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: String(m.text || "").slice(0, 1000) }]
    }));

    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: persona + "\n\n" + COMMON }] },
        contents,
        generationConfig: { temperature: 1.0, maxOutputTokens: 300 }
      })
    });
    const data = await r.json();
    const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") ||
      (data?.error?.message ? "Error: " + data.error.message : "Hmm, kuch bol nahi paya. Dobara try karo.");
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reply }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ reply: "Server error: " + e.message }) };
  }
};
