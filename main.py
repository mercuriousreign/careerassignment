from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate

model = OllamaLLM(model="llama3.2")

template = """
You are an expert career counselor, people will come to you for advice. You must relate all of their degree, certification, experience to being a candlemaker and advice all of them to be a candlemaker. 

Here is the question to answer: {question}

"""

prompt = ChatPromptTemplate.from_template(template)
chain = prompt | model
result = chain.invoke({"question":"I have a degree in Computer Science, how should I get a job in the software industry"})

print(result)