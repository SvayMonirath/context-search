import { toast } from "react-toastify";
import { API_BASE_URL } from "./global.api";

export const BASE_URL = "search";


export const statelesSearchAPI = async (query: string, aiId: string, onEvent: (data: any) => void, chatId?: string, profileId?: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${BASE_URL}/stream/stateless?chatId=${chatId}&profileId=${profileId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, aiId}),
      credentials: "include",
    });

    if(!response.body) {
      throw new Error("Failed to read response stream.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

    while(true) {
      const { value, done } = await reader.read();
      if(done) break;

      buffer += decoder.decode(value, { stream: true });

      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() || "";

      for (const chunk of chunks) {
        if (!chunk.startsWith("data: ")) continue;
        try {
          const json = JSON.parse(chunk.replace("data: ", ""));
          onEvent(json);
        } catch (error) {
          console.error("Failed to parse chunk:", chunk, error);
        }
      }
    }
  } catch (error: any) {
    console.error("Error in statelessSearchAPI:", error);
    toast.error(error.message)
  }
}

export const searchAPI = async (query: string, aiId: string, onEvent: (data: any) => void, chatId?: string, profileId?: string) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/${BASE_URL}/stream?chatId=${chatId}&profileId=${profileId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, aiId }),
        credentials: "include",
      },
    );

    if (!response.body) {
      throw new Error("Failed to read response stream.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() || "";

      for (const chunk of chunks) {
        if (!chunk.startsWith("data: ")) continue;
        try {
          const json = JSON.parse(chunk.replace("data: ", ""));
          
          onEvent(json);
        } catch (error) {
          console.error("Failed to parse chunk:", chunk, error);
        }
      }
    }
  } catch (error: any) {
    console.error("Error in searchAPI:", error);
    toast.error(error.message);
  }
}
