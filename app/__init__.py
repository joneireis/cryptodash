from flask import Flask

app = Flask(__name__)

# Importa as rotas
from app import routes
