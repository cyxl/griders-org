from flask import Blueprint, render_template

routes = Blueprint("routes", __name__)


@routes.route("/")
@routes.route("/home")
def home():
    return render_template("home.html")


@routes.route("json-builder")
def jsonbuilder():
    return render_template("c-real-json-builder.html")
