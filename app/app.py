import os

from flask import Flask, render_template, request, jsonify, redirect, url_for
from routes.attraction import attraction_bp
from routes.user import user_bp
from routes.booking import booking_bp
from routes.order import order_bp

from flask_cors import CORS


app = Flask(__name__)
app.register_blueprint(attraction_bp)
app.register_blueprint(user_bp)
app.register_blueprint(booking_bp)
app.register_blueprint(order_bp)

app.json.ensure_ascii = False
app.json.sort_keys = False
app.config["TEMPLATES_AUTO_RELOAD"] = True

cors = CORS(app, resources={r"/api/*": {"origins": "*"}})


# Pages
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/attraction/<int:attraction_id>")
def attraction(attraction_id):
    return render_template("attraction.html")


@app.route("/checkout/<int:booking_id>")
def checkout(booking_id):
    return render_template("checkout.html")


@app.route("/cart")
def cart():
    return render_template("cart.html")


@app.route("/thankyou")
def thankyou():
    order_number = request.args.get("number")
    if not order_number:
        return redirect(url_for("index"))
    
    return render_template("thankyou.html")


if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "false").lower() == "true"

    app.run(
        host="0.0.0.0",
        port=3000,
        debug=debug_mode,
    )
