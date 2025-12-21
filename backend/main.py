import uvicorn

if __name__ == "__main__":
    # Reload=True is good for dev, pointing to the new app location
    uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=True)

