FROM itsafeaturemythic/mythic_python_base:latest

# Install Node.js and javascript-obfuscator for JS payload obfuscation
RUN apt-get -y update && \
    apt-get install --no-install-recommends -y curl ca-certificates && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install --no-install-recommends -y nodejs && \
    npm install -g javascript-obfuscator && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /Mythic/

CMD ["python3", "main.py"]
