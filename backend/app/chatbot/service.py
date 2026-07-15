import json
import logging
import time
from langchain_core.prompts import ChatPromptTemplate
from app.chatbot.config import get_llm
from app.chatbot.prompts import get_sql_generation_prompt, get_response_prompt
from app.chatbot.schema import SQLQuery
from app.chatbot.tools import execute_inventory_query

logger = logging.getLogger(__name__)


class ChatbotService:

    def __init__(self):
        self.llm = get_llm()
        # Pre-cache/reuse the LLM instance with structured output
        self.sql_generator = self.llm.with_structured_output(SQLQuery)

    def chat(self, message: str, role: str, user_id: int) -> str:
        total_start = time.perf_counter()
        
        try:
            sql_prompt = get_sql_generation_prompt(role, user_id)
            prompt_template = ChatPromptTemplate.from_messages([
                ("system", sql_prompt),
                ("user", "{question}")
            ])
            chain = prompt_template | self.sql_generator
            
            t = time.perf_counter()
            result = chain.invoke({"question": message})
            logger.info("SQL generation took: %.3fs", time.perf_counter() - t)
            
            generated_sql = result.sql if result else None
            if not generated_sql:
                logger.error("Gemini failed to generate SQL query (empty structured output)")
                return "I apologize, but I was unable to generate a search query for your request."
            
            logger.info("Generated SQL query: %s", generated_sql)
                
        except Exception as exc:
            logger.exception("AI SQL generation error")
            return "I apologize, but I encountered an error while analyzing your request."

        try:
            rows = execute_inventory_query(generated_sql, role, user_id)
        except ValueError as val_err:
            logger.warning("SQL validation failed for query '%s' by user %s: %s", generated_sql, user_id, val_err)
            return f"I cannot process this request: {str(val_err)}"
        except PermissionError as perm_err:
            logger.warning("RBAC validation failed for query '%s' by user %s: %s", generated_sql, user_id, perm_err)
            return f"Access denied: {str(perm_err)}"
        except Exception as db_err:
            logger.exception("Database query execution error for: %s", generated_sql)
            return "I encountered a database error while executing the search."

        if not rows:
            return "No records were found matching your request."

        try:
            sql_results_str = json.dumps(rows, default=str)
            response_prompt = get_response_prompt()
            
            prompt_template = ChatPromptTemplate.from_messages([
                ("system", response_prompt),
                ("user", "Original Question: {question}\nSQL Query Results: {sql_results}")
            ])
            chain_ans = prompt_template | self.llm
            
            t = time.perf_counter()
            ans_result = chain_ans.invoke({
                "question": message,
                "sql_results": sql_results_str
            })
            logger.info("Answer generation took: %.3fs", time.perf_counter() - t)
            logger.info("TOTAL pipeline time: %.3fs", time.perf_counter() - total_start)
            
            content = ans_result.content
            if isinstance(content, str):
                return content
            if isinstance(content, list):
                text_parts = []
                for part in content:
                    if isinstance(part, dict) and part.get("type") == "text":
                        text_parts.append(part["text"])
                    elif isinstance(part, str):
                        text_parts.append(part)
                return "\n".join(text_parts)
            return "No response generated."
            
        except Exception as exc:
            logger.exception("AI answer generation error")
            return "I successfully retrieved the data but encountered an error formatting the final answer."