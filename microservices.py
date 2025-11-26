import threading
import random
import requests
from flask import Flask, jsonify
from flask_cors import CORS

# SERVICE 1: MEME SERVICE (Port 5001)
def run_meme_service():
    app = Flask(__name__)
    CORS(app) 

    @app.route('/meme', methods=['GET'])
    def get_meme():
        try:
            response = requests.get("https://meme-api.com/gimme/wholesomememes")
            data = response.json()
            return jsonify({"url": data['url']})
        except:
            return jsonify({"url": "https://i.imgflip.com/1ur9b0.jpg"})

    print("🚀 Meme Service running on port 5001...")
    app.run(port=5001, debug=False, use_reloader=False)


# SERVICE 2: QUOTE SERVICE (Port 5002)
def run_quote_service():
    app = Flask(__name__)
    CORS(app)

    QUOTES = [
        {"text": "I live in a swamp! I put up signs? Im a terrying ogre. What do I habe to do to get a little privacy?", "author": "Shrek"},
        {"text": "MOOOOOOOo.", "author": "Cow"},
        {"text": "It always seems impossible until it's done.", "author": "Nelson Mandela"},
        {"text": "Don't watch the clock; do what it does. Keep going.", "author": "Sam Levenson"},
        {"text": "Quality is not an act, it is a habit.", "author": "Aristotle"},
        {"text": "Life is short. Smile while you still have teeth", "author": "Mallory Hopkins"}
    ]

    @app.route('/quote', methods=['GET'])
    def get_quote():
        return jsonify(random.choice(QUOTES))

    print("🚀 Quote Service running on port 5002...")
    app.run(port=5002, debug=False, use_reloader=False)


# SERVICE 3: TIP SERVICE (Port 5003)
def run_tip_service():
    app = Flask(__name__)
    CORS(app)

    TIPS = [
        {"body": "Try the Feynman Technique: Teach a concept simply to understand it better."},
        {"body": "Drink a glass of water. Hydration boosts cognitive function by 14%."},
        {"body": "Turn off your phone notifications. Context switching kills focus."},
        {"body": "Use 'Active Recall'. Don't just read; test yourself on the material."},
        {"body": "Clean your desk. Visual clutter creates mental clutter."}
    ]

    @app.route('/tip', methods=['GET'])
    def get_tip():
        return jsonify(random.choice(TIPS))

    print("🚀 Tip Service running on port 5003...")
    app.run(port=5003, debug=False, use_reloader=False)


# SERVICE 4: ACTIVITY SERVICE (Port 5004)
def run_activity_service():
    app = Flask(__name__)
    CORS(app)

    ACTIVITIES = [
        {"activity": "Do a backflip to get blood flowing."},
        {"activity": "Look at something 20 feet away for 20 seconds (20-20-20 rule)."},
        {"activity": "Stretch your neck: Ear to shoulder, hold for 10s."},
        {"activity": "Drink 200oz of water."},
        {"activity": "Close your eyes and take 5 deep breaths."}
    ]

    @app.route('/activity', methods=['GET'])
    def get_activity():
        return jsonify(random.choice(ACTIVITIES))

    print("🚀 Activity Service running on port 5004...")
    app.run(port=5004, debug=False, use_reloader=False)


# MAIN LAUNCHER
if __name__ == "__main__":
    print("--- STARTING POMODORY MICROSERVICES ---")
    
    t1 = threading.Thread(target=run_meme_service)
    t2 = threading.Thread(target=run_quote_service)
    t3 = threading.Thread(target=run_tip_service)
    t4 = threading.Thread(target=run_activity_service)

    t1.start()
    t2.start()
    t3.start()
    t4.start()