from flask import Flask
import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())
SECRET_KEY = os.environ.get("SECRET_KEY")


def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = f"{SECRET_KEY}"

    from .routes import routes

    app.register_blueprint(routes, url_prefix="/")

    return app
