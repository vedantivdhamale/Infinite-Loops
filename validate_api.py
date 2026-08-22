import urllib.request
import json

def test():
    # Load raw transactions
    with open("Frontend/src/data/transactions.json", "r") as f:
        txs = json.load(f)
    
    print(f"Loaded {len(txs)} transactions from frontend json.")
    
    # Test POST /score
    print("Sending POST request to /score...")
    req = urllib.request.Request(
        "http://localhost:8000/score",
        data=json.dumps(txs[:10]).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode('utf-8'))
            print(f"SUCCESS: /score returned {len(data)} results.")
    except Exception as e:
        print(f"FAILED: /score failed: {e}")
        
    # Test POST /customer-profiles
    print("Sending POST request to /customer-profiles...")
    req2 = urllib.request.Request(
        "http://localhost:8000/customer-profiles",
        data=json.dumps(txs[:10]).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req2) as res2:
            data2 = json.loads(res2.read().decode('utf-8'))
            print(f"SUCCESS: /customer-profiles returned {len(data2)} profiles.")
    except Exception as e:
        print(f"FAILED: /customer-profiles failed: {e}")

if __name__ == "__main__":
    test()
