import requests
from flask import render_template, jsonify
from app import app
import time

def get_bitcoin_price():
    retries = 3
    for attempt in range(retries):
        try:
            url = "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT"
            response = requests.get(url, timeout=10)
            print(f"Status Code (Price - Binance): {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                btc_price = float(data["price"])
                return int(btc_price)  # Arredondar para inteiro
            elif response.status_code == 429:
                print("Limite de requisições excedido (Binance). Tentando novamente em 5 segundos...")
                time.sleep(5)
                continue
            else:
                print(f"Erro ao buscar o preço (Binance). Status: {response.status_code}")
                return None
        except Exception as e:
            print("Erro ao buscar o preço (Binance):", e)
            if attempt < retries - 1:
                print("Tentando novamente em 5 segundos...")
                time.sleep(5)
                continue
            return None
    return None

def get_transaction_fee():
    retries = 3
    for attempt in range(retries):
        try:
            url = "https://mempool.space/api/v1/fees/recommended"
            response = requests.get(url, timeout=10)
            print(f"Status Code (Transaction Fee): {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Dados do Transaction Fee: {data}")
                return data['fastestFee']
            else:
                print(f"Erro ao buscar a taxa de transação. Status: {response.status_code}")
                if attempt < retries - 1:
                    print("Tentando novamente em 5 segundos...")
                    time.sleep(5)
                    continue
                return None
        except Exception as e:
            print("Erro ao buscar a taxa de transação:", e)
            if attempt < retries - 1:
                print("Tentando novamente em 5 segundos...")
                time.sleep(5)
                continue
            return None
    return None

def get_price_history():
    retries = 3
    for attempt in range(retries):
        try:
            url = "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=24"
            response = requests.get(url, timeout=10)
            print(f"Status Code (Price History - Binance): {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Dados recebidos (Price History - Binance): {data[:5]}")  # Mostra os primeiros 5 itens
                prices = [float(item[4]) for item in data]  # Preço de fechamento (close)
                print(f"Preços extraídos: {prices[:5]}")  # Debug dos preços extraídos
                return prices
            elif response.status_code == 429:
                print("Limite de requisições excedido (Binance). Tentando novamente em 5 segundos...")
                time.sleep(5)
                continue
            else:
                print(f"Erro ao buscar o histórico de preços (Binance). Status: {response.status_code}, Resposta: {response.text}")
                return None
        except Exception as e:
            print("Erro ao buscar o histórico de preços (Binance):", e)
            if attempt < retries - 1:
                print("Tentando novamente em 5 segundos...")
                time.sleep(5)
                continue
            return None
    return None

@app.route('/')
def index():
    btc_price = get_bitcoin_price()
    if btc_price is not None:
        return render_template('index.html', price=btc_price)
    else:
        return render_template('index.html', price="Erro ao buscar o preço")

@app.route('/get_price')
def get_price():
    btc_price = get_bitcoin_price()
    if btc_price is not None:
        return jsonify({"price": btc_price})
    else:
        return jsonify({"price": "Erro ao buscar o preço"}), 500

@app.route('/get_transaction_fee')
def get_transaction_fee_route():
    fee = get_transaction_fee()
    if fee is not None:
        return jsonify({"fee": fee})
    else:
        return jsonify({"fee": "Erro ao buscar a taxa"}), 500

@app.route('/get_price_history')
def get_price_history_route():
    prices = get_price_history()
    if prices is not None:
        return jsonify({"prices": prices})
    else:
        return jsonify({"prices": []}), 500