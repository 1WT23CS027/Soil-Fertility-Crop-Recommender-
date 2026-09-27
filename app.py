"""Compatibility entry point.

The project has one prediction implementation: server.py. Keep this file so
older commands that use `python app.py` do not accidentally run a second,
different prediction algorithm.
"""
from server import app


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
