from flask import Flask, render_template, jsonify, request, send_from_directory, make_response
from db import connect
import pymysql
import os

app = Flask(__name__)

conn = connect()

@app.route('/')
def index():
    return render_template('map.html')

@app.route('/static/Images/images/<path:filename>')
def serve_images(filename):
    image_folder = os.path.join("C:", os.sep, "Users", "Xander", "Documents", "japanmap", "static", "Images", "images")
    response = make_response(send_from_directory(image_folder, filename))
    response.cache_control.max_age = 86400
    return response

@app.route('/get_pois', methods=['GET'])
def get_pois():
    pois = []
    with conn.cursor() as cursor:
        cursor.execute('SELECT * FROM pois')
        for row in cursor.fetchall():
            pois.append({
                'id': row[0],
                'name': row[1],
                'description': row[2],
                'lat': row[3],
                'lng': row[4],
                'POItype': row[5]
            })
    return jsonify(pois)

@app.route('/add_poi', methods=['POST'])
def add_poi():
    data = request.get_json()
    name = data.get('name')
    description = data.get('description')
    lat = data.get('lat')
    lng = data.get('lng')
    POItype = data.get('POItype')
    ip_address = request.remote_addr  # Get the IP address of the client

    try:
        with conn.cursor() as cursor:
            cursor.execute("INSERT INTO pois (name, description, lat, lng, POItype, ip_address) VALUES (%s, %s, %s, %s, %s, %s)",
                           (name, description, lat, lng, POItype, ip_address))  # Add the IP address to the INSERT statement
            conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        print(e)
        return jsonify({'success': False})


@app.route('/get_poi_types', methods=['GET'])
def get_poi_types():
    POItype = []
    with conn.cursor() as cursor:
        cursor.execute('SELECT DISTINCT POItype FROM pois')
        for row in cursor.fetchall():
            POItype.append(row[0])
    return jsonify(POItype)

def fetch_new_pins_from_database():
    new_pins = []
    with conn.cursor() as cursor:
        # Modify the query to fetch only new pins
        cursor.execute('SELECT * FROM pois') 
        for row in cursor.fetchall():
            new_pins.append({
                'name': row[1],
                'description': row[2],
                'lat': row[3],
                'lng': row[4],
                'poiType': row[5]
            })
    return new_pins

@app.route('/get_new_pins', methods=['GET'])
def get_new_pins():
    new_pins = fetch_new_pins_from_database()
    return jsonify({
        'success': True,
        'pins': new_pins
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=1390)
