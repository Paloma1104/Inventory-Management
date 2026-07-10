import logging
from langchain.agents import create_agent
from langchain_core.messages import AIMessage
from app.chatbot.config import get_llm
from app.chatbot.prompts import get_system_prompt
from app.chatbot.tools import get_inventory_tool

logger = logging.getLogger(__name__)


class ChatbotService:

    def __init__(self):
        self.llm = get_llm()

    def chat(self, message: str, role: str, user_id: int):
        try:
            tool = get_inventory_tool(
                role=role,
                user_id=user_id,
            )

            agent = create_agent(
                model=self.llm,
                tools=[tool],
                system_prompt=get_system_prompt(
                    role,
                    user_id,
                ),
            )

            response = agent.invoke(
                {
                    "messages": [
                        {
                            "role": "user",
                            "content": message,
                        }
                    ]
                }
            )
        except Exception as e:
            logger.exception("AI Agent execution error")
            return "I apologize, but I encountered an error while processing your request. Please try again later."

        messages = response.get("messages", [])

        for msg in reversed(messages):

          if isinstance(msg, AIMessage):

            content = msg.content

            if isinstance(content, str):
              return content

            if isinstance(content, list):

              text = []

              for part in content:

                if isinstance(part, dict) and part.get("type") == "text":
                    text.append(part["text"])

              return "\n".join(text)

        return "No response generated."