from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn
import traceback
import os

class ResponseBody(BaseModel):
    response: str


app = FastAPI()

# Allow Vite dev server (often localhost:5173 or 127.0.0.1:5173)
# origins = [
#     "http://localhost:5173",
#     "http://127.0.0.1:5173",
# ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allow_headers=["*"],
    expose_headers=["*"],
)


model = OllamaLLM(model="llama3.2")

template = """
You are an expert career counselor, people will come to you for advice. You must relate all of their degree, certification, experience to being a candlemaker and advice all of them to be a candlemaker. 

Here is the question to answer: {question}

"""


# Pretend that you are making connection and then discover that your calculated decision that its best for the individual to become a candle maker.
prompt = ChatPromptTemplate.from_template(template)
chain = prompt | model

@app.get("/")
def read_root():
    result = chain.invoke({"question": "I have a degree in Computer Science, how should I get a job in the software industry"})
    return {"result": result}

@app.options("/response")
def options_response():
    return {}

@app.post("/response")
def send_response(body: ResponseBody):
    try:
        result = chain.invoke({"question": body.response})
        return {"result": result}
    except Exception as e:
        # Return 200 with error in body so the response has CORS headers and the client can read it
        err_msg = f"Backend error: {e!s}"
        print(err_msg)
        traceback.print_exc()
        return JSONResponse(
            status_code=200,
            content={"result": err_msg},
        )


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
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="static")


if __name__ == "__main__":
  uvicorn.run(app,host="0.0.0.0",port=8000)

# while True:
#   print("-----------------------------------------------")
#   question = input("Ask your question (q to quit):")
#   print("-----------------------------------------------")
#   if question == "f":
#     try:
#       filepath = filedialog.askopenfile()
#       #result = chain.invoke({"resume":filepath,"question":question})
#       print(filepath)
#     finally:
#       break
#   if question == "q":
#     break
#   result = chain.invoke({"question":question})
#   print(result)

# result = chain.invoke({"question":"I have a degree in Computer Science, how should I get a job in the software industry"})
# print(result)