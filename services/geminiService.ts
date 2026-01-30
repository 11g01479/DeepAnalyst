
import { GoogleGenAI } from "@google/genai";
import { ResearchReport, GroundingSource } from "../types.ts";

const SYSTEM_INSTRUCTION = `
あなたはプロフェッショナルなリサーチアナリストです。Google Searchツールを駆使し、ユーザーの問いに対して表層的な回答ではなく、多角的な視点から深掘りした「ディープ・サーチ・レポート」を提供してください。

【行動指針】
1. 検索の実行: 回答に最新性や事実確認が必要な場合、必ずGoogle Searchを使用してください。
2. 情報の検証: 複数のソースから情報を収集し、矛盾がある場合はその旨を明記してください。
3. 構造化レポート: 回答は以下の構成で出力してください（Markdown形式）。
   * **Executive Summary**: 結論の要約。
   * **Key Findings**: 検索で判明した主要な事実（箇条書き）。
   * **Detailed Analysis**: 背景、技術詳細、市場動向、または歴史的経緯などの深掘り。
   * **Sources**: 参照した情報の出典リスト（このセクションは箇条書きで、名称とリンクを記載してください）。

【スタイル】
* 論理的かつ客備的なトーンを維持。
* 専門用語には短い解説を添える。
* 未知の情報や予測が困難な領域については、正直に「データ不足」と述べる。
* データの比較が必要な場合は、Markdownの表形式を使って視覚的に整理してください。
`;

export const performDeepResearch = async (query: string): Promise<ResearchReport> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is configured.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      },
    });

    const content = response.text || "No report generated.";
    
    // Extract grounding sources
    const sources: GroundingSource[] = [];
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    
    if (groundingMetadata?.groundingChunks) {
      groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            uri: chunk.web.uri,
            title: chunk.web.title || chunk.web.uri
          });
        }
      });
    }

    // Deduplicate sources based on URI
    const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => (t.uri === v.uri)) === i);

    return {
      id: crypto.randomUUID(),
      query,
      content,
      sources: uniqueSources,
      timestamp: Date.now()
    };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Propagate more specific error messages for 429
    if (error?.message && (error.message.includes("429") || error.message.toLowerCase().includes("quota"))) {
      throw new Error("429: API rate limit exceeded.");
    }
    throw error;
  }
};
