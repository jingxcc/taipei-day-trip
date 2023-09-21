from flask import Flask, render_template, request, jsonify, redirect, url_for
from routes.attraction import attraction_bp
from routes.user import user_bp

from flask_cors import CORS


app = Flask(__name__)
app.register_blueprint(attraction_bp)
app.register_blueprint(user_bp)

app.json.ensure_ascii = False
app.json.sort_keys = False
app.config["TEMPLATES_AUTO_RELOAD"] = True

cors = CORS(app, resources={r"/api/*": {"origins": "*"}})


# Pages
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/attraction/<id>")
def attraction(id):
    if not id.isdigit():
        return redirect(url_for("index"))

    return render_template("attraction.html")


@app.route("/booking")
def booking():
    return render_template("booking.html")


@app.route("/thankyou")
def thankyou():
    return render_template("thankyou.html")


if __name__ == "__main__":
    app.debug = True
    app.run(host="0.0.0.0", port=3000)
