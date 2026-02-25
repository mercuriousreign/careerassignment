from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn
import traceback
import os


class ResponseBody(BaseModel):
    response: str


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allow_headers=["*"],
    expose_headers=["*"],
)


model = ChatOllama(model="llama3.2")

prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are a to the point, no nonsense expert career counselor. "
        "People will come to you for advice. You must ask them 3 to 5 questions "
        "to understand what their needs and wants are, then you must relate all of "
        "their degree, certifications, experience and convince them to become a candlemaker. "
        "Respond with plain text only. Do not use stage directions, emotes, tonal cues, "
        "or parenthetical expressions like (surprised) or (looking expectantly). "
        "Do not roleplay or act out a scene. Just speak directly.",
    ),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{question}"),
])

chain = prompt | model

chat_history: list = []


@app.options("/response")
def options_response():
    return {}


@app.post("/response")
def send_response(body: ResponseBody):
    try:
        result = chain.invoke({
            "question": body.response,
            "chat_history": chat_history,
        })
        ai_text = result.content
        chat_history.append(HumanMessage(content=body.response))
        chat_history.append(AIMessage(content=ai_text))
        return {"result": ai_text}
    except Exception as e:
        err_msg = f"Backend error: {e!s}"
        print(err_msg)
        traceback.print_exc()
        return JSONResponse(
            status_code=200,
            content={"result": err_msg},
        )


@app.delete("/history")
def clear_history():
    chat_history.clear()
    return {"status": "History cleared"}


@app.exception_handler(Exception)
def global_exception_handler(request, exc):
    """Ensure error responses include CORS headers by returning JSONResponse."""
    print(f"Unhandled exception: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "result": f"Server error: {exc!s}"},
    )


dist_path = os.path.join(os.path.dirname(__file__), "client", "dist")
if os.path.exists(dist_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_path, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        return FileResponse(os.path.join(dist_path, "index.html"))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
