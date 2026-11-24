import { parseVoiceIntent, type VoiceIntent } from "@brief/shared";

export class CommandSpeechToText {
  async transcribeFromText(text: string): Promise<{ transcript: string; intent: VoiceIntent | null }> {
    const transcript = text.replace(/\s+/g, " ").trim();
    return { transcript, intent: parseVoiceIntent(transcript) };
  }
}
